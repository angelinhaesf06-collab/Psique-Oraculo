import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = body;

    console.log("Requisitando Oráculo 3.1:", tipoOraculo);

    let model;
    try {
      // Usando o modelo solicitado pelo usuário
      model = getGeminiModel("gemini-3.1-flash-lite");
    } catch (e: any) {
      return NextResponse.json({ error: "Configuração", details: e.message }, { status: 500 });
    }

    const systemInstructions = `Você é o Psiquê Oráculo, um conselheiro Junguiano profundo e sofisticado. Analise os arquétipos do ${tipoOraculo} para o tema ${tema}. Responda estritamente em formato JSON válido conforme as especificações do sistema.`;
    const prompt = `Pergunta do Usuário: ${pergunta || "Consulta Geral"}. Elementos Fornecidos: ${cartas || "Análise Intuitiva"}. Tipo de Leitura: ${tipoLeitura}.`;
    
    const promptParts: any[] = [systemInstructions + prompt];
    if (imagem) promptParts.push({ inlineData: { data: imagem.split(",")[1] || imagem, mimeType: "image/jpeg" } });
    if (audio) promptParts.push({ inlineData: { data: audio.split(",")[1] || audio, mimeType: "audio/mp3" } });

    try {
      // Configuração baseada no exemplo do usuário (thinking_level: MINIMAL)
      // No SDK de JS, passamos as partes e as configurações de geração
      const result = await model.generateContent({
        contents: [{ role: "user", parts: promptParts.map(p => typeof p === 'string' ? { text: p } : p) }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const response = await result.response;
      const responseText = response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("A IA não retornou um formato JSON válido.");
      
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
      console.error("Erro na geração 3.1:", aiError);
      return NextResponse.json({ 
        error: "Falha no Modelo 3.1", 
        details: "O modelo 3.1-flash-lite pode exigir configurações específicas ou acesso antecipado. Detalhes: " + aiError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: "Erro Interno no Servidor", details: error.message }, { status: 500 });
  }
}
