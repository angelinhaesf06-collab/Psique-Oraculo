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
         - Foco: Arquetípico e Filosófico.
         - Entrega Obrigatória: Apenas um "Mantra da Alma" curto e poderoso no campo "ancoragem_rituais.mantra".
         - Outros campos de rituais devem ser null.

      2. BARALHO CIGANO:
         - Foco: Preditivo, Direto e Prático.
         - Entrega Obrigatória: "Banho de Ervas" (campo banho), "Cristal de Poder" (campo mantra) e "Dica de Erva" (campo biblia).
         - O tom deve ser "Quiet Luxury" adivinhatório.

      3. TARÔ DOS ANJOS:
         - Foco: Amparo, Paz e Conexão Celestial.
         - Entrega Obrigatória: "Salmo ou Versículo" (campo salmo), "Arcanjo Protetor" (campo mantra) e "Sinal Angelical" (campo banho).
         - O tom deve ser amoroso e protetor.

      INSTRUÇÕES DE TIRAGEM (3 CARTAS - Situação/Caminho/Resultado):
      - Interprete a combinação de forma direta. Preencha os campos de ancoragem conforme a especialização acima.

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      - 1. VEREDITO DIRETO: No campo "leitura_caminho.veredito_direto", responda com SIM, NÃO ou TALVEZ.
      - 2. MOTIVO: No campo "carta_sorteada.interpretacao", escreva 2 frases preditivas.
      - 3. ANCORAGEM: Preencha apenas o campo de mantra conforme a especialização do oráculo.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome", "interpretacao": "Análise" },
        "caminho_acao": { "carta": "Nome", "interpretacao": "Ação" },
        "resultado_conselho": { "carta": "Nome", "interpretacao": "Desfecho" },
        "carta_sorteada": { "carta": "Nome", "interpretacao": "Motivo" },
        "leitura_caminho": { 
          "titulo": "Título", 
          "analise_detalhada": "Previsão", 
          "veredito_direto": "VEREDITO" 
        },
        "acolhimento_quantum": { "titulo": "Sabedoria", "conteudo": "Reflexão" },
        "ancoragem_rituais": { "mantra": "Conteúdo", "salmo": "Conteúdo", "banho": "Conteúdo", "biblia": "Conteúdo" }
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
