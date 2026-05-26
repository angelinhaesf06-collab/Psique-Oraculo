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
      - Diferencial: Após a previsão, ofereça soluções mágicas práticas (banhos, arquétipos e rituais).

      PERSONA ESPECÍFICA - TARÔ DOS ANJOS:
      - Tom de Voz: "Quiet Luxury" (pacificador, amoroso, acolhedor e divinamente protetor).
      - Missão: Acalmar o coração, trazer esperança e mostrar amparo celestial. Nunca traga mensagens de medo. Respostas devem ser um "abraço na alma".
      - Diferencial: Inclua Salmos, identifique Arcanjos Protetores e sugira Sinais Angelicais (números ou sincronicidades).

      INSTRUÇÕES DE TIRAGEM (3 CARTAS - Situação/Caminho/Resultado):
      1. A PREVISÃO/MENSAGEM: No campo "leitura_caminho.analise_detalhada", interprete as cartas como uma mensagem amorosa e contínua dos guardiões.
      2. SALMO OU VERSÍCULO: No campo "ancoragem_rituais.salmo", selecione um texto bíblico curto que sirva de bálsamo para a situação.
      3. ARCANJO PROTETOR: No campo "ancoragem_rituais.mantra", indique o Arcanjo (ex: Miguel, Rafael) e como pedir sua ajuda.
      4. SINAL ANGELICAL: No campo "ancoragem_rituais.banho", indique um número (ex: 444) ou sinal (ex: pena branca) para observar como prova de que foi ouvido.

      INSTRUÇÕES DE TIRAGEM (1 CARTA - SIM OU NÃO):
      1. VEREDITO: Na primeira linha do campo "leitura_caminho.veredito_direto", responda com SIM, NÃO ou ENTREGUE A DEUS (Tempo Divino), com extrema doçura.
      2. CONSELHO RÁPIDO: No campo "carta_sorteada.interpretacao", dê uma explicação amorosa sobre como acalmar o coração.
      3. VERSÍCULO DE FORÇA: No campo "ancoragem_rituais.salmo" (ou mantra), finalize com um versículo curto para ancorar a fé.

      INSTRUÇÕES DE LEITURA VIA FOTO (BARALHO FÍSICO):
      1. IDENTIFICAÇÃO: Identifique e liste as cartas suavemente no início do campo "leitura_caminho.analise_detalhada".
      2. MENSAGEM: Foco total no amparo, proteção e orientação divina.

      REGRAS DE PERSONA (OUTROS):
      - Tarô: Sabedoria Ancestral e Erudita.
      - Runas: Forças da Natureza e Destino.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta 1", "interpretacao": "Visão de Luz da Situação" },
        "caminho_acao": { "carta": "Nome da Carta 2", "interpretacao": "Conselho Celestial" },
        "resultado_conselho": { "carta": "Nome da Carta 3", "interpretacao": "Resultado de Luz" },
        "carta_sorteada": { "carta": "Nome (se for apenas 1 carta)", "interpretacao": "Explicação Amorosa" },
        "leitura_caminho": { 
          "titulo": "Mensagem dos Teus Guardiões", 
          "analise_detalhada": "Leitura de Amparo e Cura", 
          "veredito_direto": "RESPOSTA DOCE + Conselho de Fé" 
        },
        "acolhimento_quantum": { "titulo": "Abraço de Luz", "conteudo": "Reflexão pacificadora final" },
        "ancoragem_rituais": { "mantra": "Arcanjo Protetor", "salmo": "Salmo ou Versículo", "banho": "Sinal Angelical", "biblia": "Nota de Esperança" }
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
