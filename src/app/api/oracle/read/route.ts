import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-static';

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

    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader.length > 15) {
      const token = authHeader.split(" ")[1];
      try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        } else {
          console.warn("Token inválido ou expirado:", authError?.message);
        }
      } catch (e) {
        console.error("Erro ao validar token:", e);
      }
    }

    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, imageUrl } = body;

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

    console.log("--- INÍCIO DA REQUISIÇÃO ORÁCULO ---");
    console.log("Usuário ID Identificado:", userId);
    console.log("Tipo Oráculo:", tipoOraculo);
    console.log("Tipo Leitura:", tipoLeitura);
    console.log("Tema:", tema);

    // 2. Validação e Consumo de Créditos
    // Regra de negócio (função check_and_consume_reading no banco):
    //   - Trial de 24h após cadastro: leituras liberadas
    //   - Premium: até 5 leituras por dia
    //   - Trial expirado e sem premium: bloqueia (paywall)
    let creditStatus: any = { allowed: true, type: "open" };

    // A "mensagem do dia" é sempre gratuita e nunca consome créditos.
    if (tipoLeitura !== 'mensagem_dia' && userId) {
      try {
        const { data: gate, error: gateError } = await supabaseAdmin.rpc('check_and_consume_reading', { p_user_id: userId });

        if (gateError) {
          // Falha ao consultar o banco: libera por segurança para não quebrar a experiência,
          // mas registra para investigação.
          console.error("Erro ao validar créditos (liberando por segurança):", gateError.message);
        } else if (gate) {
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
      } catch (gateEx: any) {
        console.error("Exceção ao validar créditos (liberando por segurança):", gateEx?.message);
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
      instrucaoEspecifica = `FOCO MENSAGEM DO DIA: Gere uma mensagem curta, inspiradora e poética para o início do dia. 
      Ao final da mensagem, inclua SEMPRE uma "Dica da Alma" prática.
      Exemplos de dicas: Caminhar ao ar livre, meditar por 5 minutos, escrever no caderno da gratidão, cozinhar sua comida preferida, dar amor aos seus bichinhos de estimação, levá-los para passear, ou ir à academia.
      Use APENAS o campo 'acolhimento_quantum' (titulo e conteudo).`;
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
