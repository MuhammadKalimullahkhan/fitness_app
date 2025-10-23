import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { apiKey, firebaseConfig, appId } from './EnvManager';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import DietManagement from './pages/DietManagement';
import WorkoutManagement from './pages/WorkoutManagement';
import WorkoutLogs from './pages/WorkoutLogs';
import Forum from './pages/Forum';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Chat from './pages/Chat';

const App = () => {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [forumPosts, setForumPosts] = useState([]);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const firebaseApp = initializeApp(firebaseConfig);
    setApp(firebaseApp);
    setDb(getFirestore(firebaseApp));

    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const showCustomNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  useEffect(() => {
    if (userId && db && appId) {
      const profileRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
      const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data());
        } else {
          const defaultProfile = { name: `User ${userId.substring(0, 5)}`, fitnessGoal: 'Beginner', dietPreference: 'Weight Loss', role: 'user', weightHistory: [] };
          setDoc(profileRef, defaultProfile).then(() => setUserProfile(defaultProfile));
        }
      });

      const postsRef = collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const unsubscribeForum = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForumPosts(posts);
      });

      return () => {
        unsubscribeProfile();
        unsubscribeForum();
      };
    }
  }, [userId, db, appId]);

  const handleSaveProfile = async (updatedProfile) => {
    if (userId && db) {
      const profileRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
      await setDoc(profileRef, updatedProfile, { merge: true });
      showCustomNotification("Profile saved successfully!");
    }
  };

  const handleLogin = async (email, password) => {
    if (!app) return;
    const auth = getAuth(app);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!app) return;
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignUp = async (email, password) => {
    if (!app) return;
    const auth = getAuth(app);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await handleLogin(email, password);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    if (app) {
      const auth = getAuth(app);
      await signOut(auth);
    }
  };

  if (!isAuthReady) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="text-white font-sans antialiased">
      {notification.show && (
        <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
          {notification.message}
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} onGoogleSignIn={handleGoogleSignIn} onSignUp={handleSignUp} error={error} />} />
        {
          userId ? (
            <Route element={<Layout userId={userId} handleLogout={handleLogout} />}>
              <Route path="/" element={<Dashboard userProfile={userProfile} userId={userId} db={db} showCustomNotification={showCustomNotification} />} />
              <Route path="/profile" element={<Profile userProfile={userProfile} onSaveProfile={handleSaveProfile} showCustomNotification={showCustomNotification} />} />
              <Route path="/diet" element={<DietManagement userProfile={userProfile} showCustomNotification={showCustomNotification} />} />
              <Route path="/workout-plan" element={<WorkoutManagement userProfile={userProfile} showCustomNotification={showCustomNotification} db={db} userId={userId} />} />
              <Route path="/workout-logs" element={<WorkoutLogs userId={userId} db={db} showCustomNotification={showCustomNotification} />} />
              <Route path="/forum" element={<Forum db={db} userId={userId} userProfile={userProfile} forumPosts={forumPosts} showCustomNotification={showCustomNotification} />} />
              <Route path="/chat" element={<Chat userProfile={userProfile} db={db} userId={userId} />} />
            </Route>
          ) : (
            <Route path="/*" element={<Navigate to="/login" replace />} />
          )
        }
      </Routes>
    </div>
  );
};

export default App;
