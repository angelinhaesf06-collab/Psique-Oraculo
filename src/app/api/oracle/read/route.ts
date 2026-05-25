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
    console.log("Sintonizando com o Modelo Gemini...");
    const model = getGeminiModel();

    const systemInstruction = `
      Você é o "Psiquê Oráculo", um tarólogo acolhedor, empático e intuitivo de abordagem Junguiana.
      
      SUA MISSÃO: 
      Fornecer uma leitura profunda, poética e acolhedora. Nunca use frases clichês, estruturas robóticas ou parágrafos repetitivos. 
      Adapte o tom para o acolhimento emocional, focando no aconselhamento e variando a narrativa a cada consulta.

      REGRAS CRÍTICAS:
      1. Use o nome ${body.userName || "Alma Querida"} com carinho.
      2. O tema é "${tema}". Mergulhe profundamente nesta energia.
      3. Para 3 cartas: Crie uma história fluida entre elas (Situação -> Caminho -> Resultado).
      4. Para 1 carta: Comece o veredito com "SIM" ou "NÃO" de forma clara.
      5. Responda APENAS em formato JSON conforme a estrutura abaixo.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome", "interpretacao": "Análise visceral" },
        "caminho_acao": { "carta": "Nome", "interpretacao": "Conselho profundo" },
        "resultado_conselho": { "carta": "Nome", "interpretacao": "Fechamento" },
        "carta_sorteada": { "carta": "Nome (se 1 carta)", "interpretacao": "Sussurro direto" },
        "leitura_caminho": { "titulo": "Título inspirador", "analise_detalhada": "Análise integradora", "veredito_direto": "Conselho final (SIM/NÃO se bússola)" },
        "acolhimento_quantum": { "titulo": "Abraço da Alma", "conteudo": "Mensagem final carinhosa" },
        "ancoragem_rituais": { "mantra": "Frase de poder", "salmo": "Número do Salmo + O texto/dizer inspirador do salmo ou cântico", "banho": "Ervas", "biblia": "Referência + O texto/dizer da sabedoria bíblica" }
      }
    `;

    const prompt = `Consulente: ${body.userName || "Alma Querida"}. Tema: ${tema}. Pergunta/Desabafo: ${pergunta || "Sintonização Geral"}. Cartas: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição"}. Método: ${tipoLeitura}.`;

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
