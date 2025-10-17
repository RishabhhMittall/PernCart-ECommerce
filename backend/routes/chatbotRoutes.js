import express from "express";
import { getSession, saveMessage } from "../services/sessionService.js";
import { searchProducts } from "../services/dbQueryService.js";
import { askGroq } from "../services/groqService.js";
import { sql } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const escalationKeywords = ["issue", "problem", "error", "not working", "help", "complaint"];

router.post("/", async (req, res) => {
  try {
    let { message, sessionId } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) is required" });
    }

    if (!sessionId) sessionId = uuidv4();

    // Load previous messages
    const prevRows = await getSession(sessionId);
    const previousMessages = Array.isArray(prevRows)
      ? prevRows.map((r) => ({ role: r.role, content: r.content }))
      : [];

    // Check for escalation keywords
    const isEscalation = escalationKeywords.some((kw) => message.toLowerCase().includes(kw));
    if (isEscalation) {
      const escalationMsg = {
        role: "assistant",
        content:
          "⚠️ I see that you're having an issue. I'm escalating this to our human support team. Someone will assist you shortly.",
      };
      await saveMessage(sessionId, { role: "assistant", content: escalationMsg.content });
      res.json({ reply: escalationMsg.content, sessionId });

      // Mock human agent reply after 2s
      setTimeout(async () => {
        const humanReply = {
          role: "assistant",
          content:
            "👩‍💼 Human Agent: Hi! I'm your support specialist. Could you provide more details about the issue?",
        };
        await saveMessage(sessionId, humanReply);
      }, 2000);
      return;
    }

    // Search products
    const products = await searchProducts(message);
    let productContext = "No relevant products found.";
    if (products.length > 0) {
      productContext = products
        .map((p) => `• ${p.name} (Price: ₹${p.price})`)
        .join("\n");
    }

    // Build conversation
    const systemPrompt = {
      role: "system",
      content: `You are a helpful AI assistant. Answer using the available product list if any exists.`,
    };
    const conversation = [
      systemPrompt,
      ...previousMessages,
      {
        role: "user",
        content: `User query: "${message}"\n\nAvailable products:\n${productContext}`,
      },
    ];

    // Save user message
    await saveMessage(sessionId, { role: "user", content: message });

    // Call Groq
    const reply = await askGroq(conversation);
    await saveMessage(sessionId, { role: "assistant", content: reply });

    res.json({ reply, sessionId });
  } catch (err) {
    console.error("Chatbot Route Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch chat history
router.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const messages = await getSession(sessionId);
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    res.json({ history });
  } catch (err) {
    console.error("History Route Error:", err);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

// Delete chat history
router.delete("/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  try {
    await sql`DELETE FROM chat_sessions WHERE session_id = ${sessionId}`;
    await sql`DELETE FROM chat_history WHERE session_id = ${sessionId}`;
    res.json({ success: true, message: "Chat history deleted" });
  } catch (err) {
    console.error("DELETE /history error:", err);
    res.status(500).json({ error: "Failed to delete chat history" });
  }
});

export default router;
