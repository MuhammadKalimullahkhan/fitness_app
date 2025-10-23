import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = ({ userProfile, onSaveProfile, showCustomNotification }) => {
  const [formData, setFormData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        fitnessGoal: userProfile.fitnessGoal || 'Beginner',
        dietPreference: userProfile.dietPreference || 'Weight Loss',
        role: userProfile.role || 'user',
        age: userProfile.age || '',
        height: userProfile.height ? (userProfile.height / 12).toFixed(1) : '',
        weight: userProfile.weight ? (userProfile.weight / 2.20462).toFixed(1) : '',
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData) return;

    const age = parseInt(formData.age);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);

    if (!age || age <= 0 || age >= 150) {
      showCustomNotification("Please enter a valid age (1-149).");
      return;
    }
    if (!height || height <= 4 || height >= 10) {
      showCustomNotification("Please enter a valid height (4-10 feet).");
      return;
    }
    if (!weight || weight <= 25 || weight >= 1000) {
      showCustomNotification("Please enter a valid weight (25-1000 kg).");
      return;
    }

    const updatedProfile = {
      ...userProfile,
      ...formData,
      age: age,
      height: height * 12,
      weight: weight * 2.20462,
    };
    
    const lastWeightEntry = userProfile.weightHistory?.[userProfile.weightHistory.length - 1];
    const newWeightLbs = updatedProfile.weight;

    if (!lastWeightEntry || Math.abs(lastWeightEntry.weight - newWeightLbs) > 0.1) {
        updatedProfile.weightHistory = [
            ...(userProfile.weightHistory || []),
            { date: new Date().toISOString(), weight: newWeightLbs }
        ];
    }

    await onSaveProfile(updatedProfile);
    navigate('/');
  };

  if (!formData) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Edit Your Profile</h2>
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-400 font-semibold mb-2">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="fitnessGoal" className="block text-gray-400 font-semibold mb-2">Fitness Goal</label>
            <select
              id="fitnessGoal"
              name="fitnessGoal"
              value={formData.fitnessGoal}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="dietPreference" className="block text-gray-400 font-semibold mb-2">Diet Preference</label>
            <select
              id="dietPreference"
              name="dietPreference"
              value={formData.dietPreference}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-gray-400 font-semibold mb-2">Your Role (For Demo)</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              <option value="user">User</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="age" className="block text-gray-400 font-semibold mb-2">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-gray-400 font-semibold mb-2">Height (feet)</label>
              <input
                type="number"
                step="0.1"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-gray-400 font-semibold mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all text-white font-bold py-3 rounded-full shadow-lg"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-1/2 bg-gray-700 hover:bg-gray-600 transition-colors text-white font-bold py-3 rounded-full shadow-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
