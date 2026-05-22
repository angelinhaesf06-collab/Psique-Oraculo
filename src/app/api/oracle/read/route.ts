import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Iniciando requisição para oráculo:", { tipoOraculo, tipoLeitura, tema });

    let model;
    try {
      model = getGeminiModel();
    } catch (modelError: any) {
      console.error("Erro ao inicializar o modelo Gemini:", modelError);
      return NextResponse.json({ 
        error: "Modelo de IA indisponível", 
        details: "O modelo gemini-3.1-flash-lite pode não estar ativo ou o nome está incorreto. Erro: " + modelError.message 
      }, { status: 500 });
    }

    const systemInstructions = `
      Você é o "Psiquê Oráculo", um conselheiro de alma, integrando a sabedoria ancestral dos oráculos com a profundidade da Psicologia Analítica (Junguiana). 
      Sua voz é sofisticada, empática, poética e clinicamente profunda. Você não apenas "prevê o futuro", mas ajuda o usuário a integrar sua sombra e iluminar seu processo de individuação.

      TONALIDADE E IDENTIDADE:
      - Elegante e Atemporal: Use um vocabulário rico, mas acessível.
      - Arquetípico: Referencie conceitos como Sombra, Persona, Ânima/Ânimus quando fizer sentido para o contexto.
      - Acolhedor: Trate o desabafo do usuário com a reverência de um terapeuta experiente.

      ESTRUTURA DE RETORNO (JSON) - OBRIGATÓRIO:
      Se tipoLeitura for "completa":
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "...", "card_slug": "...", "interpretacao": "..." },
        "caminho_acao": { "carta": "...", "card_slug": "...", "interpretacao": "..." },
        "resultado_conselho": { "carta": "...", "card_slug": "...", "interpretacao": "..." },
        "conselho_final": "...",
        "complemento_terapeutico": "...",
        "salmo_recomendado": "..."
      }
      Se for "sim_nao" ou "foto":
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "veredito": "SIM/NÃO/TALVEZ",
        "previsao": "...",
        "conselho": "...",
        "complemento_terapeutico": "...",
        "salmo_recomendado": "...",
        "carta_sorteada": { "carta": "...", "card_slug": "..." }
      }
    `;

    const prompt = `Contexto: ${tema}. Pergunta: ${pergunta}. Tipo: ${tipoLeitura}. Cartas: ${cartas}.`;
    const promptParts: any[] = [systemInstructions + prompt];

    if (imagem) promptParts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) promptParts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("A IA não retornou um JSON válido.");
    
    const jsonResponse = JSON.parse(jsonMatch[0]);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
            await supabaseAdmin.from("historico_leituras").insert({
                user_id: userId || null,
                tipo_oraculo: tipoOraculo,
                tipo_leitura: tipoLeitura,
                pergunta_tema: tema + ": " + (pergunta || "Consulta"),
                resposta_ia: jsonResponse
            });
        } catch (dbError) { console.error("Erro Supabase:", dbError); }
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Erro na API Oracle:", error);
    return NextResponse.json({ error: "Falha na IA", details: error.message }, { status: 500 });
  }
}
