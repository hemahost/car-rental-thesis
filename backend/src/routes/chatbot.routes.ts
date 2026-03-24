import { Router } from "express";
import { postChatbotMessage } from "../controllers/chatbot.controller";

const router = Router();

router.post("/", postChatbotMessage);

export default router;
