
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const QUIZ_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE] },
          questionText: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["id", "type", "questionText", "correctAnswer"]
      }
    }
  },
  required: ["title", "questions"]
};

export async function generateQuizFromContent(
  text?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<{ title: string; questions: Question[] }> {
  // Sử dụng Gemini 3 Pro cho các tác vụ phức tạp và trích xuất số lượng lớn
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `
    Bạn là chuyên gia trích xuất dữ liệu thô từ tài liệu giáo dục cho hệ thống BrianQuiz. 
    
    NHIỆM VỤ TỐI THƯỢNG:
    1. ĐỌC TỪNG CHỮ: Phân tích kỹ lưỡng văn bản thô hoặc hình ảnh được cung cấp.
    2. TRÍCH XUẤT NGUYÊN VĂN: Lấy ra chính xác câu hỏi và các phương án A, B, C, D từ tệp nguồn.
    3. GIỚI HẠN: Trích xuất tối đa 200 câu hỏi. Đừng dừng lại nếu tài liệu vẫn còn nội dung.
    4. NHẬN DIỆN ĐÁP ÁN: 
       - Tìm các dấu hiệu: Chữ in đậm, tô đỏ, hoặc dấu chọn (x, v, o) trong đề bài. 
       - Nếu không thấy dấu hiệu, hãy dựa vào kiến thức chuyên môn để xác định đáp án chính xác nhất.
    5. KHÔNG TỰ SÁNG TẠO: Chỉ lấy những gì có trong tệp khách hàng gửi.
    
    ĐỊNH DẠNG:
    - Đối với MULTIPLE_CHOICE: correctAnswer PHẢI là "A", "B", "C" hoặc "D".
    - Đối với TRUE_FALSE: correctAnswer PHẢI là "True" hoặc "False".
    - Luôn trả về JSON chính xác theo schema.
  `;

  const parts: any[] = [];
  if (text) {
    parts.push({ text: `ĐÂY LÀ VĂN BẢN NGUỒN CẦN TRÍCH XUẤT (TỐI ĐA 200 CÂU): \n\n ${text}` });
  }
  if (imageBase64 && mimeType) {
    parts.push({
      inlineData: { data: imageBase64, mimeType: mimeType }
    });
    parts.push({ text: "HÃY QUÉT HÌNH ẢNH NÀY. TRÍCH XUẤT MỌI CÂU HỎI VÀ ĐÁP ÁN ĐƯỢC ĐÁNH DẤU TRONG ĐỀ." });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: QUIZ_SCHEMA,
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    if (!data.questions || data.questions.length === 0) {
      throw new Error("Không tìm thấy câu hỏi nào. Vui lòng đảm bảo tệp của bạn chứa nội dung đề thi rõ ràng.");
    }
    return data;
  } catch (error) {
    console.error("Extraction Error:", error);
    throw new Error("Gặp lỗi khi trích xuất dữ liệu. Vui lòng kiểm tra lại chất lượng file.");
  }
}
