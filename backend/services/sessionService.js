// backend/services/sessionService.js
import { sql } from "../config/db.js";

// ✅ Create table if not exists
export async function initChatTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS chat_history (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// ✅ Save one message
export async function saveMessage(sessionId, { role, content }) {
  await sql`
    INSERT INTO chat_history (session_id, role, content)
    VALUES (${sessionId}, ${role}, ${content})
  `;
}

// ✅ Get all messages for a given session
export async function getSession(sessionId) {
  const rows = await sql`
    SELECT role, content FROM chat_history
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
  `;
  return rows;
}

// ✅ Optional: Delete chat history for a session (for Reset)
export async function clearSession(sessionId) {
  await sql`DELETE FROM chat_history WHERE session_id = ${sessionId}`;
}
