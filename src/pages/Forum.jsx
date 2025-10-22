import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import {
  apiKey,
  firebaseConfig,
  appId,
  initialAuthToken
} from "../EnvManager";



const Forum = ({ db, userId, userProfile, forumPosts, setCurrentPage, showCustomNotification }) => {
  const [newPost, setNewPost] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAIError] = useState(null);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !db) return;
    try {

      const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts');
      await addDoc(postsRef, {
        authorId: userId,
        authorName: userProfile?.name || `User (${userId.substring(0, 5)})`,
        content: newPost,
        isAIResponse: false,
        createdAt: serverTimestamp()
      });
      setNewPost('');
      showCustomNotification("Post submitted successfully!");
    } catch (e) {
      console.error("Error adding document: ", e);
      showCustomNotification("Error submitting post.");
    }
  };

  const askAITrainer = async () => {
    if (!newPost.trim()) return;
    setLoadingAI(true);
    setAIError(null);
    try {
      await handlePostSubmit({ preventDefault: () => { } });


      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const systemPrompt = "You are an AI-powered fitness trainer named 'Mighty Trainer'. Provide a helpful and encouraging response to the user's question. Keep the response concise and friendly. Your goal is to give a good starting point for advice. Do not mention that you are an AI or bot.";
      const userQuery = newPost;

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ "google_search": {} }],
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const aiResponseText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponseText) {

        const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts');
        await addDoc(postsRef, {
          authorId: "AI",
          authorName: "Mighty Trainer",
          content: aiResponseText,
          isAIResponse: true,
          createdAt: serverTimestamp()
        });
      } else {
        setAIError("The AI trainer could not generate a response. Please try again.");
      }
    } catch (e) {
      console.error("Error calling AI trainer:", e);
      setAIError("Failed to get a response from the AI trainer.");
    } finally {
      setLoadingAI(false);
      setNewPost('');
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Community Forum</h2>
        <div className="bg-gray-700 p-4 rounded-2xl shadow-inner border border-gray-600 mb-6 max-h-96 overflow-y-auto">
          {forumPosts.length === 0 ? (
            <p className="text-center text-gray-400">No posts yet. Be the first to start a conversation!</p>
          ) : (
            forumPosts.map((post) => (
              <div
                key={post.id}
                className={`p-4 rounded-xl mb-4 ${post.isAIResponse
                    ? 'bg-purple-800 border-2 border-purple-600'
                    : 'bg-gray-600 border border-gray-500'
                  }`}
              >
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-semibold text-cyan-300">
                    {post.authorName}
                  </span>
                  {post.isAIResponse && (
                    <span className="text-xs text-purple-200 bg-purple-500 rounded-full px-2 py-0.5 mt-1">
                      AI Trainer
                    </span>
                  )}
                  <span className="text-xs text-gray-400 mt-1">
                    {post.createdAt?.toDate().toLocaleString() || '...'}
                  </span>
                </div>
                <p className="mt-2 text-gray-200">{post.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handlePostSubmit} className="flex flex-col space-y-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Type your question or post here..."
            rows="3"
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          ></textarea>
          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={!newPost.trim() || loadingAI}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all text-white font-bold py-3 px-6 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post to Forum
            </button>
            <button
              type="button"
              onClick={askAITrainer}
              disabled={!newPost.trim() || loadingAI}
              className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 transition-all text-white font-bold py-3 px-6 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAI ? 'Asking AI...' : '✨ Ask AI Trainer ✨'}
            </button>
          </div>
          {aiError && <div className="text-red-400 mt-2 text-center">{aiError}</div>}
        </form>
      </div>
    </div>
  );
};

export default Forum;