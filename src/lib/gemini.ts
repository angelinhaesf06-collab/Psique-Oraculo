import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const getGeminiModel = (modelName: string = "gemini-3.1-flash-lite") => {
  return genAI.getGenerativeModel({ model: modelName });
};
