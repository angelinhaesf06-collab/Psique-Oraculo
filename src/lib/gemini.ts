import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const getGeminiModel = (modelName: string = "gemini-2.0-flash-exp") => {
  return genAI.getGenerativeModel({ model: modelName });
};
