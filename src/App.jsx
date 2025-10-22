import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query } from 'firebase/firestore';
import {
  firebaseConfig,
  appId
} from "./EnvManager";

// Pages
import { Dashboard, DietManagement, Profile, WorkoutManagement, Forum, WorkoutLogs, Chat } from './pages/index';
import LoginPage from './pages/LoginPage';

// Main App Component
export default function App() {
  // State for Firebase services and user data
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [forumPosts, setForumPosts] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase initialization and authentication
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);

      setFirebaseApp(app);
      setAuth(auth);
      setDb(db);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsLoading(true);
        if (user) {
          setUserId(user.uid);
          const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
          const docSnap = await getDoc(profileDocRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            // Create a default profile for new users
            const defaultProfile = {
              name: user.displayName || 'Unkown',
              email: user.email || '',
              fitnessGoal: 'Beginner',
              dietPreference: 'Weight Loss',
              role: 'user',
              weightHistory: [],
            };
            await setDoc(profileDocRef, defaultProfile, { merge: true });
            setUserProfile(defaultProfile);
          }
          setCurrentPage('home');
        } else {
          setUserId(null);
          setUserProfile(null);
          setCurrentPage('login');
        }
        setIsAuthReady(true);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setError("Firebase initialization failed.");
      setIsLoading(false);
    }
  }, []);

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
  
  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showCustomNotification("Logged in successfully!");
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.message);
      showCustomNotification("Login failed. Please check your credentials.");
    }
    setIsLoading(false);
  };

  const handleSignUp = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showCustomNotification("Signed up successfully! Welcome!");
    } catch (error) {
      console.error("Sign up failed:", error);
      setError(error.message);
      showCustomNotification("Sign up failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showCustomNotification("Signed in with Google successfully!");
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      setError(error.message);
      showCustomNotification("Google Sign-In failed. Please try again.");
    }
    setIsLoading(false);
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle resetting the state
    } catch (e) {
      console.error("Logout failed:", e);
      showCustomNotification("Logout failed. Please try again.");
    }
  };

  const handleSaveProfile = async (updatedProfile) => {
    if (!db || !userId) return;
    try {
      const profileDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
      await setDoc(profileDocRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile); // Update local state
      showCustomNotification("Profile saved successfully!");
    } catch (e) {
      console.error("Error saving profile:", e);
      showCustomNotification("Error saving profile.");
    }
  };

  const renderContent = () => {
    if (!isAuthReady || isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-white text-xl animate-pulse">Loading...</div>
        </div>
      );
    }
    
    if (!userId || currentPage === 'login') {
      return <LoginPage 
                onLogin={handleLogin} 
                onGoogleSignIn={handleGoogleSignIn} 
                onSignUp={handleSignUp} 
                error={error} 
             />;
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
            showCustomNotification={showCustomNotification}
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
      case 'workout-logs':
        return (
          <WorkoutLogs
            userId={userId}
            db={db}
            showCustomNotification={showCustomNotification}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'chat':
        return (
          <Chat />
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
      name: 'Workout Logs', page: 'workout-logs', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
      name: 'Chat', page: 'chat', icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.54 15.253 3 13.68 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
        {userId && (
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
        )}

        <main className={`flex-1 overflow-y-auto ${userId ? 'pb-20' : ''}`}>
          {renderContent()}
        </main>

        {userId && (
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-800 border-t-2 border-gray-700 rounded-t-3xl shadow-xl z-50">
            <div className="flex justify-around items-center h-16">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  className={`flex flex-col items-center justify-center transition-colors duration-200 ease-in-out p-2
                              ${
                                currentPage === item.page
                                  ? 'text-emerald-400'
                                  : 'text-gray-500 hover:text-gray-400'
                              }`}
                  onClick={() => setCurrentPage(item.page)}
                >
                  {item.icon}
                  <span className="text-xs mt-1 font-semibold">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showNotification && (
          <div className="fixed bottom-20 left-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg border border-gray-700 text-center transition-all duration-500 ease-in-out">
            {notificationMessage}
          </div>
        )}
      </div>
    </div>
  );
}
