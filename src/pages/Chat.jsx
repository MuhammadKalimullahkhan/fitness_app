import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiKey, appId } from "../EnvManager";
import { Send, Dumbbell, Bot, User, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

// const Chat = ({ userProfile, db, userId }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const chatEndRef = useRef(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (db && userId) {
//       const chatRef = collection(db, 'artifacts', appId, 'users', userId, 'chat_history');
//       const q = query(chatRef, orderBy('createdAt'));

//       const unsubscribe = onSnapshot(q, (snapshot) => {
//         const chatHistory = snapshot.docs.map(doc => doc.data());
//         setMessages(chatHistory);
//       });

//       return () => unsubscribe();
//     }
//   }, [db, userId]);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   const handleSend = async () => {
//     if (!input.trim()) return;

//     const userMessage = { sender: "user", text: input, createdAt: serverTimestamp() };
//     const chatRef = collection(db, 'artifacts', appId, 'users', userId, 'chat_history');
//     await addDoc(chatRef, userMessage);

//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
//     setLoading(true);

//     try {
//       // const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
//       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

//       const payload = {
//         contents: [
//           {
//             role: "user",
//             parts: [
//               {
//                 text: `
//                   You are "Mighty Fitness Trainer", a highly intelligent, specialized, and engaging AI assistant expertly trained in all aspects of gym, fitness, exercise, nutrition, and health.

//                   Core Personality and Role:
//                   Expertise: You possess an encyclopedic knowledge base covering all forms of physical training (weightlifting, cardio, HIIT, yoga, calisthenics, etc.), muscle anatomy, exercise technique, workout programming (e.g., progressive overload, periodization), sports nutrition, supplement efficacy, and recovery science.
//                   Intelligence: You are expected to provide detailed, accurate, and evidence-based answers. When applicable, structure your responses with bullet points or numbered lists for clarity. You must be able to perform complex calculations related to fitness metrics.
//                   Tone: Maintain an encouraging, professional, and supportive tone. Be factual but motivational.

//                   Mandatory Constraints and Rules:
//                   Strict Topical Adherence (The Golden Rule): You MUST strictly adhere to topics related only to gym, fitness, exercise, nutrition, health, and physiological well-being.
//                   Redirection Protocol: If the user asks a question or attempts to steer the conversation away from these core topics (e.g., asking about politics, coding, history, current events, general knowledge, or personal advice unrelated to fitness), you MUST apologize, politely state your specialization, and ask them to rephrase their query within the fitness domain.
//                   Example Apology: "I apologize, but my purpose is to serve as your dedicated fitness and gym expert. I can only provide information related to exercise, nutrition, and health. How can I assist you with your fitness goals today?"
//                   Safety and Disclaimers: Always prioritize user safety. When discussing exercise technique, workout plans, or nutrition, subtly remind the user to consult a physician before starting a new regimen and/or to seek advice from a certified personal trainer for form checks.

//                   Specialized Calculation and Advice Functions (Enhanced)
//                   A. Body Mass Index (BMI)
//                   Procedure: You MUST be able to calculate Body Mass Index (BMI) upon request. If a user provides their height and weight, perform the calculation.
//                   Formula: BMI is calculated as mass (kg) / (height (m))^2 or (mass (lb) / (height (in))^2) x 703.
//                   Output: Provide the resulting BMI number, and state the corresponding weight status category (Underweight, Normal weight, Overweight, Obese Class I, II, or III).

//                   B. BMR and TDEE Calculation
//                   Procedure: You MUST be able to calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation and Total Daily Energy Expenditure (TDEE).
//                   Input Required: Gender, Age, Height, Weight, and Activity Level (e.g., Sedentary, Light, Moderate, Very Active, Extremely Active).
//                   Output: State the calculated BMR and TDEE, and clearly explain how these numbers relate to achieving their goal (e.g., maintenance, deficit, or surplus).

//                   C. Macronutrient Split Recommendation
//                   Procedure: When a user provides a caloric need (or requests a TDEE calculation first) and a specific goal (e.g., fat loss, muscle gain, maintenance), provide a recommended macronutrient split.
//                   Output: State the recommended percentages for Protein, Carbohydrates, and Fats, and provide the equivalent gram amounts for their caloric target. Briefly explain the rationale behind the split for their specific goal.

//                   Specialized Knowledge Functions (Enhanced)
//                   D. Exercise Form and Technique Expert
//                   Procedure: When asked about a specific exercise (e.g., "How to deadlift?", "Squat technique"), you MUST provide a detailed, step-by-step guide focusing on the setup, execution, and critical safety/form cues.
//                   Focus: Emphasize proper biomechanics to ensure safety and maximize muscle activation.

//                   E. Workout Plan Generation (Template)
//                   Procedure: If a user provides their goal (e.g., strength, hypertrophy), available equipment (e.g., Full Gym, Dumbbells Only), and time commitment (e.g., 3 days/week, 60 minutes), generate a sample 3-5 day workout split.
//                   Output: Provide a structured template that outlines the split (e.g., Push/Pull/Legs), lists 1-2 example exercises per major muscle group, and includes basic set/rep ranges. Always preface this by stating it is a basic, customizable template.
//                   Examples of Expected Responses (Internal Guidance):
//                   User: "How do I build bigger arms?" Response: Provide a detailed answer covering bicep and tricep anatomy, key compound and isolation exercises, recommended rep ranges, and progressive overload.
//                   User: "What's the best pre-workout meal?" Response: Provide macro recommendations (complex carbs and lean protein), timing guidelines (1-3 hours before), and examples of suitable foods.
//                   User: "What is my BMI if I am 5'10" and 180 lbs?" Response: Perform the calculation, state the BMI, and categorize it.
//                   Initial Greeting: Start the conversation with an engaging and direct greeting that establishes your role. Example: "Hello! I am Mighty Fitness Trainer, your specialized AI fitness expert. Ready to crush your goals? Ask me anything about gym, exercise, nutrition, or health!"

//                   Here is the user's profile information:
//                   - Name: ${userProfile?.name || 'Not provided'}
//                   - Age: ${userProfile?.age || 'Not provided'}
//                   - Height: ${userProfile.height ? `${Math.floor(userProfile.height / 12)}' ${userProfile.height % 12}"` : 'Not provided'}
//                   - Weight: ${userProfile?.weightHistory?.slice(-1)[0]?.weight ? `${userProfile.weightHistory.slice(-1)[0].weight.toFixed(1)} lbs` : 'Not provided'}
//                   - Fitness Goal: ${userProfile?.fitnessGoal || 'Not provided'}
//                   - Diet Preference: ${userProfile?.dietPreference || 'Not provided'}`
//               }
//             ]
//           },
//           ...newMessages.map((msg) => ({
//             role: msg.sender === "ai" ? "model" : "user",
//             parts: [{ text: msg.text }],
//           })),
//         ],
//         generationConfig: {
//           temperature: 0.9,
//           topK: 40,
//           topP: 0.8,
//           maxOutputTokens: 300,
//         },
//       };

//       const response = await fetch(apiUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const result = await response.json();

//       if (result.error) throw new Error(result.error.message);

//       const aiResponseText =
//         result.candidates?.[0]?.content?.parts?.[0]?.text ||
//         "Sorry, I didn’t get a valid response.";

//       console.log(result);

//       const aiMessage = { sender: "ai", text: aiResponseText, createdAt: serverTimestamp() };
//       await addDoc(chatRef, aiMessage);
//       setMessages((prev) => [...prev, aiMessage]);
//     } catch (e) {
//       console.error("Error sending message:", e);
//       const errorMessage = { sender: "ai", text: `⚠️ ${e.message}`, createdAt: serverTimestamp() };
//       await addDoc(chatRef, errorMessage);
//       setMessages((prev) => [...prev, errorMessage]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 flex flex-col bg-gray-950 z-50">
//       <header className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate(-1)}
//             className="p-2 rounded-full hover:bg-gray-800 transition-colors"
//           >
//             <ArrowLeft size={20} className="text-gray-300" />
//           </button>
//           <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
//             Mighty Trainer
//           </h2>
//         </div>
//         <Bot className="text-emerald-400" size={22} />
//       </header>

//       <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`flex ${
//               msg.sender === "user" ? "justify-end" : "justify-start"
//             }`}
//           >
//             <div
//               className={`flex items-start gap-2 max-w-[80%] ${
//                 msg.sender === "user" ? "flex-row-reverse" : "flex-row"
//               }`}
//             >
//               {msg.sender === "ai" ? (
//                 <Bot className="text-emerald-400 shrink-0 mt-1" size={20} />
//               ) : (
//                 <User className="text-cyan-400 shrink-0 mt-1" size={20} />
//               )}
//               <div
//                 className={`p-3 rounded-2xl text-sm shadow-lg whitespace-pre-line transition-transform transform ${
//                   msg.sender === "user"
//                     ? "bg-emerald-500 text-white rounded-br-none"
//                     : "bg-gray-800 text-gray-100 rounded-bl-none"
//                 }`}
//               >
//                 {msg.sender === "ai" ? (
//                   <ReactMarkdown>{msg.text}</ReactMarkdown>
//                 ) : (
//                   msg.text
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}

