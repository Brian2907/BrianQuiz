
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType } from "../types";

// Initialize the Gemini client with the API key from environment variables
// Always use the named parameter `apiKey` and `process.env.API_KEY`
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a set of quiz questions based on a given topic using Gemini AI.
 * Uses structured JSON output with a specific schema for quiz questions.
 */
export const generateAIQuestions = async (topic: string, count: number = 5): Promise<Question[]> => {
  // Using gemini-3-pro-preview for complex text tasks like educational content generation
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Hãy đóng vai một chuyên gia giáo dục. Tạo một bộ câu hỏi trắc nghiệm hoặc đúng/sai về chủ đề: "${topic}". 
    Số lượng: ${count} câu. Ngôn ngữ: Tiếng Việt. 
    Đảm bảo nội dung chính xác, mang tính học thuật và thú vị.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionText: { 
              type: Type.STRING,
              description: "Nội dung câu hỏi"
            },
            type: { 
              type: Type.STRING, 
              enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE],
              description: "Loại câu hỏi (MULTIPLE_CHOICE hoặc TRUE_FALSE)"
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Mảng 4 phương án cho trắc nghiệm. Để trống hoặc null cho đúng/sai."
            },
            correctAnswer: { 
              type: Type.STRING,
              description: "Đáp án đúng ('A', 'B', 'C', 'D' hoặc 'True', 'False')"
            },
            explanation: { 
              type: Type.STRING,
              description: "Giải thích ngắn gọn tại sao đáp án đó đúng"
            }
          },
          required: ["questionText", "type", "correctAnswer"],
          propertyOrdering: ["questionText", "type", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  // Access the text property directly from the response
  const text = response.text;
  if (!text) return [];

  try {
    const rawQuestions = JSON.parse(text);
    return rawQuestions.map((q: any) => ({
      ...q,
      id: crypto.randomUUID(),
      // Standardize options for the UI
      options: q.type === QuestionType.MULTIPLE_CHOICE 
        ? (Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['', '', '', '']) 
        : undefined
    }));
  } catch (error) {
    console.error("Error parsing Gemini quiz response:", error);
    return [];
  }
};
