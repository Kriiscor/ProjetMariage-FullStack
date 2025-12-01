import { Request, Response } from "express";
import { chatWithAI } from "../services/aiService";

export const chat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "'message' is required" });
    }
    const result = await chatWithAI(message);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, error: error?.message || "Chat error" });
  }
};