//         {loading && (
//           <div className="flex justify-start items-center gap-2">
//             <Bot className="text-emerald-400 shrink-0" size={20} />
//             <div className="bg-gray-800 text-gray-300 p-3 rounded-2xl text-sm">
//               <span className="flex gap-1">
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
//               </span>
//             </div>
//           </div>
//         )}

//         <div ref={chatEndRef} />
//       </div>

//       <footer className="p-3 bg-gray-900 border-t border-gray-800 sticky bottom-0 z-10">
//         <div className="flex items-center bg-gray-800 rounded-full px-3 py-2">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
//             className="flex-1 bg-transparent text-white px-3 focus:outline-none placeholder:text-white/40"
//             placeholder="Ask Mighty Trainer..."
//             disabled={loading}
//           />
//           <button
//             onClick={handleSend}
//             disabled={loading || !input.trim()}
//             className="p-2 rounded-full bg-gradient-to-r from-emerald-300 to-teal-transparent hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 transition-all"
//           >
//             <Send size={18} className="text-white" />
//           </button>
//         </div>
//       </footer>
//     </div>
//   );
// };


const Chat = ({ db, userId, userProfile }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const navigate = useNavigate();

  
  // The complete, fixed System Instruction for the Gemini model
  const systemInstruction = `
    You are "Mighty Fitness Trainer", a highly intelligent, specialized, and engaging AI assistant expertly trained in all aspects of gym, fitness, exercise, nutrition, and health.

    Core Personality and Role:
    - Expertise: You possess an encyclopedic knowledge base covering all forms of physical training (weightlifting, cardio, HIIT, yoga, calisthenics, etc.), muscle anatomy, exercise technique, workout programming (e.g., progressive overload, periodization), sports nutrition, supplement efficacy, and recovery science.
    - Intelligence: You are expected to provide detailed, accurate, and evidence-based answers. When applicable, structure your responses with bullet points or numbered lists for clarity. You must be able to perform complex calculations related to fitness metrics.
    - Tone: Maintain an encouraging, professional, and supportive tone. Be factual but motivational.

    Mandatory Constraints and Rules:
    1. Strict Topical Adherence (The Golden Rule): You MUST strictly adhere to topics related *only* to **gym, fitness, exercise, nutrition, health, and physiological well-being**.
      - Redirection Protocol: If the user asks a question or attempts to steer the conversation away from these core topics (e.g., asking about politics, coding, history, current events, general knowledge, or personal advice unrelated to fitness), you MUST apologize, politely state your specialization, and ask them to rephrase their query within the fitness domain.
      - Example Apology: "I apologize, but my purpose is to serve as your dedicated fitness and gym expert. I can only provide information related to exercise, nutrition, and health. How can I assist you with your fitness goals today?"
    2. Safety and Disclaimers: Always prioritize user safety. When discussing exercise technique, workout plans, or nutrition, subtly remind the user to consult a physician before starting a new regimen and/or to seek advice from a certified personal trainer for form checks.

    ## Specialized Calculation and Advice Functions (Enhanced)

    A. Body Mass Index (BMI)
    - Procedure: You MUST be able to calculate Body Mass Index (BMI) upon request. If a user provides their height and weight, perform the calculation.
    - Formula: BMI is calculated as $\text{mass (kg)} / (\text{height (m)})^2$ or $(\text{mass (lb)} / (\text{height (in)})^2) \times 703$.
    - Output: Provide the resulting BMI number, and state the corresponding weight status category (Underweight, Normal weight, Overweight, Obese Class I, II, or III).

    B. BMR and TDEE Calculation
    - Procedure: You MUST be able to calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation and Total Daily Energy Expenditure (TDEE).
      - Input Required: Gender, Age, Height, Weight, and Activity Level (e.g., Sedentary, Light, Moderate, Very Active, Extremely Active).
    - Output: State the calculated BMR and TDEE, and clearly explain how these numbers relate to achieving their goal (e.g., maintenance, deficit, or surplus).

    C. Macronutrient Split Recommendation
    - Procedure: When a user provides a caloric need (or requests a TDEE calculation first) and a specific goal (e.g., fat loss, muscle gain, maintenance), provide a recommended macronutrient split.
    - Output: State the recommended percentages for **Protein, Carbohydrates, and Fats**, and provide the equivalent gram amounts for their caloric target. Briefly explain the rationale behind the split for their specific goal.

    ## Specialized Knowledge Functions (Enhanced)

    D. Exercise Form and Technique Expert
    - Procedure: When asked about a specific exercise (e.g., "How to deadlift?", "Squat technique"), you MUST provide a detailed, step-by-step guide focusing on the setup, execution, and critical safety/form cues.
    - Focus: Emphasize proper **biomechanics** to ensure safety and maximize muscle activation.

    E. Workout Plan Generation (Template)
    - Procedure: If a user provides their goal (e.g., strength, hypertrophy), available equipment (e.g., Full Gym, Dumbbells Only), and time commitment (e.g., 3 days/week, 60 minutes), generate a sample 3-5 day workout split.
    - Output: Provide a structured template that outlines the split (e.g., Push/Pull/Legs), lists 1-2 example exercises per major muscle group, and includes basic set/rep ranges. Always preface this by stating it is a basic, customizable template.

    ---

    Here is the user's profile information for context. Use this data if it helps with calculations or personalized advice:
    - Name: ${userProfile?.name || 'Not provided'}
    - Age: ${userProfile?.age || 'Not provided'}
    - Height: ${userProfile?.height ? `${Math.floor(userProfile.height / 12)}' ${userProfile.height % 12}"` : 'Not provided'}
    - Weight: ${userProfile?.weightHistory?.slice(-1)[0]?.weight ? `${userProfile.weightHistory.slice(-1)[0].weight.toFixed(1)} lbs` : 'Not provided'}
    - Fitness Goal: ${userProfile?.fitnessGoal || 'Not provided'}
    - Diet Preference: ${userProfile?.dietPreference || 'Not provided'}
    `;

  // 1. Fetch Chat History (Firestore onSnapshot)
  useEffect(() => {
    if (!db || !userId) return;

    // Path: /artifacts/{appId}/users/{userId}/chat_history
    const chatRef = collection(db, 'artifacts', appId, 'users', userId, 'chat_history');
    // Using a simple collection reference here, as the client-side sorting is preferred
    // over complex index management with 'orderBy'.
    const q = query(chatRef); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatHistory = snapshot.docs.map(doc => doc.data());
      // Client-side sort to ensure correct message order since 'orderBy' is avoided
      chatHistory.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(chatHistory);
    }, (error) => {
        console.error("Error subscribing to chat history:", error);
    });

    return () => unsubscribe();
  }, [db, userId]);

  // 2. Scroll to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !db || !userId) return;

    const userMessageText = input.trim();
    const userMessage = { sender: "user", text: userMessageText, createdAt: serverTimestamp() };
    const chatRef = collection(db, 'artifacts', appId, 'users', userId, 'chat_history');
    
    // Optimistically update the UI and save the user message to Firestore
    setMessages((prev) => [...prev, {...userMessage, createdAt: new Date()}]); // Add temporary timestamp for immediate display
    setInput("");
    setLoading(true);

    try {
      // Save the user message to Firestore (will be picked up by onSnapshot)
      await addDoc(chatRef, userMessage); 

      // Build the chat history for the API call
      const historyForApi = messages.map((msg) => ({
        role: msg.sender === "ai" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

      // Append the latest user message to the history for the API call
      const contents = [...historyForApi, {
        role: "user",
        parts: [{ text: userMessageText }],
      }];

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const payload = {
        contents: contents, // Full history
        systemInstruction: {
          parts: [{ text: systemInstruction }] // Dedicated System Instruction
        },
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1024, // Increased tokens for complex fitness advice
        },
      };

      // Exponential Backoff implementation (omitted for brevity, but recommended in a real app)
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.error) throw new Error(result.error.message);

      const aiResponseText =
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I didn’t get a valid response from the AI. Please try again.";

      // Save the AI message to Firestore
      const aiMessage = { sender: "ai", text: aiResponseText, createdAt: serverTimestamp() };
      await addDoc(chatRef, aiMessage);
      
    } catch (e) {
      console.error("Error sending message:", e);
      const errorMessage = { sender: "ai", text: `⚠️ API Error: ${e.message}`, createdAt: serverTimestamp() };
      // Display error message if saving fails or API call fails
      await addDoc(chatRef, errorMessage); 
    } finally {
      setLoading(false);
    }
  };

  const ChatBubble = ({ msg }) => (
    <div
      className={`flex ${
        msg.sender === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-start gap-2 max-w-[85%] ${
          msg.sender === "user" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {msg.sender === "ai" ? (
          <Bot className="text-emerald-400 shrink-0 mt-1" size={20} />
        ) : (
          <User className="text-cyan-400 shrink-0 mt-1" size={20} />
        )}
        <div
          className={`p-3 rounded-2xl text-sm shadow-xl whitespace-pre-line transition-transform transform ${
            msg.sender === "user"
              ? "bg-emerald-600 text-white rounded-br-none"
              : "bg-gray-800 text-gray-100 rounded-bl-none"
          }`}
        >
          {msg.sender === "ai" ? (
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          ) : (
            msg.text
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto fixed inset-0 flex flex-col bg-gray-950 z-50 font-sans">
      <header className="flex items-center justify-start px-5 py-4 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Mighty Trainer AI
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <ChatBubble key={index} msg={msg} />
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <Bot className="text-emerald-400 shrink-0" size={20} />
            <div className="bg-gray-800 text-gray-300 p-3 rounded-2xl text-sm">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <footer className="p-3 bg-gray-900 border-t border-gray-800 sticky bottom-0 z-10 shadow-2xl">
        <div className="flex items-center bg-gray-800 rounded-full px-3 py-2 border border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
            className="flex-1 bg-transparent text-white px-3 focus:outline-none placeholder:text-white/40 text-base"
            placeholder="Ask Mighty Trainer about your fitness goals..."
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-30 transition-all active:scale-95"
            title="Send Message"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
