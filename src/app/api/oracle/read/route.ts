import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Requisitando Oráculo Holístico Profundo:", { tipoOraculo, tipoLeitura, tema });

    const model = getGeminiModel();

    const systemInstruction = `
      Você é um(a) Oraculista e Terapeuta Holístico(a) de Alta Performance. Sua missão é realizar leituras profundas utilizando o sistema: ${tipoOraculo}.

      DIRETRIZES DE TOM E ABORDAGEM:
      1. Fusão Terapêutica: Mescle a sabedoria adivinhatória tradicional dos oráculos com acolhimento psicológico (linguagem empática, sem julgamentos) e visão quântica (focando na cocriação da realidade, frequência vibracional e infinitas possibilidades).
      2. Sem Alarmismo: Mesmo diante de cartas desafiadoras, foque na chave do aprendizado, na evolução espiritual e no direcionamento positivo.
      3. Sabedoria Sagrada: Integre mantras, salmos e versículos bíblicos.

      ESTRUTURA DE RETORNO (JSON OBRIGATÓRIO):
      
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "leitura_caminho": {
          "titulo": "A LEITURA DO SEU CAMINHO",
          "analise_detalhada": "Interpretação profunda baseada no ${tipoLeitura}. Se for Situação-Caminho-Resultado, divida nesses três momentos.",
          "veredito_direto": "Resposta para Sim/Não ou Síntese da leitura."
        },
        "acolhimento_quantum": {
          "titulo": "ACOLHIMENTO PSICOLÓGICO E VISÃO QUÂNTICA",
          "conteudo": "Análise comportamental, postura mental recomendada e como elevar a frequência quântica."
        },
        "ancoragem_rituais": {
          "titulo": "ANCORAGEM ENERGÉTICA E RITUAIS",
          "mantra": "Frase curta de poder e afirmação.",
          "salmo": "Número do Salmo e breve explicação do motivo.",
          "banho": "Receita simples de banho de ervas.",
          "cristal": "Cristal indicado para conexão ou proteção.",
          "biblia": "Dizer ou versículo bíblico que ressoe com o tema."
        },
        "situacao_atual": null, 
        "caminho_acao": null,
        "resultado_conselho": null,
        "carta_sorteada": null
      }

      IMPORTANTE: Mapeie as cartas fornecidas (${Array.isArray(cartas) ? cartas.join(", ") : cartas}) para os campos 'situacao_atual', 'caminho_acao' e 'resultado_conselho' (se leitura completa) ou 'carta_sorteada' (se 1 carta), mantendo a estrutura original do banco de dados nos campos extras.
    `;

    const prompt = `
      Consulente: ${tema}. 
      Pergunta/Desabafo: ${pergunta || "Orientação para o caminho de individuação."}
      Cartas do Campo: ${Array.isArray(cartas) ? cartas.join(", ") : cartas || "Intuição."}
      Tipo de Tiragem: ${tipoLeitura}.
    `;

    const parts: any[] = [{ text: systemInstruction + prompt }];
    if (imagem) parts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) parts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
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
    console.error("Erro na API Holística:", error);
    return NextResponse.json({ error: "Falha na conexão sagrada", details: error.message }, { status: 500 });
  }
}
