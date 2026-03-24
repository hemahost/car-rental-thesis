import { Request, Response } from "express";
import { ChatbotService } from "../services/chatbot.service";

const chatbotService = new ChatbotService();

export async function postChatbotMessage(req: Request, res: Response) {
  try {
    const { message } = req.body as { message?: string };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "message is required" },
      });
    }

    const result = await chatbotService.handleChat({
      message: message.trim(),
      authorizationHeader: req.headers.authorization,
    });

    return res.status(200).json({
      success: true,
      data: {
        filters: result.filters,
        recommendations: result.recommendations,
        aiResponse: result.aiResponse,
      },
    });
  } catch (error) {
    console.error("[chatbot] controller error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to process chatbot request" },
    });
  }
}
