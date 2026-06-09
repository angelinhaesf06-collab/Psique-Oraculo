import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: "online", message: "Portal Oráculo está pronto para sintonização." });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verificar Autenticação (Bearer Token)
    const authHeader = req.headers.get("Authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader.length > 15) {
      const token = authHeader.split(" ")[1];
      try {
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        } else {
          console.warn("Token inválido ou expirado:", authError?.message);
        }
      } catch (e) {
        console.error("Erro ao validar token:", e);
      }
    }

    const body = await req.json();
    const { tipoOraculo, tipoLeitura, tema, pergunta, cartas, imagem, imageUrl } = body;

    console.log("--- INÍCIO DA REQUISIÇÃO ORÁCULO ---");
    console.log("Usuário ID Identificado:", userId);
    console.log("Tipo Oráculo:", tipoOraculo);
    console.log("Tipo Leitura:", tipoLeitura);
    console.log("Tema:", tema);

    // 2. Validação e Consumo de Créditos (Sempre permitir por enquanto)
    let creditStatus = { allowed: true, type: "test_mode" };

    // 3. Inicialização do Modelo Gemini
    console.log("Sintonizando com o Modelo Gemini...");
    
    // Customizar instruções baseado no tipo de leitura
    let instrucaoEspecifica = "";
    if (tipoLeitura === 'sim_nao') {
      instrucaoEspecifica = `FOCO SIM OU NÃO: Responda de forma objetiva se SIM, NÃO ou TALVEZ. Use o campo 'carta_sorteada' e 'leitura_caminho.veredito_direto'.`;
    } else if (tipoLeitura === 'mensagem_dia') {
      instrucaoEspecifica = `FOCO MENSAGEM DO DIA: Gere uma mensagem curta, inspiradora e poética para o início do dia. 
      Ao final da mensagem, inclua SEMPRE uma "Dica da Alma" prática.
      Exemplos de dicas: Caminhar ao ar livre, meditar por 5 minutos, escrever no caderno da gratidão, cozinhar sua comida preferida, dar amor aos seus bichinhos de estimação, levá-los para passear, ou ir à academia.
      Use APENAS o campo 'acolhimento_quantum' (titulo e conteudo).`;
    } else {
      instrucaoEspecifica = `FOCO LEITURA COMPLETA: Analise profundamente as 3 cartas enviadas. Use os campos 'situacao_atual', 'caminho_acao' e 'resultado_conselho'.`;
    }

    const systemInstruction = `
      Você é o "Psiquê Oráculo", um mentor de alma e autoridade mística (Voz: Junguiana, Poética, Empática).
      Responda RIGOROSAMENTE em PORTUGUÊS DO BRASIL em JSON PURO (sem markdown).

      ORÁCULO: ${tipoOraculo} | LEITURA: ${tipoLeitura}
      ${instrucaoEspecifica}
      
      REGRAS POR ORÁCULO:
      1. TARÔ: Foco Arquetípico. Cite Arcanos em PORTUGUÊS. Mantra final.
      2. CIGANO: Preditivo/Prático. Nome + Número. Ofereça Banho/Cristal/Erva. Campo 'salmo': Dica da Cigana.
      3. ANJOS: Amparo Angelical. Nome do Anjo. Salmo real, Arcanjo e Versículo. Campo 'dica_angelical': ritual completo. NUNCA envie banhos aqui.

      ESTRUTURA JSON (VALORES EM PT-BR):
      {
        "oraculo_utilizado": "${tipoOraculo}",
        "tema": "${tema}",
        "situacao_atual": { "carta": "NOME", "interpretacao": "ANÁLISE PROFUNDA" },
        "caminho_acao": { "carta": "NOME", "interpretacao": "CONSELHO" },
        "resultado_conselho": { "carta": "NOME", "interpretacao": "DESDOBRAMENTO" },
        "carta_sorteada": { "carta": "NOME", "interpretacao": "MOTIVO" },
        "leitura_caminho": { "titulo": "Título", "analise_detalhada": "SÍNTESE", "veredito_direto": "SIM/NÃO/TALVEZ" },
        "acolhimento_quantum": { "titulo": "Sabedoria", "conteudo": "Reflexão" },
        "acolhimento_psicologico": { "titulo": "Escuta", "conteudo": "Análise Acolhedora" },
        "ancoragem_rituais": { "mantra": "...", "salmo": "...", "banho": "...", "biblia": "...", "dica_angelical": { "foco_oracao": "...", "vela_cor": "...", "ritual_dias": "...", "dica_texto": "..." } }
      }
    `;

    let model;
    try {
      // Gemini 3.1 Flash-Lite: O ápice da velocidade e inteligência para oráculos em tempo real.
      model = getGeminiModel("gemini-3.1-flash-lite", systemInstruction);
    } catch (e: any) {
      console.error("Erro ao obter modelo Gemini:", e.message);
      throw new Error("Configuração da IA inválida.");
    }

    const nomesDasCartas = Array.isArray(cartas) 
      ? cartas.map(c => typeof c === 'string' ? c : (c.name || c.carta)).join(", ") 
      : (typeof cartas === 'string' ? cartas : "Aguardando identificação via Imagem...");

    const prompt = `Consulente: ${body.userName || "Alma Querida"}. Tema: ${tema}. Pergunta/Desabafo: ${pergunta || "Sintonização Geral"}. Cartas Sorteada: ${nomesDasCartas}. Método: ${tipoLeitura}.`;

    console.log("Enviando requisição otimizada para o Portal...");
    const parts: any[] = [{ text: prompt }];
    
    if (imagem && imagem.includes("base64,")) {
      const base64Data = imagem.split("base64,")[1];
      const mimeType = imagem.split(";")[0].split(":")[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    let responseText = "";
    let attempts = 0;
    const maxAttempts = 3;
    let currentModelName = "gemini-3.1-flash-lite";

    while (attempts < maxAttempts) {
      try {
        console.log(`Tentativa ${attempts + 1} com o modelo: ${currentModelName}`);
        const currentModel = getGeminiModel(currentModelName, systemInstruction);
        const result = await currentModel.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
            maxOutputTokens: 2000
          } as any
        });

        responseText = result.response.text();
        break; // Sucesso! Sai do loop.
      } catch (aiError: any) {
        attempts++;
        const status = aiError.status || 500;
        console.error(`Falha na tentativa ${attempts}:`, aiError.message);

        if (status === 429 && attempts < maxAttempts) {
          console.warn("Erro de cota detectado. Aguardando 1s para re-tentar...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        if (attempts >= maxAttempts && currentModelName === "gemini-3.1-flash-lite") {
          console.warn("Falha persistente no 3.1. Tentando fallback para 1.5-flash...");
          currentModelName = "gemini-1.5-flash-latest";
          attempts = 0; // Reinicia tentativas para o modelo de fallback
          continue;
        }

        const errorMsg = aiError.message || "Erro desconhecido na IA";
        throw new Error(`IA Falhou (${status}): ${errorMsg}`);
      }
    }

    let jsonResponse;
    try {
      // Tentar extrair apenas o JSON da resposta, caso a IA tenha incluído conversa ou markdown
      // Isso resolve o erro "Unexpected token 'O', 'Okay, I'm '..."
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleanedResponse = jsonMatch ? jsonMatch[0] : responseText;
      jsonResponse = JSON.parse(cleanedResponse);

      // Trava de Segurança: Forçar a tradução caso a IA alucine em inglês no Bússola Sim ou Não
      if (jsonResponse?.leitura_caminho?.veredito_direto) {
        let v = jsonResponse.leitura_caminho.veredito_direto.toString().toUpperCase();
        if (/\bNO\b/.test(v) || v.includes('NÃO')) {
          jsonResponse.leitura_caminho.veredito_direto = 'NÃO';
        } else if (/\bYES\b/.test(v) || v.includes('SIM')) {
          jsonResponse.leitura_caminho.veredito_direto = 'SIM';
        } else if (/\bMAYBE\b/.test(v) || v.includes('TALVEZ')) {
          jsonResponse.leitura_caminho.veredito_direto = 'TALVEZ';
        }
      }
    } catch (parseError: any) {
      console.error("Erro ao parsear JSON da IA. Resposta bruta:", responseText);
      throw new Error(`O Oráculo retornou um formato inesperado. Detalhes: ${responseText.substring(0, 50)}...`);
    }

    // 5. Salvando no Histórico
    try {
        console.log("Salvando leitura no histórico...");
        await supabaseAdmin.from("historico_leituras").insert({
            user_id: userId,
            tipo_oraculo: tipoOraculo,
            tipo_leitura: tipoLeitura,
            pergunta_tema: tema + (pergunta ? ": " + pergunta : ""),
            resposta_ia: jsonResponse
        });
        console.log("Histórico salvo com sucesso.");
    } catch (e) { 
      console.warn("Falha ao salvar histórico:", e); 
    }

    const response = NextResponse.json({
      ...jsonResponse,
      usage: creditStatus
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error: any) {
    console.error("Erro na API Business:", error);
    const errorResponse = NextResponse.json({ error: "Falha na conexão sagrada", details: error.message }, { status: 500 });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errorResponse;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
