import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import {
  apiKey,
  firebaseConfig,
  appId,
  initialAuthToken
} from "./EnvManager";

// Pages
import { Dashboard, DietManagement, Profile } from './pages/index';

// API -> APPLICATION PROGRAMING INTERFACE
// Main App Component
export default function App() {
  // use -> Hook
  // State for Firebase services and user data
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [forumPosts, setForumPosts] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Firebase initialization and authentication
  useEffect(() => {
    try {

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);

      setFirebaseApp(app);
      setAuth(auth);
      setDb(db);

      onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
          } catch (error) {
            console.error("Authentication failed:", error);
          }
        }
        setIsAuthReady(true);
      });
    } catch (e) {
      console.error("Firebase initialization failed:", e);
    }
  }, []);

  // Real-time user profile data listener
  useEffect(() => {
    if (!isAuthReady || !db || !userId) return;

    const profileDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile({
          name: '',
          fitnessGoal: 'Beginner',
          dietPreference: 'Weight Loss',
          role: 'user',
          weightHistory: [],
        });
      }
    }, (error) => {
      console.error("Error fetching profile:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady, db, userId]);

  // Real-time forum posts listener
  useEffect(() => {
    if (!isAuthReady || !db) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setForumPosts(posts.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)));
    }, (error) => {
      console.error("Error fetching forum posts:", error);
    });
    return () => unsubscribe();
  }, [isAuthReady, db]);

  const showCustomNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      setNotificationMessage('');
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserId(null);
      setUserProfile(null);
      setCurrentPage('home');
      showCustomNotification("You have been signed out.");
    } catch (e) {
      console.error("Logout failed:", e);
      showCustomNotification("Logout failed. Please try again.");
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!db || !userId) return;
    try {

      const profileDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
      await setDoc(profileDocRef, userProfile, { merge: true });
      showCustomNotification("Profile saved successfully!");
    } catch (e) {
      console.error("Error saving profile:", e);
      showCustomNotification("Error saving profile.");
    }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-white text-xl animate-pulse">Loading...</div>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <Dashboard
            userProfile={userProfile}
            userId={userId}
            setCurrentPage={setCurrentPage}
            db={db}
            showCustomNotification={showCustomNotification}
            handleLogout={handleLogout}
          />
        );
      case 'profile':
        return (
          <Profile
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onSaveProfile={handleSaveProfile}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'workouts':
        return (
          <WorkoutManagement userProfile={userProfile}
            setCurrentPage={setCurrentPage}
            showCustomNotification={showCustomNotification}
            db={db}
            userId={userId}
          />
        );
      case 'diet':
        return (
          <DietManagement
            userProfile={userProfile}
            setCurrentPage={setCurrentPage}
            showCustomNotification={showCustomNotification}
          />
        );
      case 'forum':
        return (
          <Forum
            db={db}
            userId={userId}
            userProfile={userProfile}
            forumPosts={forumPosts}
            setCurrentPage={setCurrentPage}
            showCustomNotification={showCustomNotification}
          />
        );
      default:
        return null;
    }
  };

  const navItems = [
    {
      name: 'Home', page: 'home', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Workouts', page: 'workouts', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Diet', page: 'diet', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1V10z" />
        </svg>
      )
    },
    {
      name: 'Forum', page: 'forum', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V8a2 2 0 012-2h6a2 2 0 012 2z" />
        </svg>
      )
    },
    {
      name: 'Profile', page: 'profile', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans antialiased flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen relative flex flex-col bg-gray-900 shadow-2xl rounded-3xl overflow-hidden">
        {/* Top Header */}
        <header className="bg-gray-900 p-4 shadow-lg flex items-center justify-between z-10">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Mighty Fitness
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-20">
          {renderContent()}
        </main>

        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-800 border-t-2 border-gray-700 rounded-t-3xl shadow-xl z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <button
                key={item.page}
                className={`flex flex-col items-center justify-center transition-colors duration-200 ease-in-out p-2
                            ${currentPage === item.page ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'}`}
                onClick={() => setCurrentPage(item.page)}
              >
                {item.icon}
                <span className="text-xs mt-1 font-semibold">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {showNotification && (
          <div className="fixed bottom-20 left-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg border border-gray-700 text-center transition-all duration-500 ease-in-out">
            {notificationMessage}
          </div>
        )}
      </div>
    </div>
  );
}