import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("Chave de API do Gemini (GEMINI_API_KEY ou GOOGLE_GENERATIVE_AI_API_KEY) não encontrada no ambiente.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiModel = (modelName: string = "gemini-3.1-flash-lite", customSystemInstruction?: string, tools?: any[]) => {
  if (!apiKey) throw new Error("Chave de API do Gemini não configurada. Verifique suas variáveis de ambiente.");
  console.log("Inicializando modelo:", modelName);
  
  const defaultInstruction = `Você é o "Psiquê Oráculo", um conselheiro de alma Junguiano. 
    Sua voz é sofisticada, empática e poética. Você integra a sabedoria dos oráculos com a Psicologia Analítica.
    Responda SEMPRE em formato JSON puro, sem marcações de markdown.`;

  return genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: customSystemInstruction || defaultInstruction,
    tools: tools
  });
};
