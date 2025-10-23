import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, User, Utensils, Dumbbell, MessageSquare, BotMessageSquare } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ userId, handleLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // You can show notifications dynamically
  const showTempNotification = (msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2500);
  };

  const navItems = [
    { path: '/', name: 'Home', icon: <Home size={20} /> },
    { path: '/workout-plan', name: 'Workout', icon: <Dumbbell size={20} /> },
    { path: '/chat', name: 'Chat', icon: <BotMessageSquare size={20}/> },
    { path: '/forum', name: 'Community', icon: <MessageSquare size={20} /> },
    { path: '/profile', name: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans antialiased flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen relative flex flex-col bg-gray-900 shadow-2xl rounded-3xl overflow-hidden">

        {/* Header */}
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

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto ${userId ? 'pb-20' : ''}`}>
          <Outlet context={{ showTempNotification }} />
        </main>

        {/* Bottom Navigation */}
        {userId && (
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gray-800 border-t-2 border-gray-700 rounded-t-3xl shadow-xl z-50">
            <div className="flex justify-around items-center h-16">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center transition-colors duration-200 ease-in-out p-2 ${
                    currentPath === item.path
                      ? 'text-emerald-400'
                      : 'text-gray-500 hover:text-gray-400'
                  } ${
                    item.path === '/chat'
                      ? 'mb-12 h-12 w-12 bg-gradient-to-br from-green-500 to-blue-700 text-white rounded-full shadow shadow-lg shadow-black/50'
                      : ''
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1 font-semibold">{item.path =='/chat' ? '': item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Notification Banner */}
        {showNotification && (
          <div className="fixed bottom-20 left-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg border border-gray-700 text-center transition-all duration-500 ease-in-out">
            {notificationMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
