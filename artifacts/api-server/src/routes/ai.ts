import { Router } from "express";
import OpenAI from "openai";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are CyberCultX AI — a cybersecurity human risk intelligence assistant embedded in the CyberCultX platform. You help executives, HR managers, and security teams understand their organization's security posture, interpret risk scores, and take action to reduce human risk.

You have expertise in:
- Human Risk Score (HRS): measures behavioral risk (0=safe, 100=critical)
- Cyber Culture Index (CCI): measures security culture strength (higher is better)
- Phishing simulation analysis
- Security awareness training strategies
- Compliance behavior
- Behavioral psychology as it relates to cybersecurity

Keep responses concise, data-driven, and actionable. When the user shares metrics or asks for interpretation, give specific, practical recommendations. Support both English and Arabic responses — respond in the same language the user writes in.`;

router.post("/ai/chat", requireAuth, async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  if (message.length > 2000) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
      max_tokens: 1024,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI chat error:", err);
    res.write(`data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`);
    res.end();
  }
});

export default router;
