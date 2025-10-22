import { useState } from 'react';
import {
  apiKey
} from "../EnvManager";


const DietManagement = ({ userProfile, setCurrentPage, showCustomNotification }) => {
  const [mealPlan, setMealPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateMealPlan = async () => {
    setLoading(true);
    setError(null);
    try {

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const systemPrompt = `You are a certified nutritionist. Generate a one-day meal plan in JSON format. 
      The JSON should be an array of objects. Each object must have a 'meal' (string, e.g., 'Breakfast', 'Lunch', 'Dinner'), 'food' (string), 'calories' (number), 'protein' (number), 'carbs' (number), and 'fats' (number) properties.
      Do not include any intros or outros, just the JSON.`;
      const userQuery = `Generate a one-day meal plan for someone with a "${userProfile?.dietPreference || 'Weight Loss'}" diet preference.`;

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
                "meal": { "type": "STRING" },
                "food": { "type": "STRING" },
                "calories": { "type": "NUMBER" },
                "protein": { "type": "NUMBER" },
                "carbs": { "type": "NUMBER" },
                "fats": { "type": "NUMBER" }
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
      const data = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
      setMealPlan(data);
    } catch (e) {
      console.error("Error generating meal plan:", e);
      setError("Failed to generate meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Your Diet Plan</h2>
        <p className="text-gray-300 mb-4 text-center">
          Tap below to get an AI-driven meal plan based on your "{userProfile?.dietPreference || 'Weight Loss'}" preference.
        </p>
        <button
          onClick={generateMealPlan}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 transition-all text-white font-bold py-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : '✨ Generate Meal Plan ✨'}
        </button>

        {loading && <div className="text-center mt-6 text-cyan-400">Loading meal plan...</div>}
        {error && <div className="text-center mt-6 text-red-400">{error}</div>}

        {!loading && mealPlan.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4">
            {mealPlan.map((meal, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-xl shadow-inner border border-gray-600">
                <h3 className="text-lg font-semibold mb-1 text-cyan-400">{meal.meal}</h3>
                <p className="text-gray-300 text-sm">{meal.food}</p>
                <div className="text-xs text-gray-400 mt-2">
                  <p>Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fats: {meal.fats}g</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DietManagement