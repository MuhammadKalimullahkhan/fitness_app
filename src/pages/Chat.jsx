import { useState, useEffect, useRef } from "react";
import { apiKey } from "../EnvManager";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // ✅ use the same working model as in WorkoutManagement
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const systemPrompt = `
        You are a specialized AI assistant for Mighty Fitness, named "Mighty Trainer".
        You only answer questions related to gym, fitness, and health.
        If the question is off-topic, politely refuse and remind the user to stay on topic.
        Keep responses friendly, short, and encouraging.
      `;

      const payload = {
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...newMessages.map((msg) => ({
            role: msg.sender === "ai" ? "model" : "user",
            parts: [{ text: msg.text }],
          })),
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 300,
        },
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const aiResponseText =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I didn’t get a valid response.";

      const aiMessage = { sender: "ai", text: aiResponseText };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      console.error("Error sending message:", e);
      const errorMessage = { sender: "ai", text: `⚠️ ${e.message}` };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="w-full bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700 flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Chat with Mighty Trainer
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-xl max-w-xs lg:max-w-md shadow-md ${
                  msg.sender === "user"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-xl bg-gray-700 text-gray-200 animate-pulse">
                Thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="mt-4 flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
            className="flex-1 p-3 bg-gray-700 rounded-l-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            placeholder="Ask about fitness..."
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-4 rounded-r-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
