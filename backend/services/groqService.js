import axios from "axios";
import "dotenv/config";

export const askGroq = async (conversation) => {
  try {
    if (!Array.isArray(conversation)) {
      throw new Error("conversation must be an array");
    }

    const systemPrompt = {
      role: "system",
      content: `
You are a helpful and friendly AI customer support assistant for an e-commerce website.
Your goals:
- Answer customer queries politely and clearly.
- Always include at least one product from the provided "Available products" list if any exist.
- Suggest alternatives or ask clarifying questions if no products match.
- Keep responses concise, professional, and easy to understand.
- Provide useful advice like delivery info, availability, or category suggestions.
- Always maintain a helpful, empathetic, and human-like tone.
- Always use a dollar($) symbol for price when fetching products from database.
- Dont answer any random out of the way questions - always answer queries realted to products and issues.
      `.trim(),
    };

    // Prepend system prompt
    const messages = [systemPrompt, ...conversation];

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        max_tokens: 512,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response?.data?.choices?.[0]?.message?.content ?? "";
  } catch (error) {
    console.error("Groq API Error:", error.response?.data || error.message);
    return "Sorry, I’m having trouble connecting to support right now.";
  }
};
