import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Requisitando Oráculo Holístico Profundo:", { tipoOraculo, tipoLeitura, tema });

    // 1. Validação de Créditos e Assinatura via Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: creditStatus, error: creditError } = await supabaseAdmin.rpc(
      'check_and_consume_reading',
      { p_user_id: userId }
    );

    if (creditError || !creditStatus?.allowed) {
      return NextResponse.json({ 
        error: "Bloqueio de Acesso", 
        details: creditStatus?.reason || "Verifique sua assinatura.",
        code: "PAYWALL" 
      }, { status: 403 });
    }

    // 2. Inicialização do Modelo
    const model = getGeminiModel();

    const systemInstruction = `
      Você é um(a) Oraculista e Terapeuta Holístico(a) de Alta Performance. Sua missão é realizar leituras profundas utilizando o sistema: ${tipoOraculo}.

      DIRETRIZES DE TOM E ABORDAGEM:
      1. Fusão Terapêutica: Mescle a sabedoria adivinhatória tradicional dos oráculos com acolhimento psicológico e visão quântica.
      2. Sem Alarmismo: Foque na chave do aprendizado e evolução.
      3. Sabedoria Sagrada: Integre mantras, salmos e versículos bíblicos.

      ESTRUTURA DE RETORNO (JSON OBRIGATÓRIO):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "leitura_caminho": { "titulo": "...", "analise_detalhada": "...", "veredito_direto": "..." },
        "acolhimento_quantum": { "titulo": "...", "conteudo": "..." },
        "ancoragem_rituais": { "mantra": "...", "salmo": "...", "banho": "...", "cristal": "...", "biblia": "..." }
      }
    `;

    const prompt = `Consulente: ${tema}. Pergunta: ${pergunta || "Geral"}. Cartas: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição"}. Tipo: ${tipoLeitura}.`;

    const parts: any[] = [{ text: systemInstruction + prompt }];
    if (imagem) parts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) parts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    // 3. Chamada da IA com Limite de Tokens (Otimização de Custo)
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
        maxOutputTokens: 800, // Limite controlado entre 600-800 conforme solicitado
      }
    });

    const responseText = result.response.text();
    const jsonResponse = JSON.parse(responseText);

    // 4. Salvando Histórico
    await supabaseAdmin.from("historico_leituras").insert({
      user_id: userId,
      tipo_oraculo: tipoOraculo,
      pergunta_tema: tema + ": " + (pergunta || "Consulta"),
      resposta_ia: jsonResponse
    });

    return NextResponse.json({
      ...jsonResponse,
      credits_used: creditStatus.type === 'free' ? 1 : 0,
      usage_type: creditStatus.type
    });

  } catch (error: any) {
    console.error("Erro na API Business:", error);
    return NextResponse.json({ error: "Erro na jornada", details: error.message }, { status: 500 });
  }
}
