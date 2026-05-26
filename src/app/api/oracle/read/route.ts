import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verificar Autenticação (Bearer Token)
    const authHeader = req.headers.get("Authorization");
    let userId = null; // null permite salvar histórico sem vínculo se o DB permitir, ou evitamos salvar

    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null") {
      const token = authHeader.split(" ")[1];
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, imageUrl, audio } = body;

    console.log("Requisitando Oráculo para Usuário:", userId);

    // 2. Validação e Consumo de Créditos (TEMPORARIAMENTE DESATIVADO PARA TESTES)
    let creditStatus = { allowed: true, type: "test_mode" };

    /* ... código de créditos ... */

    // 3. Inicialização do Modelo Gemini
    console.log("Sintonizando com o Modelo Gemini...");
    const model = getGeminiModel();

    const isVision = tipoLeitura === 'foto' && (imagem || imageUrl);

    const systemInstruction = `
      Você é o "Psiquê Oráculo", um mentor de alma e autoridade mística.
      
      ORÁCULO ATUAL: ${tipoOraculo}
      
      ESPECIALIZAÇÃO DOS ORÁCULOS (Siga RIGOROSAMENTE):
      
      1. TARÔ:
         - Foco: Arquetípico, Filosófico e Vibracional.
         - Entrega Obrigatória: Mencione explicitamente o nome de cada ARCANO no início da interpretação. Use um "Mantra da Alma" piscante ao final.

      2. BARALHO CIGANO:
         - Foco: Preditivo, Direto e Prático.
         - Entrega Obrigatória: Identifique o nome da carta e seu número. Entregue "Banho", "Cristal" e "Erva".

      3. TARÔ DOS ANJOS:
         - Foco: Amparo, Paz e Frequência Angelical.
         - Entrega Obrigatória: Nomeie a carta do Anjo. Entregue "Salmo", "Arcanjo" e "Sinal".

      INSTRUÇÕES DE TIRAGEM (3 CARTAS - Situação/Conselho/Resultado):
      - PROFUNDIDADE: Esta é uma leitura densa e narrativa. Não seja objetivo aqui. Explore os símbolos, as cores e as conexões entre as cartas. Cada parágrafo deve ter pelo menos 4 a 5 frases ricas. 
      - IDENTIFICAÇÃO: Inicie cada interpretação com: "[NOME DO ARCANO]: [Sua análise profunda...]".

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      - OBJETIVIDADE: Esta sim deve ser direta e rápida. 
      - VEREDITO: Responda SIM, NÃO ou TALVEZ na primeira linha.
      - MOTIVO: 2 frases preditivas mencionando o nome da carta.

      CONSELHO DO PSICÓLOGO (TOM QUÂNTICO):
      - Transforme a análise em um "Acolhimento Psicofísico-Quântico".
      - Fale sobre saltos quânticos, frequências vibracionais, colapso de função de onda (escolhas) e o campo das infinitas possibilidades. 
      - Una a psicologia clínica com a espiritualidade de vanguarda. Use termos como "Sintonização de Realidade", "Frequência da Cura" e "Expansão de Consciência".

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "NOME DO ARCANO", "interpretacao": "ANÁLISE PROFUNDA E EXTENSA" },
        "caminho_acao": { "carta": "NOME DO ARCANO", "interpretacao": "CONSELHO PRÁTICO E PROFUNDO" },
        "resultado_conselho": { "carta": "NOME DO ARCANO", "interpretacao": "DESDOBRAMENTO NARRATIVO E RICO" },
        "carta_sorteada": { "carta": "NOME DO ARCANO", "interpretacao": "MOTIVO DIRETO" },
        "leitura_caminho": { 
          "titulo": "Título", 
          "analise_detalhada": "SÍNTESE NARRATIVA RICA E CONECTADA DAS 3 CARTAS", 
          "veredito_direto": "VEREDITO" 
        },
        "acolhimento_quantum": { "titulo": "Sabedoria", "conteudo": "Reflexão" },
        "acolhimento_psicologico": {
          "titulo": "Sintonização Psicofísica-Quântica",
          "conteudo": "Análise profunda com tom de psicólogo renomado de abordagem quântica (vibracional e técnica)."
        },
        "ancoragem_rituais": { "mantra": "Mantra ou Cristal", "salmo": "Ritual ou Salmo", "banho": "Banho ou Sinal", "biblia": "Nota" }
      }
    `;

    const prompt = `Consulente: ${body.userName || "Alma Querida"}. Tema: ${tema}. Pergunta/Desabafo: ${pergunta || "Sintonização Geral"}. Cartas Sorteada (se houver): ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Análise via Imagem"}. Método: ${tipoLeitura}. Semente Energética: ${Math.random().toString(36).substring(7)}.`;

    console.log("Enviando prompt para a IA...");
    // 4. Chamada da IA com suporte a Imagem (Vision)
    const parts: any[] = [{ text: systemInstruction + prompt }];
    
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
          maxOutputTokens: 1200,
        }
      });

      console.log("Resposta recebida da IA.");
      responseText = result.response.text();
      console.log("Conteúdo da Resposta:", responseText);
    } catch (aiError: any) {
      console.error("ERRO CRÍTICO NA IA:", aiError);
      throw new Error(`Erro na IA (${aiError.status || 'IA-Error'}): ${aiError.message}`);
    }

    const jsonResponse = JSON.parse(responseText);

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

    // Adicionar headers CORS
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
