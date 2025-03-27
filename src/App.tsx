import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';

// Add spinner CSS
const spinnerCSS = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0% { opacity: 0.6; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.6; transform: scale(0.98); }
  }
  
  .spinner {
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 5px solid #fff;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }
  
  .pulse {
    animation: pulse 2s infinite ease-in-out;
  }
`;

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  // Add loading message rotation
  useEffect(() => {
    if (loading) {
      const messages = [
        "Loading...",
        "Starting up...",
        "Preparing Realms of War...",
        "Almost ready..."
      ];
      
      let messageIndex = 0;
      
      const interval = setInterval(() => {
        setLoadingMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Add a small delay to ensure smooth loading experience
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#093f3b]">
        <style>{spinnerCSS}</style>
        <div className="spinner mb-6"></div>
        <p className="text-white text-2xl font-jersey mt-4 pulse">
          {loadingMessage}
        </p>
      </div>
    );
  }

  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/signin" element={user ? <Navigate to="/dashboard" /> : <SignIn />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/signin" />} />
          <Route path="/create" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/join" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/messages" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/profile" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="/rules" element={user ? <Dashboard /> : <Navigate to="/signin" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
