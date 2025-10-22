import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { appId, apiKey } from '../EnvManager';

const Dashboard = ({ userProfile, setCurrentPage, showCustomNotification, db, userId }) => {
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState('');
  const [workoutProgress, setWorkoutProgress] = useState(0);
  const [dietProgress, setDietProgress] = useState(0);

  // Fetch Workout Progress
  useEffect(() => {
    if (!db || !userId) return;
    const workoutLogsRef = collection(db, 'artifacts', appId, 'users', userId, 'workout_logs');
    const q = query(workoutLogsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalProgress = 0;
      let logCount = 0;
      snapshot.forEach(doc => {
        const log = doc.data();
        if (log.plan && log.plan.length > 0) {
          const completedCount = log.plan.filter(e => e.completed).length;
          totalProgress += (completedCount / log.plan.length);
          logCount++;
        }
      });
      setWorkoutProgress(logCount > 0 ? (totalProgress / logCount) * 100 : 0);
    });
    return () => unsubscribe();
  }, [db, userId]);

  // Fetch Diet Progress
  useEffect(() => {
    if (!db || !userId) return;
    const dietLogsRef = collection(db, 'artifacts', appId, 'users', userId, 'diet_logs');
    const q = query(dietLogsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalAdherence = 0;
      let logCount = 0;
      snapshot.forEach(doc => {
        const log = doc.data();
        if (log.summary && log.summary.targetCalories > 0) {
          const adherence = (log.summary.totalCalories / log.summary.targetCalories);
          totalAdherence += Math.min(1, adherence);
          logCount++;
        }
      });
      setDietProgress(logCount > 0 ? (totalAdherence / logCount) * 100 : 0);
    });
    return () => unsubscribe();
  }, [db, userId]);

  // Generate a recommendation when the user profile is loaded
  const generateRecommendation = async () => {
    if (!userProfile) return;
    setLoadingRecommendation(true);
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const systemPrompt = `You are a holistic wellness coach. Based on the user's profile, provide a short, actionable recommendation (2-3 sentences) to help them with their fitness and diet goals. Focus on encouragement and practical advice. Address the user directly.`;
      const userQuery = `My current fitness goal is ${userProfile?.fitnessGoal || 'not set yet'}. My last logged weight is ${userProfile?.weightHistory?.slice(-1)[0]?.weight || 'not specified'} lbs. Based on this, give me a recommendation.`;

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      const recommendationText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!recommendationText) throw new Error("Could not generate a recommendation.");
      setRecommendation(recommendationText);
    } catch (e) {
      setRecommendation("Sorry, I couldn't generate a recommendation at this time.");
    } finally {
      setLoadingRecommendation(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      generateRecommendation();
    }
  }, [userProfile]);

  const progressCircle = (progress, title) => (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
          <path className="text-emerald-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold text-white">{`${Math.round(progress)}%`}</span></div>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-300">{title}</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Welcome, {userProfile?.name || 'User'}!</h2>
          <p className="text-gray-400">Here's a snapshot of your journey.</p>
        </header>

        <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700 mb-8">
          <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Overall Progress</h3>
          <div className="flex justify-around items-center">{progressCircle(workoutProgress, userProfile?.fitnessGoal || "Workout Goal")}{progressCircle(dietProgress, userProfile?.dietPreference || "Diet Goal")}</div>
        </div>

        {/* Refactored Layout for Stats, Recommendation, and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className='border border-slate-700 rounded-lg p-2 px-4'>
                <h4 className="text-lg font-semibold mb-2 text-emerald-300">Fitness Goal</h4>
                <p className="text-gray-300 text-sm">{userProfile?.fitnessGoal || 'Not set'}</p>
              </div>
              <div className='border border-slate-700 rounded-lg p-2 px-4'>
                <h4 className="text-lg font-semibold mb-2 text-emerald-300">Diet Goal</h4>
                <p className="text-gray-300 text-sm">{userProfile?.dietPreference || 'Not set'}</p>
              </div>
              <div className='col-span-2 border border-slate-700 rounded-lg p-2 px-4'>
                <h4 className="text-lg font-semibold mb-2 text-emerald-300">Weight History</h4>
                {userProfile?.weightHistory?.length > 0 ? (<p className="text-gray-300 text-sm">Current Weight: <span className='px-2 p-1 bg-green-900/50 text-white rounded-full'>{userProfile.weightHistory.slice(-1)[0]?.weight} lbs.</span></p>) : (<p className="text-gray-400 text-sm">No weight data logged yet.</p>)}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Personalized Recommendation</h3>
            <div className="bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600 flex items-center justify-center">
              {loadingRecommendation ? (<p className="text-gray-400 animate-pulse">Generating...</p>) : (<p className="text-gray-300 text-sm italic">{recommendation}</p>)}
            </div>
          </div>

          {/* <div className="md:col-span-2 bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700 mt-8">
            <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <button onClick={() => setCurrentPage('WorkoutManagement')} className="bg-gray-700 hover:bg-emerald-500 transition-colors p-4 rounded-2xl shadow-md">Workout</button>
              <button onClick={() => setCurrentPage('DietManagement')} className="bg-gray-700 hover:bg-emerald-500 transition-colors p-4 rounded-2xl shadow-md">Diet</button>
              <button onClick={() => setCurrentPage('WorkoutLogs')} className="bg-gray-700 hover:bg-emerald-500 transition-colors p-4 rounded-2xl shadow-md">Logs</button>
              <button onClick={() => setCurrentPage('Profile')} className="bg-gray-700 hover:bg-emerald-500 transition-colors p-4 rounded-2xl shadow-md">Profile</button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
