import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Requisitando Oráculo:", { tipoOraculo, tipoLeitura, tema });

    const model = getGeminiModel();

    const prompt = `
      Analise o oráculo ${tipoOraculo} para o tema ${tema}.
      Pergunta/Desabafo: ${pergunta || "O usuário busca orientação geral."}
      Cartas Sorteadas: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Análise livre."}
      
      Gere uma resposta no formato JSON abaixo:
      
      Para tipoLeitura "completa":
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome", "card_slug": "slug", "interpretacao": "..." },
        "caminho_acao": { "carta": "Nome", "card_slug": "slug", "interpretacao": "..." },
        "resultado_conselho": { "carta": "Nome", "card_slug": "slug", "interpretacao": "..." },
        "conselho_final": "Narrativa profunda Junguiana",
        "complemento_terapeutico": "Mantra",
        "salmo_recomendado": "Salmo/Versículo"
      }
      
      Para tipoLeitura "sim_nao" ou "foto":
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "veredito": "SIM/NÃO/TALVEZ",
        "previsao": "Breve explicação",
        "conselho": "Conselho final",
        "complemento_terapeutico": "Insight",
        "salmo_recomendado": "Salmo/Versículo",
        "carta_sorteada": { "carta": "Nome", "card_slug": "slug" }
      }
    `;

    const parts: any[] = [{ text: prompt }];
    if (imagem) parts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) parts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const responseText = result.response.text();
    const jsonResponse = JSON.parse(responseText);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("historico_leituras").insert({
          user_id: userId || null,
          tipo_oraculo: tipoOraculo,
          pergunta_tema: tema + ": " + (pergunta || "Consulta"),
          resposta_ia: jsonResponse
        });
      } catch (e) { console.error("Erro Supabase:", e); }
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Erro na API Oracle:", error);
    return NextResponse.json({ error: "Falha na conexão", details: error.message }, { status: 500 });
  }
}
