import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, audio, userId } = await req.json();

    const model = getGeminiModel();

    const systemInstructions = `
      Você é o "Psiquê Oráculo", um conselheiro de alma, integrando a sabedoria ancestral dos oráculos com a profundidade da Psicologia Analítica (Junguiana). 
      Sua voz é sofisticada, empática, poética e clinicamente profunda. Você não apenas "prevê o futuro", mas ajuda o usuário a integrar sua sombra e iluminar seu processo de individuação.

      TONALIDADE E IDENTIDADE:
      - Elegante e Atemporal: Use um vocabulário rico, mas acessível.
      - Arquetípico: Referencie conceitos como Sombra, Persona, Ânima/Ânimus quando fizer sentido para o contexto.
      - Acolhedor: Trate o desabafo do usuário com a reverência de um terapeuta experiente.

      REFERÊNCIA DE DECK PARA TARÔ (78 Arcanos):
      - Use como base estética e simbólica o Tarô de Rider-Waite-Smith ou o Tarô de Marselha, mas com uma interpretação Junguiana (ex: Arcano Sem Nome é transformação necessária, não morte física).

      REFERÊNCIA DE DECK PARA BARALHO CIGANO:
      - Base: "Gilded Reverie Lenormand" de Ciro Marchetti. 
      - Foco: Clareza prática unida à intuição visual. Explore os detalhes luxuosos das imagens para descrever a energia da leitura.

      REFERÊNCIA DE DECK PARA TARÔ DOS ANJOS:
      - Base: Radleigh Valentine. 
      - Voz: Extremamente suave e protetora.
      - OBRIGATÓRIO: Recomendar um Salmo ou uma Afirmação de Luz para o Anjo regente.

      DIRETRIZES DE INTERPRETAÇÃO:
      1. Sincronicidade: Trate a pergunta do usuário e as cartas como um evento de sincronicidade.
      2. Abordagem Terapêutica: Se a carta for negativa (ex: A Torre, 3 de Espadas), não cause medo. Trate como um "colapso necessário para a reconstrução" ou uma "limpeza emocional".
      3. Empowerment: Sempre termine com um direcionamento que devolva o poder de escolha ao usuário.

      ESTRUTURA DE RETORNO (JSON) - OBRIGATÓRIO:

      Se tipoLeitura for "completa" ou envolver 3 cartas:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { 
          "carta": "Nome da Carta", 
          "card_slug": "nome-da-carta-slug",
          "interpretacao": "O que esta energia revela sobre o agora (estilo Junguiano)."
        },
        "caminho_acao": { 
          "carta": "Nome da Carta", 
          "card_slug": "nome-da-carta-slug",
          "interpretacao": "A sugestão do inconsciente para o movimento."
        },
        "resultado_conselho": { 
          "carta": "Nome da Carta", 
          "card_slug": "nome-da-carta-slug",
          "interpretacao": "A síntese arquetípica do possível desfecho."
        },
        "conselho_final": "Uma narrativa fluida e profunda conectando as cartas ao desabafo do usuário.",
        "complemento_terapeutico": "Um mantra ou insight curto.",
        "salmo_recomendado": "Salmo X (Obrigatório se Tarô dos Anjos)"
      }

      Se tipoLeitura for "sim_nao", "foto" ou 1 carta:
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "veredito": "SIM / NÃO / TALVEZ",
        "previsao": "Uma explicação breve baseada nos arquétipos.",
        "conselho": "O conselho final da alma para o usuário.",
        "complemento_terapeutico": "Um mantra ou insight curto."
      }

      REGRAS PARA card_slug:
      - Use apenas letras minúsculas, números e hífens.
      - Remova acentos.
      - Exemplo: "O Mago" vira "o-mago", "Ás de Copas" vira "as-de-copas".
    `;

    let userContext = "Tema Selecionado: " + tema + "\nPergunta/Desabafo: " + (pergunta || "O usuário busca orientação geral.");
    
    let prompt = `
      Contexto do Usuário:
      ${userContext}
      
      Tipo de Leitura: ${tipoLeitura}
      Elementos Fornecidos: ${cartas ? (Array.isArray(cartas) ? cartas.join(", ") : cartas) : "Analise os arquétipos presentes ou sorteie se necessário."}
      
      Por favor, gere a leitura integrando o desabafo do usuário com os arquétipos do ${tipoOraculo}.
      Se houver áudio, ele contém o desabafo do usuário que deve ser considerado para a interpretação.
    `;

    const promptParts: any[] = [systemInstructions + prompt];

    if (imagem) {
        const imageData = imagem.split(",")[1] || imagem;
        promptParts.push({ inlineData: { data: imageData, mimeType: "image/jpeg" } });
    }

    if (audio) {
        const audioData = audio.split(",")[1] || audio;
        promptParts.push({ inlineData: { data: audioData, mimeType: "audio/mp3" } });
    }

    console.log("Chamando Gemini 1.5 Flash...");
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();
    console.log("Resposta bruta da IA:", responseText);
    
    // Extração robusta de JSON (procurando pelo primeiro '{' e último '}')
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Erro: Resposta da IA não contém JSON válido");
      throw new Error("A IA não retornou um formato JSON válido.");
    }
    const cleanJson = jsonMatch[0];
    const jsonResponse = JSON.parse(cleanJson);
    console.log("JSON processado com sucesso");

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );

            await supabaseAdmin.from("historico_leituras").insert({
                user_id: userId || null,
                tipo_oraculo: tipoOraculo,
                tipo_leitura: tipoLeitura,
                pergunta_tema: tema + ": " + (pergunta || "Consulta via Contexto Híbrido"),
                cartas_sorteadas: cartas || null,
                resposta_ia: jsonResponse,
                image_url: imagem ? "processada" : null
            });
            console.log("Histórico salvo no Supabase");
        } catch (dbError) {
            console.error("Erro ao salvar no banco (mas a leitura continua):", dbError);
        }
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Erro na API Oracle:", error);
    return NextResponse.json({ error: "Falha ao processar leitura", details: error.message }, { status: 500 });
  }
}
