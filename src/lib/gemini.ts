import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey || "");

export const getGeminiModel = (modelName: string = "gemini-3.1-flash-lite", customSystemInstruction?: string) => {
  if (!apiKey) throw new Error("Chave de API não configurada.");
  
  console.log("Sintonizando Oráculo com:", modelName);

  return genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: customSystemInstruction
  });
};
