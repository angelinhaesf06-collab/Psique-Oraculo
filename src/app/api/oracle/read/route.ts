import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { tipoOraculo, tipoLeitura, pergunta, cartas, imagem, userId } = await req.json();

    const model = getGeminiModel("gemini-1.5-flash");

    let prompt = "";

    if (tipoLeitura === 'sim_nao') {
      prompt = `
        Você é o "Psiquê Oráculo", um conselheiro terapêutico de alta classe especializado em ${tipoOraculo}.
        O usuário fez uma pergunta de "Sim ou Não".
        
        Tema/Pergunta: ${pergunta || 'Geral'}
        Elementos Fornecidos: ${cartas ? (Array.isArray(cartas) ? cartas.join(', ') : cartas) : 'Sorteie os arquétipos adequados'}
        
        Retorne estritamente um JSON no seguinte formato:
        {
          "oraculo_utilizado": "${tipoOraculo}",
          "elemento_identificado": "Nome da Carta ou Elemento principal",
          "veredito": "Sim, Não ou Neutro",
          "complemento": "Um aconselhamento terapêutico breve e profundo (máximo 3 frases) baseado na psicologia e no arquétipo do elemento."
        }
      `;
    } else {
      prompt = `
        Você é o "Psiquê Oráculo", um conselheiro terapêutico de alta classe especializado em ${tipoOraculo}.
        O usuário busca aconselhamento sobre um tema.
        
        Tema/Pergunta: ${pergunta || 'Autoconhecimento'}
        Elementos Fornecidos: ${cartas ? (Array.isArray(cartas) ? cartas.join(', ') : cartas) : 'Analise os arquétipos atuais'}
        
        Retorne estritamente um JSON no seguinte formato:
        {
          "oraculo_utilizado": "${tipoOraculo}",
          "elemento_identificado": "Cartas ou Elementos principais",
          "veredito": "Direcionamento principal",
          "complemento": "Um aconselhamento terapêutico profundo e elegante, conectando o arquétipo do oráculo com a alma do usuário."
        }
      `;
    }

    let result;
    if (imagem) {
        const imageData = imagem.split(',')[1] || imagem;
        result = await model.generateContent([
            prompt,
            { inlineData: { data: imageData, mimeType: "image/jpeg" } }
        ]);
    } else {
        result = await model.generateContent(prompt);
    }

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonResponse = JSON.parse(cleanJson);

    // Salvar no Supabase (se as chaves estiverem presentes)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabaseAdmin.from('historico_leituras').insert({
            user_id: userId || null,
            tipo_oraculo: tipoOraculo,
            tipo_leitura: tipoLeitura,
            pergunta_tema: pergunta,
            cartas_sorteadas: cartas || null,
            resposta_ia: jsonResponse,
            image_url: imagem ? 'imagem_processada' : null // Idealmente salvar no Storage antes
        });
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error('Erro na API Oracle:', error);
    return NextResponse.json({ error: 'Falha ao processar leitura', details: error.message }, { status: 500 });
  }
}
