import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY não encontrada no ambiente.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiModel = (modelName: string = "gemini-2.0-flash-lite-preview-02-05") => {
  if (!apiKey) throw new Error("Chave de API do Gemini não configurada.");
  console.log("Inicializando modelo:", modelName);
  return genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: `Você é o "Psiquê Oráculo", um conselheiro de alma Junguiano. 
    Sua voz é sofisticada, empática e poética. Você integra a sabedoria dos oráculos com a Psicologia Analítica.
    Responda SEMPRE em formato JSON puro, sem marcações de markdown.`
  });
};
