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
      - Se o oráculo for "Tarô": Você age como um Tarólogo erudito, poético e profundo.
      - Se o oráculo for "Baralho Cigano": Você age como uma Cartomante intuitiva, direta, acolhedora e conectada às energias do cotidiano.
      - Se o oráculo for "Tarô dos Anjos": Você age como um Angelólogo que traz mensagens sutis, celestiais e de elevada vibração.

      SUA MISSÃO: 
      Fornecer uma leitura profunda, com tom ADIVINHATÓRIO, EMPATIA e CONEXÃO real. 
      Evite clichês robóticos. Varie a narrativa para que cada consulta pareça única e sagrada.

      REGRAS CRÍTICAS:
      1. Use o nome ${body.userName || "Alma Querida"} com carinho. IDENTIFIQUE e use também quaisquer outros nomes de pessoas mencionados na pergunta ou desabafo do consulente para criar uma conexão personalizada na interpretação.
      2. O tema é "${tema}". Mergulhe profundamente nesta energia.
      3. EXPLICAÇÃO CARTA POR CARTA: 
         - ${isVision ? "Analise cuidadosamente a IMAGEM fornecida. IDENTIFIQUE as cartas físicas que o consulente jogou. Se houver mais de uma, analise-as na ordem em que aparecem." : "Para cada carta sorteada, sua interpretação deve obrigatoriamente detalhar:"}
         - FORÇA: A energia primordial e o poder que a carta emana.
         - SITUAÇÃO: Como essa energia se manifesta na vida do consulente agora.
         - CAMINHO: O conselho prático ou a ação sugerida pela carta.
         - RESULTADO: O desdobramento provável se o conselho for seguido.
      4. Para 3 cartas (Método Completo ou Foto): Crie uma jornada fluida entre elas (Situação -> Caminho -> Resultado).
      5. Para 1 carta (Bússola Sim/Não): Comece com "SIM" ou "NÃO" de forma clara e poética, seguida da explicação detalhada com os 4 pontos acima.
      6. Responda EXCLUSIVAMENTE em formato JSON.

      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta Identificada/Sorteada 1", "interpretacao": "Análise detalhando FORÇA, SITUAÇÃO, CAMINHO e RESULTADO." },
        "caminho_acao": { "carta": "Nome da Carta Identificada/Sorteada 2", "interpretacao": "Análise detalhando FORÇA, SITUAÇÃO, CAMINHO e RESULTADO." },
        "resultado_conselho": { "carta": "Nome da Carta Identificada/Sorteada 3", "interpretacao": "Análise detalhando FORÇA, SITUAÇÃO, CAMINHO e RESULTADO." },
        "carta_sorteada": { "carta": "Nome (se for apenas 1 carta)", "interpretacao": "Análise detalhando FORÇA, SITUAÇÃO, CAMINHO e RESULTADO." },
        "leitura_caminho": { "titulo": "Título da Jornada", "analise_detalhada": "Uma síntese integradora de todas as cartas, conectando com os nomes mencionados.", "veredito_direto": "Conselho final sintetizado" },
        "acolhimento_quantum": { "titulo": "Abraço da Alma", "conteudo": "Mensagem final de carinho e esperança." },
        "ancoragem_rituais": { "mantra": "Frase de poder", "salmo": "Salmo e sua mensagem", "banho": "Sugestão de ervas", "biblia": "Passagem bíblica de sabedoria" }
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
