import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Requisitando Oráculo:", tipoOraculo, "Modelo: 3.1-flash-lite");

    let model;
    try {
      model = getGeminiModel("gemini-3.1-flash-lite");
    } catch (e: any) {
      return NextResponse.json({ error: "Configuração Inválida", details: e.message }, { status: 500 });
    }

    const systemInstructions = `Você é o Psiquê Oráculo, um conselheiro Junguiano. Analise ${tipoOraculo} para o tema ${tema}. Responda estritamente em JSON.`;
    const prompt = `Pergunta: ${pergunta}. Cartas: ${cartas}. Tipo: ${tipoLeitura}.`;
    
    const promptParts: any[] = [systemInstructions + prompt];
    if (imagem) promptParts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) promptParts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    try {
      const result = await model.generateContent(promptParts);
      const response = await result.response;
      const responseText = response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("A IA não retornou o formato de dados esperado.");
      
      const jsonResponse = JSON.parse(jsonMatch[0]);

      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
          await supabase.from("historico_leituras").insert({
            user_id: userId || null,
            tipo_oraculo: tipoOraculo,
            pergunta_tema: tema + ": " + (pergunta || "Consulta"),
            resposta_ia: jsonResponse
          });
        } catch (dbError) { console.error("Erro banco:", dbError); }
      }

      return NextResponse.json(jsonResponse);
    } catch (aiError: any) {
      console.error("Erro na geração de conteúdo:", aiError);
      return NextResponse.json({ 
        error: "Falha na Conexão com o Modelo 3.1", 
        details: "O Google retornou um erro ao processar este modelo. Verifique se ele está ativo. Detalhes: " + aiError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Erro interno grave:", error);
    return NextResponse.json({ error: "Erro Interno no Servidor", details: error.message }, { status: 500 });
  }
}
