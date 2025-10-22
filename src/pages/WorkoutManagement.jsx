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



const WorkoutManagement = ({ userProfile, setCurrentPage, showCustomNotification, db, userId }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // New state for personal metrics
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Beginner'); // Default to Beginner

  const generateWorkout = async () => {
    setLoading(true);
    setError(null);
    try {

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const systemPrompt = `You are an expert fitness trainer. Generate a full workout plan in JSON format for a user based on their personal data and fitness goal. 
      The JSON should be an array of objects. Each object should have 'name' (string), 'reps' (number), 'time' (number, optional) and 'description' (string) properties. 
      The 'reps' should be for strength exercises and 'time' for cardio/plank exercises.
      Use simple exercises like pushups, squats, planks, situps, lunges.
      For each exercise, provide a short, clear description. Do not include any intros or outros, just the JSON.`;

      // Updated user query to include new fields
      const userQuery = `Generate a workout plan for someone with a "${goal}" goal. User details: Age: ${age}, Height: ${height} inches, Weight: ${weight} lbs.`;

      const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                "name": { "type": "STRING" },
                "reps": { "type": "NUMBER"},
                "time": { "type": "NUMBER"},
                "description": { "type": "STRING" }
              }
            }
          }
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error("Invalid or empty AI response.");
      }

      const data = JSON.parse(responseText);
      const workoutsWithPlaceholders = data.map(w => ({
        ...w,
        count: 0,
      }));
      setWorkouts(workoutsWithPlaceholders);
    } catch (e) {
      console.error("Error generating workout:", e);
      setError("Failed to generate workout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = (index, delta) => {
    setWorkouts(currentWorkouts => {
      const newWorkouts = [...currentWorkouts];
      newWorkouts[index].count = Math.max(0, newWorkouts[index].count + delta);
      return newWorkouts;
    });
  };

  const saveWorkoutToDb = async () => {
    if (workouts.length === 0 || !db || !userId) {
      showCustomNotification("Please generate a workout first!");
      return;
    }
    setSaving(true);
    try {
      const workoutsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'workout_logs');
      await addDoc(workoutsCollectionRef, {
        plan: workouts.map(({ count, ...rest }) => rest), // Save only the plan, not the temporary count
        createdAt: serverTimestamp(),
        fitnessGoal: goal, // Save the goal selected on this page
      });
      showCustomNotification("Workout saved successfully!");
    } catch (e) {
      console.error("Error saving workout:", e);
      showCustomNotification("Failed to save workout. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Your Workout Plan</h2>
        <p className="text-gray-300 mb-4 text-center">
          Enter your details below to get an AI-generated workout routine.
        </p>

        {/* Personal Details Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col">
            <label htmlFor="goal" className="block text-gray-400 font-semibold mb-2">Fitness Goal</label>
            <select
              id="goal"
              name="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="age" className="block text-gray-400 font-semibold mb-2">Age</label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              placeholder="e.g., 30"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="height" className="block text-gray-400 font-semibold mb-2">Height (inches)</label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              placeholder="e.g., 68"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="weight" className="block text-gray-400 font-semibold mb-2">Weight (lbs)</label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              placeholder="e.g., 150"
            />
          </div>
        </div>

        <button
          onClick={generateWorkout}
          disabled={loading || !age || !height || !weight}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all text-white font-bold py-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : '✨ Generate Workout ✨'}
        </button>

        {loading && <div className="text-center mt-6 text-cyan-400">Loading workout...</div>}
        {error && <div className="text-center mt-6 text-red-400">{error}</div>}

        {!loading && workouts.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4">
              {workouts.map((exercise, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600 flex flex-col items-start">
                  <h3 className="text-lg font-semibold mb-1 text-cyan-400">{exercise.name}</h3>
                  <p className="text-gray-300 text-sm">{exercise.description}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {exercise.reps ? `Reps: ${exercise.reps} : exercise.time ? Time: ${exercise.time}s` : 'N/A'}
                  </p>
                  <div className="flex items-center justify-between w-full mt-3">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleCounter(index, -1)} className="bg-red-500 hover:bg-red-600 transition-colors text-white py-1 px-3 rounded-full shadow-md text-sm">-</button>
                      <span className="text-lg font-bold">{exercise.count}</span>
                      <button onClick={() => handleCounter(index, 1)} className="bg-green-500 hover:bg-green-600 transition-colors text-white py-1 px-3 rounded-full shadow-md text-sm">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={saveWorkoutToDb}
              disabled={saving}
              className="mt-6 w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all text-white font-bold py-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Workout'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkoutManagement;