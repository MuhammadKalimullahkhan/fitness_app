import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { appId } from "../EnvManager";

const WorkoutLogs = ({ userId, db, showCustomNotification }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !userId) return;

    setIsLoading(true);
    setError(null);

    const workoutLogsRef = collection(db, 'artifacts', appId, 'users', userId, 'workout_logs');
    const q = query(workoutLogsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkoutLogs(logs);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching workout logs: ", err);
      setError("Failed to load workout logs.");
      showCustomNotification("Error loading workout logs.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, db, showCustomNotification]);

  const handleToggleComplete = async (logId, exerciseIndex) => {
    const logRef = doc(db, 'artifacts', appId, 'users', userId, 'workout_logs', logId);
    const logToUpdate = workoutLogs.find(log => log.id === logId);

    if (logToUpdate) {
      const updatedPlan = [...logToUpdate.plan];
      updatedPlan[exerciseIndex].completed = !updatedPlan[exerciseIndex].completed;

      try {
        await updateDoc(logRef, { plan: updatedPlan });
      } catch (e) {
        console.error("Error updating workout status:", e);
        showCustomNotification("Failed to update workout status.");
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 animate-pulse">Loading workout logs...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  if (workoutLogs.length === 0) {
    return <div className="text-center py-8 text-gray-400">No workout logs found. Go generate and save a new workout!</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-6 text-center">Your Workout Logs</h2>
      <div className="space-y-6">
        {workoutLogs.map((log) => {
          const completedCount = log.plan?.filter(e => e.completed).length || 0;
          const progressPercentage = log.plan?.length > 0 ? (completedCount / log.plan.length) * 100 : 0;

          return (
            <div key={log.id} className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-emerald-400">{log.fitnessGoal} Workout</h3>
                <p className="text-gray-400 text-sm font-medium">{new Date(log.createdAt?.toDate()).toLocaleDateString()}</p>
              </div>

              <div className="mt-4 mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-base font-medium text-cyan-400">Workout Progress</span>
                  <span className="text-sm font-medium text-cyan-400">{completedCount} / {log.plan?.length || 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-emerald-400 to-cyan-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                {log.plan && Array.isArray(log.plan) ? (
                  log.plan.map((exercise, index) => (
                    <div key={index} className={`p-3 rounded-lg border transition-all ${exercise.completed ? 'bg-emerald-900 border-emerald-700' : 'bg-gray-700 border-gray-600'}`}>
                      <h4 className={`font-semibold ${exercise.completed ? 'text-gray-400 line-through' : 'text-cyan-400'}`}>{exercise.name}</h4>
                      <p className={`text-sm mt-1 ${exercise.completed ? 'text-gray-500' : 'text-gray-300'}`}>{exercise.description}</p>
                      <p className={`text-xs mt-2 font-mono ${exercise.completed ? 'text-gray-500' : 'text-gray-400'}`}>
                        {exercise.reps && `Reps: ${exercise.reps}`}
                        {exercise.time && `Time: ${exercise.time}s`}
                      </p>
                      <button onClick={() => handleToggleComplete(log.id, index)} className={`mt-3 w-full text-white font-bold py-2 rounded-full shadow-lg transition-all ${exercise.completed ? 'bg-gray-600 hover:bg-gray-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                        {exercise.completed ? 'Undo' : 'Complete'}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No workout details available.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutLogs;
