import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId, isPremiumRC } = body;

    console.log("Requisitando Oráculo Holístico Profundo (MODO TESTE):", { tipoOraculo, tipoLeitura, tema });

    // 1. Validação de Créditos (DESATIVADA PARA TESTES)
    /* 
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: creditStatus } = await supabaseAdmin.rpc('check_and_consume_reading', { p_user_id: userId, p_is_premium_rc: isPremiumRC || false });
    if (!creditStatus?.allowed) { ... }
    */

    // 2. Inicialização do Modelo Premium 3.1
    const model = getGeminiModel();

    const systemInstruction = `
      Você é um(a) Oraculista e Terapeuta Holístico(a) de Alta Performance. Sua missão é realizar leituras profundas utilizando o sistema: ${tipoOraculo}.

      DIRETRIZES DE TOM E ABORDAGEM:
      1. Fusão Terapêutica: Mescle a sabedoria adivinhatória tradicional dos oráculos com acolhimento psicológico e visão quântica.
      2. Sem Alarmismo: Foque na chave do aprendizado e evolução espiritual.
      3. Ancoragem: Gere Mantras, Salmos, Banhos e Cristais.

      ESTRUTURA DE RETORNO (JSON OBRIGATÓRIO):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "leitura_caminho": { "titulo": "...", "analise_detalhada": "...", "veredito_direto": "..." },
        "acolhimento_quantum": { "titulo": "...", "conteudo": "..." },
        "ancoragem_rituais": { "mantra": "...", "salmo": "...", "banho": "...", "cristal": "...", "biblia": "..." },
        "situacao_atual": null, "caminho_acao": null, "resultado_conselho": null, "carta_sorteada": null
      }
    `;

    const prompt = `Consulente: ${tema}. Pergunta: ${pergunta || "Geral"}. Cartas: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição"}. Tipo: ${tipoLeitura}.`;

    // 3. Chamada da IA com Limite de Tokens Controlado
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemInstruction + prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
        maxOutputTokens: 800,
      }
    });

    const responseText = result.response.text();
    const jsonResponse = JSON.parse(responseText);

    // 4. Salvando no Histórico (Opcional durante testes)
    try {
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await supabaseAdmin.from("historico_leituras").insert({
            user_id: userId,
            tipo_oraculo: tipoOraculo,
            tipo_leitura: tipoLeitura,
            pergunta_tema: tema + ": " + (pergunta || "Consulta"),
            resposta_ia: jsonResponse
        });
    } catch (e) { console.warn("Supabase Histórico Ignorado em Teste"); }

    return NextResponse.json({
      ...jsonResponse,
      usage: { allowed: true, type: "test_mode" }
    });

  } catch (error: any) {
    console.error("Erro na API Business:", error);
    return NextResponse.json({ error: "Falha na conexão sagrada", details: error.message }, { status: 500 });
  }
}
