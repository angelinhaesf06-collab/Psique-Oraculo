import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

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

    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null") {
      const token = authHeader.split(" ")[1];
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, imageUrl } = body;

    console.log("--- INÍCIO DA REQUISIÇÃO ORÁCULO ---");
    console.log("Usuário ID:", userId);
    console.log("Tipo Oráculo:", tipoOraculo);
    console.log("Tipo Leitura:", tipoLeitura);
    console.log("Tema:", tema);

    // 2. Validação e Consumo de Créditos
    let creditStatus = { allowed: true, type: "anonymous" };
    
    if (userId) {
      const { data: checkData, error: checkError } = await supabaseAdmin.rpc('check_and_consume_reading', {
        p_user_id: userId
      });

      if (checkError) {
        console.error("Erro ao validar créditos:", checkError);
        throw new Error("Erro ao validar créditos.");
      }

      creditStatus = checkData;

      if (!creditStatus.allowed) {
        return NextResponse.json({ 
          error: creditStatus.message || "Créditos esgotados.", 
          reason: creditStatus.reason || "credits_exhausted" 
        }, { status: 403 });
      }
    } else {
      // Opcional: Permitir algumas leituras anônimas ou bloquear
      // Para este projeto, o login é obrigatório conforme as telas mostradas
    }

    // 3. Inicialização do Modelo Gemini
    console.log("Sintonizando com o Modelo Gemini...");
    
    // Customizar instruções baseado no tipo de leitura
    let instrucaoEspecifica = "";
    if (tipoLeitura === 'sim_nao') {
      instrucaoEspecifica = `FOCO SIM OU NÃO: Responda de forma objetiva se SIM, NÃO ou TALVEZ. Use o campo 'carta_sorteada' e 'leitura_caminho.veredito_direto'.`;
    } else if (tipoLeitura === 'mensagem_dia') {
      instrucaoEspecifica = `FOCO MENSAGEM DO DIA: Gere uma mensagem curta, inspiradora e poética para o início do dia. 
      Ao final da mensagem, inclua SEMPRE uma "Dica da Alma" prática.
      Exemplos de dicas: Caminhar ao ar livre, meditar por 5 minutos, escrever no caderno da gratidão, cozinhar sua comida preferida, dar amor aos seus bichinhos de estimação, levá-los para passear, ou ir à academia.
      Use APENAS o campo 'acolhimento_quantum' (titulo e conteudo).`;
    } else {
      instrucaoEspecifica = `FOCO LEITURA COMPLETA: Analise profundamente as 3 cartas enviadas. Use os campos 'situacao_atual', 'caminho_acao' e 'resultado_conselho'.`;
    }

    const systemInstruction = `
      Você é o "Psiquê Oráculo", um mentor de alma e autoridade mística.
      Sua voz é sofisticada, empática e poética. Você integra a sabedoria dos oráculos com a Psicologia Analítica.
      Responda RIGOROSAMENTE em PORTUGUÊS DO BRASIL.
      Responda EXCLUSIVAMENTE em formato JSON puro. 
      NÃO adicione saudações, introduções, "Okay", ou qualquer texto fora do objeto JSON.
      NÃO use marcações de markdown como \`\`\`json.

      ORÁCULO ATUAL: ${tipoOraculo}
      TIPO DE LEITURA: ${tipoLeitura}
      ${instrucaoEspecifica}
      
      ESPECIALIZAÇÃO DOS ORÁCULOS (Siga RIGOROSAMENTE):
      
      1. TARÔ:
         - Foco: Arquetípico, Filosófico e Vibracional.
         - Entrega Obrigatória: Mencione explicitamente o nome de cada ARCANO no início da interpretação em PORTUGUÊS. Use um "Mantra da Alma" piscante ao final.

      2. BARALHO CIGANO:
         - Foco: Preditivo, Direto e Prático.
         - Entrega Obrigatória: Identifique o nome da carta e seu número. Entregue "Banho", "Cristal", "Erva" e, no campo 'salmo', entregue uma "Dica da Cigana" (uma simpatia leve, pequeno ritual ou ação prática e positiva) relacionada ao tema.

      3. TARÔ DOS ANJOS:
         - Foco: Amparo, Paz e Frequência Angelical.
         - Entrega Obrigatória: Nomeie a carta do Anjo. Entregue "Salmo" (com um trecho real do salmo), "Arcanjo" e "Dizeres da Bíblia" (um versículo bíblico de acolhimento).
         - Dica Angelical: No campo 'dica_angelical', entregue um ritual com: 'foco_oracao' (tema), 'vela_cor' (cor da vela), 'ritual_dias' (duração) e 'dica_texto' (instrução complementar).
         - REGRAS RÍGIDAS: NUNCA entregue "Banhos" ou "Ervas" neste oráculo. Deixe o campo 'banho' VAZIO ou nulo.

      INSTRUÇÕES DE TIRAGEM (3 CARTAS - Situação/Conselho/Resultado):
      - PROFUNDIDADE: Esta é uma leitura densa e narrativa. Não seja objetivo aqui. Explore os símbolos, as cores e as conexões entre as cartas. Cada parágrafo deve ter pelo menos 4 a 5 frases ricas. 
      - IDENTIFICAÇÃO: Inicie cada interpretação com: "[NOME DO ARCANO EM PORTUGUÊS]: [Sua análise profunda...]".
      - VISÃO FÍSICA (FOTO): Se o TIPO DE LEITURA for 'foto', o campo "carta" de cada posição ('situacao_atual', 'caminho_acao', 'resultado_conselho') DEVE CONTER O NOME EXATO DA CARTA que você identificou na imagem enviada. NÃO invente nomes.

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      - OBJETIVIDADE: Esta sim deve ser direta e rápida. 
      - VEREDITO: No campo "veredito_direto", use APENAS as palavras: "SIM", "NÃO" ou "TALVEZ". NUNCA use "YES" ou "NO".
      - MOTIVO: 2 frases preditivas em português mencionando o nome da carta, respondendo DIRETAMENTE à pergunta do consulente.

      CONSELHO DO PSICÓLOGO (TOM HUMANISTA E ACOLHEDOR):
      - Imagine um psicólogo de renome que é, acima de tudo, um ser humano profundamente empático e gentil.
      - O tom deve ser um "Abraço em Palavras". Use uma linguagem suave, acolhedora e validadora em PORTUGUÊS. 
      - Fale diretamente ao coração do consulente sobre sua questão ou pergunta específica.
      - Use conceitos de "possibilidades" e "vibração" de forma sutil e poética, sem ser excessivamente técnico ou frio.
      - O objetivo principal é fazer a pessoa se sentir ouvida, compreendida e amparada emocionalmente. 
      - Evite termos complexos da física; foque na jornada da alma, no autocuidado e na paz interior.

      ESTRUTURA JSON OBRIGATÓRIA (Mantenha todos os valores em PORTUGUÊS):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "NOME DO ARCANO DA FOTO OU SORTEIO", "interpretacao": "ANÁLISE PROFUNDA E EXTENSA" },
        "caminho_acao": { "carta": "NOME DO ARCANO DA FOTO OU SORTEIO", "interpretacao": "CONSELHO PRÁTICO E PROFUNDO" },
        "resultado_conselho": { "carta": "NOME DO ARCANO DA FOTO OU SORTEIO", "interpretacao": "DESDOBRAMENTO NARRATIVO E RICO" },
        "carta_sorteada": { "carta": "NOME DO ARCANO", "interpretacao": "MOTIVO DIRETO E RESPOSTA À PERGUNTA" },
        "leitura_caminho": { 
          "titulo": "Título", 
          "analise_detalhada": "SÍNTESE NARRATIVA RICA E CONECTADA DAS 3 CARTAS", 
          "veredito_direto": "SIM ou NÃO ou TALVEZ" 
        },
        "acolhimento_quantum": { "titulo": "Sabedoria", "conteudo": "Reflexão" },
        "acolhimento_psicologico": {
          "titulo": "Um Espaço de Escuta e Acolhimento",
          "conteudo": "Análise profunda em PORTUGUÊS com tom de psicólogo renomado."
        },
        "ancoragem_rituais": { 
          "mantra": "Mantra da Alma (Para Tarô ou Cigano)", 
          "salmo": "Salmo com trecho (Para Anjos) ou Dica da Cigana (Para Cigano)", 
          "banho": "Sugestão de Banho ou Erva (Para Cigano)", 
          "biblia": "Dizeres da Bíblia / Versículo de Acolhimento (Apenas para Anjos)",
          "dica_angelical": {
            "foco_oracao": "Tema central",
            "vela_cor": "Cor da vela",
            "ritual_dias": "Duração do ritual",
            "dica_texto": "Instrução complementar"
          }
        }
      }
    `;

    let model;
    try {
      model = getGeminiModel("gemini-3.1-flash-lite", systemInstruction);
    } catch (e: any) {
      console.error("Erro ao obter modelo Gemini:", e.message);
      throw new Error("Configuração da IA inválida.");
    }

    const nomesDasCartas = Array.isArray(cartas) 
      ? cartas.map(c => typeof c === 'string' ? c : (c.name || c.carta)).join(", ") 
      : (typeof cartas === 'string' ? cartas : "Aguardando identificação via Imagem...");

    // Construção do prompt mais clara para a IA separar pergunta de metadados
    const prompt = `DADOS DA CONSULTA:
Consulente: ${body.userName || "Alma Querida"}
Tema: ${tema}
Pergunta/Desabafo: "${pergunta || "Sintonização Geral"}"
Cartas Sorteada: ${nomesDasCartas}
Método: ${tipoLeitura}
Semente Energética: ${Math.random().toString(36).substring(7)}

Por favor, analise as cartas acima (ou identifique-as na imagem fornecida) e responda no formato JSON solicitado. IDENTIFIQUE AS CARTAS CORRETAMENTE PELO NOME EM PORTUGUÊS NO JSON.`;

    console.log("Enviando prompt para a IA (Modo Rápido)...");
    const parts: any[] = [{ text: prompt }];
    
    if (imagem && imagem.includes("base64,")) {
      console.log("Adicionando imagem ao prompt...");
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
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
          maxOutputTokens: 2000
        } as any
      });

      console.log("Resposta recebida da IA.");
      responseText = result.response.text();
      
      // Log da resposta bruta para depuração (pode ser visto nos logs do servidor)
      console.log("Conteúdo bruto da resposta:", responseText.substring(0, 200) + "...");
    } catch (aiError: any) {
      console.error("ERRO CRÍTICO NA IA:", aiError);
      throw new Error(`Erro na IA (${aiError.status || 'IA-Error'}): ${aiError.message}`);
    }

    let jsonResponse;
    try {
      // Tentar extrair apenas o JSON da resposta, caso a IA tenha incluído conversa ou markdown
      // Isso resolve o erro "Unexpected token 'O', 'Okay, I'm '..."
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleanedResponse = jsonMatch ? jsonMatch[0] : responseText;
      jsonResponse = JSON.parse(cleanedResponse);

      // Trava de Segurança: Forçar a tradução caso a IA alucine em inglês no Bússola Sim ou Não
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
