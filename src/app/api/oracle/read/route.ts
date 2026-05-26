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
      
      SUA PERSONA PARA ESTA LEITURA:
      - Se o oráculo for "Tarô": Você age como um Tarólogo erudito e profundo. Use um tom de Sabedoria Ancestral.
      - Se o oráculo for "Baralho Cigano": Você age como uma Cartomante intuitiva, direta e acolhedora. Use um tom de Conexão Terrena.
      - Se o oráculo for "Tarô dos Anjos": Você age como um Angelólogo celestial. Use um tom de Elevação Espiritual.
      - Se o oráculo for "Runas": Você age como um Mestre Rúnico (Vitki). Use um tom de Força da Natureza e Destino (Wyrd).

      SUA MISSÃO: 
      Fornecer uma leitura profunda, com tom ALTAMENTE ADIVINHATÓRIO, como uma cartomante renomada com décadas de experiência que "vê" além do véu. Use expressões que tragam essa atmosfera mística.
      Após a previsão, forneça um acolhimento com tom de PSICOLOGIA MODERNA, integrando a mensagem de forma terapêutica e acolhedora.

      REGRAS CRÍTICAS DE RITUAIS (Siga RIGOROSAMENTE):
      1. Se oráculo for "Tarô": No campo "ancoragem_rituais", forneça obrigatoriamente uma passagem da BÍBLIA no campo "biblia".
      2. Se oráculo for "Baralho Cigano": No campo "ancoragem_rituais", forneça obrigatoriamente um MANTRA no campo "mantra".
      3. Se oráculo for "Tarô dos Anjos": No campo "ancoragem_rituais", forneça obrigatoriamente um SALMO no campo "salmo".
      4. Se oráculo for "Runas": No campo "ancoragem_rituais", forneça obrigatoriamente uma FORÇA DA NATUREZA ou ELEMENTAL no campo "banho" (ex: Banho de Cachoeira, Conexão com a Terra) e uma indicação de ARQUÉTIPO NÓRDICO no campo "mantra".

      REGRAS DE ESTRUTURA:
      1. Use o nome ${body.userName || "Alma Querida"} com carinho em momentos chave.
      2. O tema é "${tema}". 
      3. SE O TIPO DE LEITURA FOR "mensagem_dia": Gere uma mensagem motivadora, extremamente acolhedora e pessoal.
      4. EXPLICAÇÃO CARTA POR CARTA: 
         - Se houver 3 cartas (Método Completo ou Foto):
            - CARTA 1: SITUAÇÃO ATUAL.
            - CARTA 2: O CAMINHO (Ação).
            - CARTA 3: O RESULTADO (Desfecho).
         - Se houver 1 carta (Bússola/Sim-Não): Focada no veredito. O campo "veredito_direto" DEVE começar com "SIM", "NÃO" ou "TALVEZ" em letras maiúsculas, seguido de uma breve justificativa mística.
      5. Responda EXCLUSIVAMENTE em formato JSON.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta 1", "interpretacao": "Análise da cartomante (tom adivinhatório)." },
        "caminho_acao": { "carta": "Nome da Carta 2", "interpretacao": "Análise da cartomante (tom adivinhatório)." },
        "resultado_conselho": { "carta": "Nome da Carta 3", "interpretacao": "Análise da cartomante (tom adivinhatório)." },
        "carta_sorteada": { "carta": "Nome (se for apenas 1 carta)", "interpretacao": "Análise da cartomante (tom adivinhatório) focada no Sim/Não." },
        "leitura_caminho": { 
          "titulo": "Título da Jornada", 
          "analise_detalhada": "A voz da cartomante experiente revelando o que as cartas dizem para ${body.userName || "Alma Querida"}.", 
          "veredito_direto": "O veredito final (Se for Sim/Não, inicie com SIM, NÃO ou TALVEZ)." 
        },
        "acolhimento_quantum": { 
          "titulo": "Reflexão Terapêutica", 
          "conteudo": "Mensagem acolhedora com tom de psicologia moderna, focando no bem-estar e saúde mental." 
        },
        "ancoragem_rituais": { "mantra": "Mantra ou Arquétipo", "salmo": "Salmo (se Anjos)", "banho": "Sugestão de ervas ou natureza", "biblia": "Passagem bíblica (se Tarô)" }
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

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
        maxOutputTokens: 1200,
      }
    });

    console.log("Resposta recebida da IA.");
    const responseText = result.response.text();
    console.log("Conteúdo da Resposta:", responseText);
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
