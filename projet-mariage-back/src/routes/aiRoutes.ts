import express from "express";
import { chat } from "../controllers/aiController";

const router = express.Router();

router.post("/chat", chat);

export default router;

