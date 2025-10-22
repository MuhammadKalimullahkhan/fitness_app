import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    apiKey,
    appId
} from "../EnvManager";


const Dashboard = ({ userProfile, userId, setCurrentPage, db, showCustomNotification }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [recommendation, setRecommendation] = useState('');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    if (!db || !userId) return;

    const q = query(collection(db, 'artifacts', appId, 'users', userId, 'workout_logs'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logs = [];
      querySnapshot.forEach((doc) => logs.push({ id: doc.id, ...doc.data() }));
      setWorkoutLogs(logs);
    });
    return () => unsubscribe();
  }, [db, userId]);

  const generateAIPost = async () => {
    setLoadingQuote(true);
    try {

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const systemPrompt = "Act as an AI assistant for a fitness app. Provide a short, motivational quote to encourage a user to work out today. Do not include any intros or outros, just the quote.";
      const userQuery = "Generate a motivational fitness quote.";

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        showCustomNotification("Daily motivation: " + text);
      } else {
        showCustomNotification("Could not generate a quote. Please try again later.");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      showCustomNotification("Error generating quote.");
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    const fetchRecommendation = async () => {
      setLoadingRecommendation(true);
      setRecommendation('');
      try {

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const systemPrompt = "You are a personalized fitness advisor. Generate a short, actionable recommendation based on the user's profile and progress. Focus on either diet or exercise, and be encouraging.";
        const userQuery = "User's fitness goal: ${userProfile?.fitnessGoal}. User's diet preference: ${userProfile?.dietPreference}. Give a recommendation.";

        const payload = {
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        setRecommendation(text);
      } catch (e) {
        console.error("Error fetching recommendation:", e);
        setRecommendation("Failed to load recommendation. Please try again.");
      } finally {
        setLoadingRecommendation(false);
      }
    };
    if (userProfile?.fitnessGoal && userProfile?.dietPreference) {
      fetchRecommendation();
    }
  }, [userProfile]);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
          Welcome, {userProfile?.name || 'User'}!
        </h2>
        <p className="text-center text-xs mb-4 text-gray-400 break-all">
          User ID: {userId}
        </p>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-700 p-4 rounded-2xl shadow-inner border border-gray-600">
            <h3 className="text-lg font-semibold mb-1 text-cyan-400">Your Goal</h3>
            <p className="text-base text-white capitalize">{userProfile?.fitnessGoal || 'Not Set'}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-2xl shadow-inner border border-gray-600">
            <h3 className="text-lg font-semibold mb-1 text-cyan-400">Diet Plan</h3>
            <p className="text-base text-white capitalize">{userProfile?.dietPreference || 'Not Set'}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentPage('workouts')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all text-white font-semibold py-3 px-2 rounded-xl shadow-lg text-sm"
          >
            View Workouts
          </button>
          <button
            onClick={() => setCurrentPage('diet')}
            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 transition-all text-white font-semibold py-3 px-2 rounded-xl shadow-lg text-sm"
          >
            View Diet Plan
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Progress Summary</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600">
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Workout Progress</h4>
            <p className="text-gray-300 text-sm">You have completed {workoutLogs.length} workouts.</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600">
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Weight History</h4>
            {userProfile?.weightHistory?.length > 0 ? (
              <p className="text-gray-300 text-sm">Last logged weight: {userProfile.weightHistory.slice(-1)[0]?.weight} lbs.</p>
            ) : (
              <p className="text-gray-400 text-sm">No weight data logged yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Personalized Recommendation</h3>
        <div className="bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600">
          {loadingRecommendation ? (
            <p className="text-gray-400 animate-pulse">Generating...</p>
          ) : (
            <p className="text-gray-300 text-sm">{recommendation || "Set up your profile to get a personalized tip!"}</p>
          )}
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700 text-center">
        <button
          onClick={generateAIPost}
          disabled={loadingQuote}
          className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 transition-all text-white font-bold py-3 rounded-full shadow-lg disabled:opacity-50"
        >
          {loadingQuote ? 'Generating...' : '✨ Get Daily Motivation ✨'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard