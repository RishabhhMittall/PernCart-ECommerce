import { askGroq } from "../services/groqService.js";

export const handleChatbot = async (req, res) => {
  const { message } = req.body;

  if (!message)
    return res.status(400).json({ error: "Message is required" });

  const reply = await askGroq(message);
  res.json({ reply });
};
    