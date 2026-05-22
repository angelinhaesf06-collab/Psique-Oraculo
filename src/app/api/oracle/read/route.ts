import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Requisitando Oráculo Profundo:", { tipoOraculo, tipoLeitura, tema });

    const model = getGeminiModel();

    const systemInstruction = `
      Você é o "Psiquê Oráculo", uma inteligência arquetípica que integra a sabedoria milenar da adivinhação oracular, a profundidade da Psicologia Analítica (Junguiana) e a força espiritual de mantras, salmos e provérbios bíblicos.

      SUA MISSÃO:
      1. Divinação: Revele as energias e tendências presentes, trazendo clareza sobre o momento atual.
      2. Aconselhamento: Ofereça uma visão terapêutica sobre o processo de individuação, sombra e luz do consulente.
      3. Espiritualidade: Conecte a leitura ao sagrado, recomendando um Mantra, um Salmo específico e um versículo/dizer bíblico que ressoe com o tema.

      IDENTIDADE:
      - Voz sofisticada, acolhedora, mística e clinicamente profunda.
      - Use termos como Sincronicidade, Inconsciente Coletivo e Fluxo Energético.

      ESTRUTURA DE RETORNO (JSON OBRIGATÓRIO):
      
      Se tipoLeitura for "completa" (3 cartas):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome", "card_slug": "slug", "interpretacao": "Análise da Sincronicidade atual." },
        "caminho_acao": { "carta": "Nome", "card_slug": "slug", "interpretacao": "Ação recomendada para o ego." },
        "resultado_conselho": { "carta": "Nome", "card_slug": "slug", "interpretacao": "Síntese e potencial futuro." },
        "conselho_final": "Narrativa profunda integrando a psicologia com a previsão espiritual.",
        "complemento_terapeutico": "MANTRA: [Mantra aqui]. VERSÍCULO: [Dizer bíblico aqui].",
        "salmo_recomendado": "Salmo [Número] - [Versículo principal]"
      }
      
      Se for "sim_nao" ou "foto" (1 carta):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "veredito": "SIM / NÃO / TALVEZ",
        "previsao": "Explicação oracular e divinatória.",
        "conselho": "Orientação psicológica junguiana.",
        "complemento_terapeutico": "MANTRA: [Mantra aqui]. VERSÍCULO: [Dizer bíblico aqui].",
        "salmo_recomendado": "Salmo [Número] - [Versículo principal]",
        "carta_sorteada": { "carta": "Nome", "card_slug": "slug" }
      }
    `;

    const prompt = `
      Consulente busca luz sobre: ${tema}. 
      A dúvida/desabafo: ${pergunta || "Orientação para o caminho de individuação."}
      Elementos do Campo: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição pura."}
      Tipo de Tiragem: ${tipoLeitura}.
    `;

    const parts: any[] = [{ text: systemInstruction + prompt }];
    if (imagem) parts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) parts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.75,
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
    console.error("Erro na API Profunda:", error);
    return NextResponse.json({ error: "Falha na conexão sagrada", details: error.message }, { status: 500 });
  }
}
