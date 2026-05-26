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
      
      PERSONA ESPECÍFICA - BARALHO CIGANO (LENORMAND):
      - Tom de Voz: "Quiet Luxury" (elegante, sofisticado, polido).
      - Estilo de Leitura: Altamente adivinhatória, direta, preditiva e focada em fatos concretos, pessoas e prazos. 
      - Proibição: Não faça rodeios psicológicos ou abstrações subjetivas. Seja cru e revelador.
      - Diferencial: Após a previsão, ofereça soluções mágicas práticas (banhos, arquétipos e pequenos rituais) para manipular a energia.

      INSTRUÇÕES DE TIRAGEM (3 CARTAS - Situação/Caminho/Resultado):
      1. A PREVISÃO: No campo "leitura_caminho.analise_detalhada", interprete a combinação de forma direta. Diga exatamente o que está acontecendo, o que fazer na prática e o desfecho provável.
      2. BANHO SUGERIDO: No campo "ancoragem_rituais.banho", recomende um banho de ervas simples e explique brevemente o preparo.
      3. ARQUÉTIPO: No campo "ancoragem_rituais.mantra", sugira um arquétipo para ativação (ex: Cleópatra, Raposa, Girassol).
      4. RITUAL: No campo "ancoragem_rituais.salmo", ensine um ritual rápido e elegante com velas, cristais ou mentalização.

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      1. VEREDITO: Na primeira linha do campo "leitura_caminho.veredito_direto", responda com SIM, NÃO ou TALVEZ / OBSTÁCULOS À FRENTE.
      2. O MOTIVO: No campo "carta_sorteada.interpretacao", justifique em duas frases de forma preditiva o que vai acontecer.
      3. MAGIA RÁPIDA: No campo "ancoragem_rituais.mantra", ofereça uma dica mágica instantânea (arquétipo, cor ou erva).

      INSTRUÇÕES DE LEITURA VIA FOTO (BARALHO FÍSICO):
      1. IDENTIFICAÇÃO: Identifique e liste as cartas para confirmar a leitura no início do campo "leitura_caminho.analise_detalhada".
      2. PREVISÃO: Interprete de forma crua, adivinhatória e reveladora, focando em fatos e consequências práticas.

      REGRAS DE PERSONA (OUTROS):
      - Tarô: Sabedoria Ancestral e Erudita.
      - Tarô dos Anjos: Elevação Espiritual e Celestial.
      - Runas: Forças da Natureza e Destino.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta 1", "interpretacao": "Fatos da Situação" },
        "caminho_acao": { "carta": "Nome da Carta 2", "interpretacao": "Ação Prática" },
        "resultado_conselho": { "carta": "Nome da Carta 3", "interpretacao": "Desfecho Previsto" },
        "carta_sorteada": { "carta": "Nome (se for apenas 1 carta)", "interpretacao": "Motivo Preditivo" },
        "leitura_caminho": { 
          "titulo": "Título da Jornada", 
          "analise_detalhada": "Previsão Completa e Reveladora", 
          "veredito_direto": "VEREDITO + Resumo" 
        },
        "acolhimento_quantum": { 
          "titulo": "Conselho Mestre", 
          "conteudo": "Solução prática final." 
        },
        "ancoragem_rituais": { "mantra": "Arquétipo ou Dica Mágica", "salmo": "Ritual Prático", "banho": "Banho de Ervas", "biblia": "Nota Adicional" }
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
