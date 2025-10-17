import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Send, Bot, User, X, MessageCircle } from "lucide-react";

const predefinedPrompts = [
  { label: "Ask about a product", value: "Can you tell me about product X?" },
  { label: "Shipping info", value: "What's the delivery time for product Y?" },
  { label: "Return policy", value: "How can I return a product?" },
  { label: "Report an issue", value: "I'm having a problem with my order" },
];

const escalationKeywords = [
  "issue",
  "problem",
  "error",
  "not working",
  "help",
  "complaint",
];

const Chatbot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "assistant",
            content:
              "👋 Hello! Welcome to our support chat. How can I help you today?",
          },
        ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem("sessionId")
  );
  const chatEndRef = useRef(null);

  const handleReset = async () => {
    try {
      // Delete chat history from backend if session exists
      if (sessionId) {
        await axios.delete(
          `http://localhost:3000/api/chatbot/history/${sessionId}`
        );
      }

      // Clear localStorage
      localStorage.removeItem("chatMessages");
      localStorage.removeItem("sessionId");

      // Reset state
      const newSession = crypto.randomUUID();
      setSessionId(newSession);
      localStorage.setItem("sessionId", newSession);
      setMessages([
        {
          role: "assistant",
          content: "👋 Chat reset. How can I assist you today?",
        },
      ]);
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Ensure sessionId
  useEffect(() => {
    if (!sessionId) {
      const newSession = crypto.randomUUID();
      localStorage.setItem("sessionId", newSession);
      setSessionId(newSession);
    }
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const checkEscalation = (msg) => {
    const lower = msg.toLowerCase();
    return escalationKeywords.some((keyword) => lower.includes(keyword));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    // Escalation simulation
    if (checkEscalation(input)) {
      setTimeout(() => {
        const escalationMsg = {
          role: "assistant",
          content:
            "⚠️ I see that you're having an issue. I'm escalating this to our human support team. Someone will assist you shortly.",
        };
        setMessages((prev) => [...prev, escalationMsg]);
        setLoading(false);

        // Mock human agent reply
        setTimeout(() => {
          const humanReply = {
            role: "assistant",
            content:
              "👩‍💼 Human Agent: Hi! I'm your support specialist. Could you provide more details about the issue?",
          };
          setMessages((prev) => [...prev, humanReply]);
        }, 2000);
      }, 1000);
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/chatbot", {
        message: input,
        sessionId,
      });

      if (res.data.sessionId && res.data.sessionId !== sessionId) {
        localStorage.setItem("sessionId", res.data.sessionId);
        setSessionId(res.data.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        >
          <MessageCircle
            size={28}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Chat Support
                </h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>{" "}
                  Online
                </p>
                {/* Reset */}
                <button
                  onClick={handleReset}
                  className="text-xs text-white/80 hover:text-white bg-white/10 px-2 py-1 rounded-md ml-auto transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Predefined prompts */}
          <div className="flex gap-2 p-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {predefinedPrompts.map((p) => (
              <button
                key={p.value}
                onClick={() => setInput(p.value)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-96 bg-gray-50 dark:bg-gray-900">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 self-end">
                    <Bot size={18} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl shadow-md ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm"
                      : m.content.includes("Human Agent")
                      ? "bg-red-100 text-red-800 rounded-bl-sm border border-red-300"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 self-end">
                    <User
                      size={18}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start animate-fadeIn">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-2xl rounded-bl-sm flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  ></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Chatbot;
