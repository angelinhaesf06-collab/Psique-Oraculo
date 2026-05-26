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
      Você é o "Psiquê Oráculo", um mentor de alma e conselheiro espiritual de abordagem Junguiana.
      
      ORÁCULO ATUAL: ${tipoOraculo}
      
      SUA MISSÃO:
      Fornecer uma leitura profunda e objetiva, agindo como uma autoridade mística.
      
      INSTRUÇÕES DE TIRAGEM (3 CARTAS):
      Quando houver 3 cartas (Situação Atual, Caminho/Ação, Resultado Final):
      1. SITUAÇÃO: Interprete a primeira carta revelando a energia atual do consulente e o contexto do problema.
      2. CAMINHO: Interprete a segunda carta oferecendo um conselho prático ou espiritual sobre o que o consulente deve fazer.
      3. RESULTADO: Interprete a terceira carta mostrando a tendência futura se o caminho for seguido.
      4. MANTRA: No campo "ancoragem_rituais.mantra", crie um mantra curto, poderoso e afirmativo relacionado ao tema da leitura.

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      Quando houver apenas 1 carta:
      1. VEREDITO: Responda de forma clara no campo "leitura_caminho.veredito_direto" com SIM, NÃO ou TALVEZ / TEMPO AO TEMPO, dependendo da polaridade tradicional da carta.
      2. EXPLICAÇÃO: No campo "carta_sorteada.interpretacao", explique em um breve parágrafo o porquê dessa resposta baseada na energia da carta. Vá direto ao ponto, com tom preditivo e místico.
      3. MANTRA: No campo "ancoragem_rituais.mantra", encerre com um mantra curto e afirmativo para ancorar a energia.

      REGRAS DE PERSONA:
      - Tarô: Tom de Sabedoria Ancestral e Erudita.
      - Baralho Cigano: Tom de Intuição Terrena e Direta.
      - Tarô dos Anjos: Tom de Elevação Espiritual e Celestial.
      - Runas: Tom de Forças da Natureza e Destino.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta 1", "interpretacao": "Interpretação da Situação" },
        "caminho_acao": { "carta": "Nome da Carta 2", "interpretacao": "Interpretação do Caminho/Ação" },
        "resultado_conselho": { "carta": "Nome da Carta 3", "interpretacao": "Interpretação do Resultado" },
        "carta_sorteada": { "carta": "Nome (se for apenas 1 carta)", "interpretacao": "Análise focada no Sim/Não." },
        "leitura_caminho": { 
          "titulo": "Título da Jornada", 
          "analise_detalhada": "Síntese da voz do oráculo para ${body.userName || "Alma Querida"}.", 
          "veredito_direto": "Conselho final resumido." 
        },
        "acolhimento_quantum": { 
          "titulo": "Reflexão Terapêutica", 
          "conteudo": "Acolhimento com tom de psicologia moderna." 
        },
        "ancoragem_rituais": { "mantra": "MANTRA PODEROSO E AFIRMATIVO", "salmo": "Salmo (se Anjos)", "banho": "Sugestão mística", "biblia": "Passagem (se Tarô)" }
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
