import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";
import { isVipEmail } from "@/lib/vip";

// IMPORTANTE: esta rota PRECISA rodar por requisição (lê o header Authorization e
// consulta o banco). Com 'force-static' o Next 16 zera os headers em runtime, o
// que fazia o token nunca ser lido (userId nulo) e a trava/identificação falhar.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: "online", message: "Portal Oráculo está pronto para sintonização." });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verificar Autenticação (Bearer Token)
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    let userEmail: string | null = null;

    // [DIAGNÓSTICO TEMPORÁRIO] pistas sobre por que o login não é validado.
    const svcKeyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const urlPresent = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    let authDebug = 'sem header';

    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader.length > 15) {
      const token = authHeader.split(" ")[1];
      authDebug = 'header ok';
      try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
          userEmail = user.email ?? null;
        } else {
          authDebug = 'getUser erro: ' + (authError?.message || 'sem usuario');
          console.warn("Token inválido ou expirado:", authError?.message);
        }
      } catch (e: any) {
        authDebug = 'excecao: ' + (e?.message || String(e));
        console.error("Erro ao validar token:", e);
      }
    } else {
      authDebug = 'header ausente/curto: ' + (authHeader ? authHeader.substring(0, 14) : 'null');
    }

    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, imageUrl, usarCredito } = body;

    // RESPOSTA RÁPIDA (pergunta de acompanhamento): prompt enxuto p/ baixo custo de tokens.
    if (tipoLeitura === 'resposta_rapida') {
      const cartaRapida = Array.isArray(cartas) ? (cartas[0]?.name || cartas[0]) : cartas;
      const quickModel = getGeminiModel("gemini-3.1-flash-lite");
      const quickPrompt = `Você é um oráculo direto. O usuário perguntou: "${pergunta}". A carta sorteada foi: ${cartaRapida}. Responda de forma extremamente clara e objetiva, sem rodeios, em no máximo 2 frases curtas (limite estrito de 30 palavras). Apenas a resposta, em português do Brasil, sem explicações adicionais.`;
      let quickText = "";
      try {
        const quickResult = await quickModel.generateContent({
          contents: [{ role: "user", parts: [{ text: quickPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 80 } as any
        });
        quickText = (quickResult?.response?.text() || "").trim();
      } catch (e: any) {
        console.error("Erro na resposta rápida:", e?.message);
      }
      const quickResponse = NextResponse.json({ resposta_rapida: quickText || "As energias pedem silêncio neste instante. Tente novamente em paz." });
      quickResponse.headers.set('Access-Control-Allow-Origin', '*');
      return quickResponse;
    }

    // CONSELHO DO DIA (adivinhatório): previsão curta e mística baseada em 1 arcano.
    if (tipoLeitura === 'conselho_dia') {
      const cartaC = Array.isArray(cartas) ? (cartas[0]?.name || cartas[0]) : cartas;
      const cModel = getGeminiModel("gemini-3.1-flash-lite");
      const cPrompt = `Você é um oráculo místico e adivinhatório. Baseado na carta "${cartaC}" do oráculo ${tipoOraculo}, revele uma PREVISÃO curta e envolvente para o dia de hoje: o que os astros/energias sinalizam, o que pode acontecer, no que prestar atenção. Comece citando o nome da carta. Tom místico, adivinhatório e acolhedor (nada genérico). Máximo 2 frases (até 35 palavras). Português do Brasil. Apenas a previsão, sem introduções.`;
      let cText = "";
      try {
        const cResult = await cModel.generateContent({
          contents: [{ role: "user", parts: [{ text: cPrompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 90 } as any
        });
        cText = (cResult?.response?.text() || "").trim();
      } catch (e: any) {
        console.error("Erro no conselho do dia:", e?.message);
      }
      const cResponse = NextResponse.json({ resposta_rapida: cText || "O oráculo sussurra em silêncio hoje. Volte em instantes." });
      cResponse.headers.set('Access-Control-Allow-Origin', '*');
      return cResponse;
    }

    console.log("--- INÍCIO DA REQUISIÇÃO ORÁCULO ---");
    console.log("Usuário ID Identificado:", userId);
    console.log("Tipo Oráculo:", tipoOraculo);
    console.log("Tipo Leitura:", tipoLeitura);
    console.log("Tema:", tema);

    // 2. Validação e Consumo de Créditos
    // Regra de negócio (função check_and_consume_reading no banco):
    //   - Premium: até 5 leituras por dia
    //   - Não premium: 1 leitura grátis por conta (vitalícia); depois, paywall
    let creditStatus: any = { allowed: true, type: "open" };

    // VIP: emails da allowlist têm tiragens ILIMITADAS — nunca passam pelo controle
    // de créditos (nem paywall, nem limite diário).
    const isVip = isVipEmail(userEmail);

    // Crédito avulso/bônus (avaliar o app): o app já debitou o crédito no aparelho,
    // então esta leitura NÃO passa pelo controle de grátis do servidor.
    const temCredito = usarCredito === true;

    // A "mensagem do dia" é sempre gratuita e nunca consome créditos.
    // Para qualquer OUTRA leitura de conta comum (não VIP, sem crédito avulso), o
    // acesso SÓ é liberado se o servidor confirmar pela regra "1 grátis por conta".
    // FAIL-CLOSED: sem identidade válida ou com erro no banco, NÃO liberamos — caso
    // contrário a trava perde o efeito e a pessoa faz leituras ilimitadas de graça.
    if (tipoLeitura !== 'mensagem_dia' && !isVip && !temCredito) {
      // Sem userId (token ausente/expirado/ inválido) não há como garantir o limite:
      // pede novo login em vez de liberar.
      // [DIAGNÓSTICO TEMPORÁRIO] retorna 403 com mensagem clara para o app exibir.
      if (!userId) {
        const authResponse = NextResponse.json(
          { reason: 'auth', message: `A1 | svcKey=${svcKeyPresent} url=${urlPresent} | ${authDebug}` },
          { status: 403 }
        );
        authResponse.headers.set('Access-Control-Allow-Origin', '*');
        return authResponse;
      }

      let gate: any = null;
      let gateErrMsg: string | null = null;
      try {
        const rpc = await supabaseAdmin.rpc('check_and_consume_reading', { p_user_id: userId });
        if (rpc.error) {
          gateErrMsg = rpc.error.message || JSON.stringify(rpc.error);
          console.error("Erro ao validar créditos (bloqueando por segurança):", gateErrMsg);
        } else {
          gate = rpc.data;
        }
      } catch (gateEx: any) {
        gateErrMsg = gateEx?.message || String(gateEx);
        console.error("Exceção ao validar créditos (bloqueando por segurança):", gateErrMsg);
      }

      // Erro/indisponibilidade do banco → NÃO libera (erro temporário, não leitura grátis).
      // [DIAGNÓSTICO TEMPORÁRIO] retorna 403 com o erro real do banco para o app exibir.
      if (!gate) {
        const errResponse = NextResponse.json(
          { reason: 'error', message: 'DIAGNÓSTICO D2 (erro no banco): ' + (gateErrMsg || 'sem detalhe') },
          { status: 403 }
        );
        errResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errResponse;
      }

      creditStatus = gate;
      if (!gate.allowed) {
        console.log("Leitura bloqueada pela regra de acesso:", gate);
        const blockResponse = NextResponse.json(
          { reason: gate.reason || 'paywall', message: gate.message || 'Acesso premium necessário para continuar.' },
          { status: 403 }
        );
        blockResponse.headers.set('Access-Control-Allow-Origin', '*');
        return blockResponse;
      }
    }

    // 3. Inicialização do Modelo Gemini
    console.log("Sintonizando com o Modelo Gemini...");
    
    // Customizar instruções baseado no tipo de leitura
    let instrucaoEspecifica = "";
    if (tipoLeitura === 'sim_nao') {
      instrucaoEspecifica = `FOCO SIM OU NÃO:
      - Responda apenas se SIM, NÃO ou TALVEZ de forma objetiva.
      - DEIXE os campos 'situacao_atual', 'caminho_acao' e 'resultado_conselho' como NULL.
      - Use o campo 'carta_sorteada' para o motivo técnico e 'leitura_caminho.veredito_direto' para o veredito.`;
    } else if (tipoLeitura === 'mensagem_dia') {
      {
        // Tema sorteado a cada dia: força variedade e evita mensagens repetitivas
        const TEMAS_DICA = [
          'contato com a natureza', 'movimento e corpo', 'criatividade e arte', 'silêncio e pausa',
          'reconectar com alguém querido', 'água (banho, chuva, mar)', 'música que emociona',
          'organizar um cantinho da casa', 'cozinhar algo afetivo', 'respiração consciente',
          'luz do sol na pele', 'escrever um pensamento solto', 'gentileza com um desconhecido',
          'descanso sem culpa', 'aprender algo pequeno e novo', 'cuidar de uma planta',
          'aromas e perfumes', 'um abraço demorado', 'dançar sozinha', 'contemplar o céu',
          'soltar algo que pesa', 'agradecer em voz alta', 'brincar com um animal',
          'caminhar sem pressa', 'beber água com atenção', 'ouvir o próprio corpo'
        ];
        const temaDica = TEMAS_DICA[Math.floor(Math.random() * TEMAS_DICA.length)];
        instrucaoEspecifica = `FOCO MENSAGEM DO DIA: Gere UMA única mensagem curta, inspiradora e poética para o início do dia (3 a 4 frases no máximo).

        Ao final, inclua UMA "Dica da Alma" prática e original.
        A dica de HOJE deve ser sobre o tema: "${temaDica}".

        REGRAS IMPORTANTES:
        - Crie a dica DENTRO desse tema, de um jeito específico e criativo (não genérico).
        - NUNCA use clichês repetidos como "caderno de gratidão", "diário de gratidão" ou "faça uma lista".
        - Varie o vocabulário e as imagens poéticas. Não repita estruturas de mensagens anteriores.
        - É UMA mensagem só, com UMA dica só.

        Use APENAS o campo 'acolhimento_quantum' (titulo e conteudo).`;
      }
    } else if (tipoLeitura === 'foto') {
      instrucaoEspecifica = `FOCO IDENTIFICAÇÃO DE FOTO: Você recebeu uma foto de cartas reais de Oráculo (Tarô, Cigano ou Anjos). 
      Sua tarefa prioritária é IDENTIFICAR quais cartas estão na imagem. 
      No JSON, coloque o nome identificado no campo 'carta' de cada seção. 
      Se for apenas 1 carta, use o campo 'carta_sorteada'. Se forem 3, use 'situacao_atual', 'caminho_acao' e 'resultado_conselho'.`;
    } else {
      instrucaoEspecifica = `FOCO LEITURA COMPLETA: Analise profundamente as 3 cartas enviadas. Use os campos 'situacao_atual', 'caminho_acao' e 'resultado_conselho'.`;
    }

    const systemInstruction = `
      Você é o "Psiquê Oráculo", um mentor de alma e autoridade mística (Voz: Junguiana, Poética, Empática).
      Responda RIGOROSAMENTE em PORTUGUÊS DO BRASIL em formato JSON puro, sem marcações de markdown.

      ORÁCULO ATUAL: ${tipoOraculo}
      TIPO DE LEITURA: ${tipoLeitura}
      ${instrucaoEspecifica}

      IDENTIFICAÇÃO VISUAL (PARA FOTOS):
      - Se uma imagem for fornecida, analise-a com extremo cuidado para identificar as cartas.
      - Use sua base de conhecimento sobre Tarot, Baralho Cigano e Tarot dos Anjos para reconhecer as ilustrações.
      - Se a imagem estiver escura ou difícil, faça a melhor leitura possível baseada nos símbolos visíveis.

      REGRAS POR ORÁCULO (cada oráculo TEM UMA IDENTIDADE PRÓPRIA — respeite os campos exatos):

      1. TARÔ CLÁSSICO — Voz arquetípica, junguiana e poética (interpretação mais profunda e simbólica).
         PREENCHA OBRIGATORIAMENTE em 'ancoragem_rituais':
            - 'mantra': um "Mantra da Alma" curto e poderoso (afirmação na 1ª pessoa).
            - 'biblia': um versículo de acolhimento (opcional, se fizer sentido).
         DEIXE COMO NULL: 'banho', 'salmo', 'dica_angelical'.

      2. BARALHO CIGANO — Voz PREDITIVA, DIRETA e OBJETIVA (respostas práticas, sem rodeios, foco no concreto do dia a dia).
         Identifique Nome + Número da carta.
         PREENCHA OBRIGATORIAMENTE em 'ancoragem_rituais':
            - 'salmo': uma "Dica da Cigana" — uma SIMPATIA leve e prática (ex: com sal grosso, fita, vela, ervas).
            - 'banho': um BANHO ou ERVA mística com instrução clara (qual erva e como usar).
         DEIXE COMO NULL: 'mantra', 'biblia', 'dica_angelical'.

      3. TARÔ DOS ANJOS — Voz de amparo celestial e devocional. Cite o Nome do Anjo.
         PREENCHA OBRIGATORIAMENTE em 'ancoragem_rituais':
            - 'salmo': um SALMO real (com número, ex: "Salmo 91") apropriado ao momento.
            - 'biblia': um Versículo bíblico de conforto.
            - 'dica_angelical': um RITUAL ANGELICAL completo (foco_oracao, vela_cor, ritual_dias, dica_texto).
         DEIXE COMO NULL: 'mantra', 'banho'.

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      - OBJETIVIDADE: Esta deve ser direta. 
      - VEREDITO: No campo "veredito_direto", use APENAS: "SIM", "NÃO" ou "TALVEZ".
      - MOTIVO: Justificativa curta no campo 'carta_sorteada.interpretacao'.

      CONSELHO DO PSICÓLOGO: Tom humanista, acolhedor e poético. "Abraço em palavras".

      PERGUNTA SUGERIDA: Ao final da leitura, com base no contexto do que foi respondido, gere UMA única sugestão de pergunta curta de acompanhamento que o usuário provavelmente faria agora (ex: "Quer saber quando isso vai acontecer?", "Qual o maior obstáculo?", "E na vida amorosa?"). Coloque essa frase curta no campo 'pergunta_sugerida'. Para a leitura "mensagem_dia", deixe 'pergunta_sugerida' como null.

      ESTRUTURA JSON OBRIGATÓRIA (Mantenha todos os valores em PORTUGUÊS):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "NOME DO ARCANO", "interpretacao": "ANÁLISE" },
        "caminho_acao": { "carta": "NOME DO ARCANO", "interpretacao": "CONSELHO" },
        "resultado_conselho": { "carta": "NOME DO ARCANO", "interpretacao": "DESDOBRAMENTO" }, 
        "carta_sorteada": { "carta": "NOME DO ARCANO", "interpretacao": "MOTIVO DIRETO" },
        "leitura_caminho": {
          "titulo": "Título",
          "analise_detalhada": "SÍNTESE DAS CARTAS",
          "veredito_direto": "SIM ou NÃO ou TALVEZ"
        },
        "acolhimento_quantum": { "titulo": "Sabedoria", "conteudo": "Reflexão" },
        "pergunta_sugerida": "Pergunta curta de acompanhamento (ou null na mensagem do dia)",
        "acolhimento_psicologico": {
          "titulo": "Um Espaço de Escuta e Acolhimento",
          "conteudo": "Análise profunda com tom de psicólogo renomado e empático."
        },
        "ancoragem_rituais": {
          "mantra": "Mantra da Alma",
          "salmo": "Salmo ou Dica da Cigana",
          "banho": "Banho ou Erva",
          "biblia": "Versículo de Acolhimento",
          "dica_angelical": { "foco_oracao": "...", "vela_cor": "...", "ritual_dias": "...", "dica_texto": "..." }
        }
      }
    `;

    const modelName = "gemini-3.1-flash-lite";
    // A API do Gemini fica instável ao combinar IMAGEM + ferramenta de busca + resposta JSON.
    // Quando há foto (tiragem física), desligamos o googleSearch para a identificação funcionar.
    const temImagem = typeof imagem === 'string' && imagem.includes("base64,");
    const tools = temImagem ? undefined : [{ googleSearch: {} }];
    const model = getGeminiModel(modelName, systemInstruction, tools);

    const nomesDasCartas = Array.isArray(cartas) 
      ? cartas.map(c => typeof c === 'string' ? c : (c.name || c.carta)).join(", ") 
      : (typeof cartas === 'string' ? cartas : "Aguardando identificação via Imagem...");

    const prompt = `DADOS DA CONSULTA:
Consulente: ${body.userName || "Alma Querida"}
Tema: ${tema}
Pergunta/Desabafo: "${pergunta || "Sintonização Geral"}"
Cartas Sorteada: ${nomesDasCartas}
Método: ${tipoLeitura}
Semente Energética: ${Math.random().toString(36).substring(7)}

Por favor, analise as cartas acima (ou identifique-as na imagem fornecida) e responda no formato JSON solicitado. IDENTIFIQUE AS CARTAS CORRETAMENTE PELO NOME EM PORTUGUÊS NO JSON.`;

    console.log("Enviando requisição otimizada para o Portal...");
    const parts: any[] = [{ text: prompt }];
    
    if (imagem && imagem.includes("base64,")) {
      const base64Data = imagem.split("base64,")[1];
      const mimeType = imagem.split(";")[0].split(":")[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    let responseText = "";
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        console.log(`Tentativa ${attempts + 1} com o modelo: ${modelName}`);
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
            maxOutputTokens: 2000,
            thinkingConfig: {
               includeThoughts: true,
               thinkingLevel: "MINIMAL"
            }
          } as any
        });

        if (!result || !result.response) {
          throw new Error("A IA não retornou uma resposta válida.");
        }

        responseText = result.response.text();
        console.log("Resposta recebida com sucesso do Portal.");
        break; 
      } catch (aiError: any) {
        attempts++;
        const errorMessage = aiError.message || "Erro desconhecido";
        console.error(`Falha na sintonização (Tentativa ${attempts}):`, errorMessage);

        if (attempts >= maxAttempts) {
          throw new Error(`Conexão com o modelo 3.1 falhou. Detalhes: ${errorMessage}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    let jsonResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleanedResponse = jsonMatch ? jsonMatch[0] : responseText;
      jsonResponse = JSON.parse(cleanedResponse);

      if (jsonResponse?.leitura_caminho?.veredito_direto) {
        let v = jsonResponse.leitura_caminho.veredito_direto.toString().toUpperCase();
        if (/\bNO\b/.test(v) || v.includes('NÃO')) {
          jsonResponse.leitura_caminho.veredito_direto = 'NÃO';
        } else if (/\bYES\b/.test(v) || v.includes('SIM')) {
          jsonResponse.leitura_caminho.veredito_direto = 'SIM';
        } else if (/\bMAYBE\b/.test(v) || v.includes('TALVEZ')) {
          jsonResponse.leitura_caminho.veredito_direto = 'TALVEZ';
        }
      }
    } catch (parseError: any) {
      console.error("Erro ao parsear JSON da IA. Resposta bruta:", responseText);
      throw new Error(`O Oráculo retornou um formato inesperado. Detalhes: ${responseText.substring(0, 50)}...`);
    }

    // 5. Salvando no Histórico
    try {
        console.log("Salvando leitura no histórico...");
        await supabaseAdmin.from("historico_leituras").insert({
            user_id: userId,
            tipo_oraculo: tipoOraculo,
            tipo_leitura: tipoLeitura,
            pergunta_tema: tema + (pergunta ? ": " + pergunta : ""),
            resposta_ia: jsonResponse
        });
        console.log("Histórico salvo com sucesso.");
    } catch (e) { 
      console.warn("Falha ao salvar histórico:", e); 
    }

    const response = NextResponse.json({
      ...jsonResponse,
      usage: creditStatus
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error: any) {
    console.error("Erro na API Business:", error);
    const errorResponse = NextResponse.json({ error: "Falha na conexão sagrada", details: error.message }, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
