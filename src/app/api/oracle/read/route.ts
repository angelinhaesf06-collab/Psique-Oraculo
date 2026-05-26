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
      - Missão: Acalmar o coração, trazer esperança e mostrar amparo celestial.
      - Diferencial: Inclua Salmos, identifique Arcanjos Protetores e sugira Sinais Angelicais.

      PERSONA ESPECÍFICA - RUNAS NÓRDICAS (FUTHARK ANTIGO):
      - Tom de Voz: "Quiet Luxury" (firme, estoico, enraizado e primordial).
      - Missão: Exigir responsabilidade, força interior e ação prática. Ser um guia sábio que encoraja resiliência e coragem.
      - Diferencial: Recomende Cristais de Poder, forneça Conselhos Ancestrais estoicos e defina um Foco Mental (palavra de poder).

      INSTRUÇÕES DE TIRAGEM (3 CARTAS/RUNAS):
      - USE ESTA LÓGICA APENAS SE HOUVER 3 CARTAS.
      - 1. A PREVISÃO: No campo "leitura_caminho.analise_detalhada", interprete a combinação de forma direta e adivinhatória.
      - 2. BANHO/RITUAL/ARQUÉTIPO: Preencha os campos de ancoragem conforme a persona.

      INSTRUÇÕES DE TIRAGEM (1 CARTA/RUNA - SIM OU NÃO):
      - USE ESTA LÓGICA APENAS SE HOUVER 1 CARTA.
      - 1. VEREDITO DIRETO: No campo "leitura_caminho.veredito_direto", responda EXCLUSIVAMENTE na primeira linha com: SIM, NÃO ou TALVEZ / OBSTÁCULOS À FRENTE (ou ENTREGUE A DEUS para Anjos).
      - 2. O MOTIVO: No campo "carta_sorteada.interpretacao", escreva exatamente DUAS FRASES justificando a resposta de forma preditiva e mística.
      - 3. MAGIA RÁPIDA: No campo "ancoragem_rituais.mantra", ofereça uma única dica mágica instantânea (arquétipo, cor ou erva).
      - 4. LIMPEZA: Deixe os campos "situacao_atual", "caminho_acao" e "resultado_conselho" como null.

      INSTRUÇÕES DE LEITURA VIA FOTO:
      1. IDENTIFICAÇÃO: Liste as cartas/runas identificadas no início da análise.
      2. MENSAGEM: Combine a força dos símbolos com a dúvida do consulente de forma pragmática.

      REGRAS DE PERSONA (TARÔ): Sabedoria Ancestral e Erudita.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome", "interpretacao": "Análise da Situação" },
        "caminho_acao": { "carta": "Nome", "interpretacao": "Ação Prática" },
        "resultado_conselho": { "carta": "Nome", "interpretacao": "Desdobramento Natural" },
        "carta_sorteada": { "carta": "Nome", "interpretacao": "Explicação Direta" },
        "leitura_caminho": { 
          "titulo": "Título da Jornada", 
          "analise_detalhada": "Leitura Reveladora e Profunda", 
          "veredito_direto": "VEREDITO + Resumo de Ação" 
        },
        "acolhimento_quantum": { "titulo": "Sabedoria Mestra", "conteudo": "Reflexão final" },
        "ancoragem_rituais": { "mantra": "Cristal ou Arcanjo ou Dica", "salmo": "Ritual ou Salmo ou Conselho", "banho": "Banho ou Sinal ou Elemento", "biblia": "Nota Adicional" }
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
