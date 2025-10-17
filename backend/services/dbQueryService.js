import pool from "../config/db.js";

/**
 * Search products using a user message (string).
 * Returns array of rows: [{ id, name, price, image, created_at }, ...]
 */
export const searchProducts = async (userMessage) => {
  try {
    if (!userMessage || typeof userMessage !== "string") return [];

    // Simple keyword extraction (allow 2+ letters)
    const keywords = userMessage
      .toLowerCase()
      .replace(/[^a-z0-9\s₹$,.]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1); // changed >1 to include short words

    if (keywords.length === 0) return [];

    // Build WHERE clause with parameterized values
    const whereClauses = keywords.map((_, i) => `LOWER(name) LIKE $${i + 1}`);
    const query = `
      SELECT id, name, price, image, created_at
      FROM products
      WHERE ${whereClauses.join(" OR ")}
      LIMIT 10;
    `;
    const values = keywords.map((k) => `%${k}%`);

    const { rows } = await pool.query(query, values);
    return rows || [];
  } catch (error) {
    console.error("DB Query Error:", error.message || error);
    return [];
  }
};
