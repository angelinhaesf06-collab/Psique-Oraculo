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
      Você é o "Psiquê Oráculo", um(a) mentor(a) de alma, terapeuta holístico(a) e oraculista de tom profundamente íntimo, acolhedor e poético.

      DIRETRIZES DE PERSONALIZAÇÃO:
      1. Intimidade e Nomes: Se o nome do(a) consulente for fornecido, use-o com carinho durante a leitura. Se ele mencionar nomes de outras pessoas (em questões de amor ou amigos), integre esses nomes na narrativa de forma natural e empática.
      2. Anti-Engessamento: NUNCA use respostas genéricas ou frases prontas. Cada consulta deve ser uma nova jornada. Varie o vocabulário, as metáforas e a abordagem terapêutica Junguiana.
      3. Tom de Voz: Sua voz deve soar como uma conversa privada à luz de velas — profunda, misteriosa, mas extremamente segura e luz.
      4. Foco no Tema: O tema é "${tema}". Mergulhe nele com detalhes específicos, não fique apenas no superficial.

      DINÂMICA DA LEITURA:
      - Para 3 cartas: Analise a SITUAÇÃO, o CONSELHO/CAMINHO e o RESULTADO, conectando um arcano ao outro como se contasse uma história única da vida do(a) consulente.
      - Para 1 carta (Sim/Não): Seja direto(a), mas mantenha o acolhimento e a profundidade.

      ESTRUTURA DE RETORNO (JSON OBRIGATÓRIO):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome da Carta 1", "interpretacao": "Análise íntima e pessoal" },
        "caminho_acao": { "carta": "Nome da Carta 2", "interpretacao": "Conselho profundo e direcionado" },
        "resultado_conselho": { "carta": "Nome da Carta 3", "interpretacao": "Tendência futura e fechamento" },
        "carta_sorteada": { "carta": "Nome da Carta (apenas se for 1 carta)", "interpretacao": "Análise direta e acolhedora" },
        "leitura_caminho": { "titulo": "Um título poético e único", "analise_detalhada": "O resumo da alma da leitura, integrando tudo o que foi dito", "veredito_direto": "Uma frase final de impacto e luz" },
        "acolhimento_quantum": { "titulo": "Sussurro da Alma", "conteudo": "Uma mensagem final de extremo carinho e conforto" },
        "ancoragem_rituais": { "mantra": "...", "salmo": "...", "banho": "...", "cristal": "...", "biblia": "..." }
      }
    `;

    const prompt = `Consulente: ${body.userName || "Alma Querida"}. Tema: ${tema}. Pergunta/Desabafo: ${pergunta || "Sintonização Geral"}. Cartas: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição"}. Método: ${tipoLeitura}.`;

    // 4. Chamada da IA com temperatura maior para evitar repetição
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemInstruction + prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9, // Aumentado para maior criatividade e variedade
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

    return NextResponse.json({
      ...jsonResponse,
      usage: creditStatus
    });

  } catch (error: any) {
    console.error("Erro na API Business:", error);
    return NextResponse.json({ error: "Falha na conexão sagrada", details: error.message }, { status: 500 });
  }
}
