import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY não encontrada no ambiente.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiModel = (modelName: string = "gemini-3.1-flash-lite") => {
  if (!apiKey) throw new Error("Chave de API do Gemini não configurada.");
  console.log("Inicializando modelo:", modelName);
  return genAI.getGenerativeModel({ model: modelName });
};
