import { useState } from 'react';

const Profile = ({ userProfile, setUserProfile, onSaveProfile, setCurrentPage, showCustomNotification }) => {
  const [age, setAge] = useState(userProfile?.age || '');
  const [height, setHeight] = useState(userProfile?.height || '');
  const [weight, setWeight] = useState(userProfile?.weight || '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile({ ...userProfile, [name]: value });
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Validation
    if (age <= 0 || age >= 150) {
      showCustomNotification("Please enter a valid age (1-149).");
      return;
    }
    if (height <= 4 || height >= 15) {
      showCustomNotification("Please enter a valid height (4-15 feet).");
      return;
    }
    if (weight <= 25) {
      showCustomNotification("Please enter a valid weight (>25 kg).");
      return;
    }

    // Unit Conversion and Saving
    const heightInInches = height * 12;
    const weightInLbs = weight * 2.20462;

    const updatedProfile = {
      ...userProfile,
      age: parseInt(age),
      height: heightInInches,
      weight: weightInLbs,
    };

    onSaveProfile(updatedProfile);
  };

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
              value={userProfile?.name || ''}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="fitnessGoal" className="block text-gray-400 font-semibold mb-2">Fitness Goal</label>
            <select
              id="fitnessGoal"
              name="fitnessGoal"
              value={userProfile?.fitnessGoal || 'Beginner'}
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
              value={userProfile?.dietPreference || 'Weight Loss'}
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
              value={userProfile?.role || 'user'}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              <option value="user">User</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* New Personal Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="age" className="block text-gray-400 font-semibold mb-2">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-gray-400 font-semibold mb-2">Height (feet)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-gray-400 font-semibold mb-2">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
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
              onClick={() => setCurrentPage('home')}
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
