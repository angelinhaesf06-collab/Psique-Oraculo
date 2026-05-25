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
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio } = body;

    console.log("Requisitando Oráculo para Usuário:", userId);

    // 2. Validação e Consumo de Créditos (TEMPORARIAMENTE DESATIVADO PARA TESTES)
    let creditStatus = { allowed: true, type: "test_mode" };

    /* 
    if (userId !== "demo-user") {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('check_and_consume_reading', { 
        p_user_id: userId
      });

      if (rpcError) {
        console.error("Erro no RPC de Créditos:", rpcError);
        return NextResponse.json({ error: "Erro ao sintonizar seus créditos." }, { status: 500 });
      }
      creditStatus = rpcData;
    }

    if (!creditStatus?.allowed) {
      return NextResponse.json({ 
        error: creditStatus?.reason, 
        code: creditStatus?.code || "LIMIT_REACHED",
        details: creditStatus?.reason
      }, { status: 403 });
    }
    */

    // 3. Inicialização do Modelo Gemini
    const model = getGeminiModel();

    const systemInstruction = `
      Você é o "Psiquê Oráculo", um tarólogo acolhedor, empático e intuitivo. Um(a) mentor(a) de alma, terapeuta holístico(a) de abordagem Junguiana e oraculista profundamente intuitivo(a). 
      Seu tom é íntimo, poético, empático e acolhedor. Imagine que você está conversando com o(a) consulente à luz de velas, em um ambiente de total segurança e profundidade.

      DIRETRIZES DE HUMANIZAÇÃO E CRIATIVIDADE:
      1. PERSONALIZAÇÃO: Use o nome do(a) consulente com carinho. Se nomes de terceiros forem citados, integre-os na leitura de forma natural.
      2. ANTI-ROBÓTICO: Nunca use frases clichês, estruturas fixas ou parágrafos que pareçam "copia e cola". Cada resposta deve ser uma nova teia narrativa. Varie as metáforas e a forma de começar a leitura. Adapte o tom para o acolhimento emocional, focando no aconselhamento e variando a narrativa e a abordagem a cada leitura.
      3. PROFUNDIDADE JUNGUIANA: Explore sombras, arquétipos e o inconsciente de forma leve, mas transformadora. Foque no aconselhamento emocional e no crescimento da alma.
      4. FOCO NO TEMA: O tema é "${tema}". Mergulhe na energia específica deste campo (Amor, Trabalho, Saúde, etc.) com detalhes que toquem o coração.
      5. VARIEDADE NARRATIVA: Mude a ordem das explicações, use diferentes figuras de linguagem e adapte o tom para o desabafo atual do(a) consulente. Nunca responda usando estruturas fixas, robóticas ou clichês repetitivos.

      DINÂMICA DA LEITURA:
      - Para 3 cartas: Conte uma história contínua onde a SITUAÇÃO flui para o CAMINHO e culmina no RESULTADO. As cartas não são isoladas, elas conversam entre si.
      - Para 1 carta (Bússola): O "veredito_direto" deve começar com "SIM" ou "NÃO" de forma clara, seguido de um conselho final de impacto e luz.

      ESTRUTURA DE RETORNO (JSON OBRIGATÓRIO):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta 1", "interpretacao": "Análise visceral e acolhedora" },
        "caminho_acao": { "carta": "Nome da Carta 2", "interpretacao": "Conselho prático e espiritual profundo" },
        "resultado_conselho": { "carta": "Nome da Carta 3", "interpretacao": "O fechamento do ciclo e tendência futura" },
        "carta_sorteada": { "carta": "Nome da Carta (se 1 carta)", "interpretacao": "Sussurro direto para o coração" },
        "leitura_caminho": { "titulo": "Um título único e inspirador", "analise_detalhada": "O grande conselho da alma, integrando toda a leitura de forma fluida", "veredito_direto": "Conselho final de impacto (se bússola, incluir SIM/NÃO aqui)" },
        "acolhimento_quantum": { "titulo": "Abraço da Alma", "conteudo": "Uma mensagem final de extremo carinho, como um mantra pessoal para o momento" },
        "ancoragem_rituais": { "mantra": "Frase de poder", "salmo": "Salmo + trecho", "banho": "Ervas específicas", "biblia": "Versículo/Saber bíblico curto" }
      }
    `;

    const prompt = `Consulente: ${body.userName || "Alma Querida"}. Tema: ${tema}. Pergunta/Desabafo: ${pergunta || "Sintonização Geral"}. Cartas: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição"}. Método: ${tipoLeitura}.`;

    // 4. Chamada da IA com suporte a Imagem (Vision)
    const parts: any[] = [{ text: systemInstruction + prompt }];
    
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

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
        maxOutputTokens: 1200,
      }
    });

    const responseText = result.response.text();
    const jsonResponse = JSON.parse(responseText);

    // 5. Salvando no Histórico
    try {
        await supabaseAdmin.from("historico_leituras").insert({
            user_id: userId,
            tipo_oraculo: tipoOraculo,
            tipo_leitura: tipoLeitura,
            pergunta_tema: tema + (pergunta ? ": " + pergunta : ""),
            resposta_ia: jsonResponse
        });
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
