import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const getGeminiModel = (modelName: string = "gemini-2.0-flash-lite-preview-02-05") => {
  return genAI.getGenerativeModel({ model: modelName });
};
