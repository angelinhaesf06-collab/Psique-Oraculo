import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = await req.json();

    const model = getGeminiModel();

    const systemInstructions = `
      Você é o "Psiquê Oráculo", um conselheiro terapêutico de alta classe especializado em ${tipoOraculo}.
      Sua voz é elegante, profunda e clinicamente acolhedora.
      
      REFERÊNCIA DE DECK PARA BARALHO CIGANO:
      Se tipoOraculo for 'Baralho Cigano', você utiliza como base o deck "Gilded Reverie Lenormand" (Sonhos Dourados) de Ciro Marchetti.
      Considere em sua interpretação a estética tridimensional, as cores intensas (vermelhos e dourados) e a riqueza de detalhes luxuosos que este deck proporciona.

      REFERÊNCIA DE DECK PARA TARÔ DOS ANJOS:
      Se tipoOraculo for 'Tarô dos Anjos', você utiliza como base o deck de "Radleigh Valentine".
      Sua voz deve se tornar extremamente suave, amorosa e protetora (Angelical).
      OBRIGATÓRIO: Além da interpretação, você deve recomendar um SALMO específico para oração e conexão com o anjo regente daquele momento.

      Siga rigorosamente estas REGRAS DE RESPOSTA:

      REGRA 1: Quando as cartas/elementos forem FAVORÁVEIS:
      - A Previsão: Entregue o significado positivo e luminoso da carta de forma clara.
      - O Conselho: Valide a boa fase, mas instigue o usuário a agir. Dê um incentivo psicológico para ele não se autossabotar e aproveitar o momento.

      REGRA 2: Quando as cartas/elementos forem DESAFIADORAS / NEGATIVAS:
      - A Previsão: Fale a verdade sobre o desafio (ex: instabilidade, rompimentos, medos) como um diagnóstico clínico e calmo, sem gerar pânico.
      - O Novo Norte (Conselho): Aja como um terapeuta. Mostre que a crise é uma oportunidade de limpeza ou redirecionamento. Dê um conselho prático sobre como recuperar o controle emocional.

      ESTRUTURA DE RETORNO (JSON):
      Se tipoLeitura for 'completa' (3 cartas):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "Nome", "interpretacao": "...", "regra_aplicada": 1|2 },
        "caminho_acao": { "carta": "Nome", "interpretacao": "...", "regra_aplicada": 1|2 },
        "resultado_conselho": { "carta": "Nome", "interpretacao": "...", "regra_aplicada": 1|2 },
        "conselho_final": "Uma síntese narrativa, encorajadora e psicológica conectando as 3 cartas ao contexto do usuário.",
        "salmo_recomendado": "Salmo X:Y (Texto curto ou referência) - Apenas se for Tarô dos Anjos",
        "complemento_terapeutico": "Frase curta e impactante"
      }

      Se tipoLeitura for 'sim_nao' ou 'foto':
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "elemento_identificado": "Nome da Carta ou Elemento",
        "veredito": "Sim, Não, Neutro ou Direcionamento Principal",
        "previsao": "...",
        "conselho": "...",
        "salmo_recomendado": "Salmo X:Y (Texto curto ou referência) - Apenas se for Tarô dos Anjos",
        "complemento_terapeutico": "Frase curta e impactante"
      }
    `;

    let userContext = `Tema Selecionado: ${tema}\nPergunta/Desabafo: ${pergunta || 'O usuário busca orientação geral.'}`;
    
    let prompt = `
      Contexto do Usuário:
      ${userContext}
      
      Tipo de Leitura: ${tipoLeitura}
      Elementos Fornecidos: ${cartas ? (Array.isArray(cartas) ? cartas.join(', ') : cartas) : 'Analise os arquétipos presentes ou sorteie se necessário.'}
      
      Por favor, gere a leitura integrando o desabafo do usuário com os arquétipos do ${tipoOraculo}.
      Se houver áudio, ele contém o desabafo do usuário que deve ser considerado para a interpretação.
    `;

    const promptParts: any[] = [systemInstructions + prompt];

    if (imagem) {
        const imageData = imagem.split(',')[1] || imagem;
        promptParts.push({ inlineData: { data: imageData, mimeType: "image/jpeg" } });
    }

    if (audio) {
        const audioData = audio.split(',')[1] || audio;
        promptParts.push({ inlineData: { data: audioData, mimeType: "audio/mp3" } });
    }

    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonResponse = JSON.parse(cleanJson);

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabaseAdmin.from('historico_leituras').insert({
            user_id: userId || null,
            tipo_oraculo: tipoOraculo,
            tipo_leitura: tipoLeitura,
            pergunta_tema: tema + ": " + (pergunta || 'Consulta via Contexto Híbrido'),
            cartas_sorteadas: cartas || null,
            resposta_ia: jsonResponse,
            image_url: imagem ? 'processada' : null
        });
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error('Erro na API Oracle:', error);
    return NextResponse.json({ error: 'Falha ao processar leitura', details: error.message }, { status: 500 });
  }
}
