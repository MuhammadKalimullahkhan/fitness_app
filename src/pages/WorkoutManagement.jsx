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

  // Personal metrics state
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Beginner');

  useEffect(() => {
    if (userProfile) {
      setAge(userProfile.age || '');
      // Convert height from inches (DB) to feet for display
      setHeight(userProfile.height ? (userProfile.height / 12).toFixed(2) : ''); 
      // Convert weight from lbs (DB) to kg for display
      setWeight(userProfile.weight ? (userProfile.weight / 2.20462).toFixed(2) : '');
      setGoal(userProfile.fitnessGoal || 'Beginner');
    }
  }, [userProfile]);

  const generateWorkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const systemPrompt = `You are an expert fitness trainer. Generate a workout plan in JSON format.

Each exercise object must have:
- 'name': (string) The name of the exercise.
- 'description': (string) A short, clear description.
- 'reps': (number or null) Repetitions for strength exercises. Must be null if time-based.
- 'time': (number or null) Duration in seconds for time-based exercises. Must be null if rep-based.

Only return the raw JSON array.`;

      const userQuery = `Generate a workout plan for a "${goal}" goal. User: Age ${age}, Height ${userProfile.height}in, Weight ${userProfile.weight}lbs.`;

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
                "reps": { "type": "NUMBER", "nullable": true },
                "time": { "type": "NUMBER", "nullable": true },
                "description": { "type": "STRING" }
              },
              required: ["name", "description", "reps", "time"]
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

      if (result.error) {
        throw new Error(`AI API Error: ${result.error.message}`);
      }

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) throw new Error("Invalid AI response (No content received).");

      const data = JSON.parse(responseText);
      // Set workouts directly, without adding a 'completed' field
      setWorkouts(data);
    } catch (e) {
      console.error("Error generating workout:", e);
      setError(`Failed to generate workout: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkoutToDb = async () => {
    if (workouts.length === 0 || !db || !userId) {
      showCustomNotification("Please generate a workout first!");
      return;
    }
    setSaving(true);
    try {
      const workoutsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'workout_logs');
      
      // Add the plan with an initial 'completed' status for each exercise
      const planWithCompletion = workouts.map(exercise => ({ ...exercise, completed: false }));

      await addDoc(workoutsCollectionRef, {
        plan: planWithCompletion, 
        createdAt: serverTimestamp(),
        fitnessGoal: goal,
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
        <p className="text-gray-300 mb-4 text-center">Your details are pre-filled. Generate an AI workout or adjust your goal.</p>

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
              readOnly
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="height" className="block text-gray-400 font-semibold mb-2">Height (feet)</label>
            <input
              type="number"
              id="height"
              value={height}
              readOnly
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="weight" className="block text-gray-400 font-semibold mb-2">Weight (kg)</label>
            <input
              type="number"
              id="weight"
              value={weight}
              readOnly
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            />
          </div>
        </div>

        <button onClick={generateWorkout} disabled={loading || !age || !height || !weight} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all text-white font-bold py-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
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
                  <p className="text-gray-400 text-xs mt-2 font-mono">
                    {exercise.reps && `Reps: ${exercise.reps}`}
                    {exercise.time && `Time: ${exercise.time}s`}
                    {!exercise.reps && !exercise.time && 'N/A'}
                  </p>
                </div>
              ))}
            </div>
            <button onClick={saveWorkoutToDb} disabled={saving} className="mt-6 w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 transition-all text-white font-bold py-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save Workout Log'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkoutManagement;
