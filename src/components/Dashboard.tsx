import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface Message {
  id: string;
  text: string;
  userName: string;
  timestamp: Timestamp;
}

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

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [displayName, setDisplayName] = useState('Player');
  const [bgImageLoaded, setBgImageLoaded] = useState(true);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const figmaImageUrl = "https://s3-alpha-sig.figma.com/img/976e/997d/435a69e3664787312a76ffcff224a585?Expires=1743379200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=PJPPPI7fV0G7laZgSu4LJb2zkEDIV7R6gl81zXRcEpQYVvdwcGQ6p0IzGiMneKv9Ia1PnJwyTAmE9q~BeyJtfqliPHIofSyRws10A5R~AOfFg9r73dU1bgk3pij2NZ4NuV1QkorcUmT-WpgyjnSCcCg8txmITl48c8FTlGpX6Ou8FMMS6vZtsvuOT-BZ4MnT2PG9W6CbrcYHARofu9vL1oyBPz~0vNkIDoYFT83ZZtQD0Lq3zvo4uCVpRj0woOhwHVdJT6bUNDua6pBBJ-NUN13~StUV318OpvlETqac5tzFQTGNU-8qOY2N0UUDciMcd9RijIgSPe9X6JAaSwRdog__";
  
  // Add loading states
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uiReady, setUiReady] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading dashboard...");

  // Add loading message rotation
  useEffect(() => {
    if (initialLoading) {
      const messages = [
        "Loading dashboard...",
        "Preparing your game space...",
        "Loading chat...",
        "Getting everything ready...",
        "Almost there..."
      ];
      
      let messageIndex = 0;
      
      const interval = setInterval(() => {
        setLoadingMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [initialLoading]);
  
  useEffect(() => {
    // Check if the background image is loadable
    const img = new Image();
    img.src = figmaImageUrl;
    img.onerror = () => setBgImageLoaded(false);
    
    // Set loading states
    setInitialLoading(true);
    setLoading(true);
    setChatLoading(true);
    
    // Check authentication status
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get user data from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin || false);
            
            // Use the name from Firestore if available
            if (userData.name) {
              setDisplayName(userData.name);
            } else if (currentUser.displayName) {
              setDisplayName(currentUser.displayName);
            } else if (currentUser.email) {
              // Remove everything after @ in email to use as display name
              const emailName = currentUser.email.split('@')[0];
              setDisplayName(emailName);
            }
          } else {
            // If user document doesn't exist yet, create it
            if (currentUser.displayName) {
              setDisplayName(currentUser.displayName);
            } else if (currentUser.email) {
              const emailName = currentUser.email.split('@')[0];
              setDisplayName(emailName);
            }
          }
          
          // Mark basic loading as complete
          setLoading(false);
          
          // Add a delay before marking UI as ready
          setTimeout(() => {
            setUiReady(true);
            setTimeout(() => {
              setInitialLoading(false);
            }, 500);
          }, 1000);
          
        } catch (error) {
          console.error("Error fetching user data:", error);
          setLoading(false);
        }
      } else {
        // Redirect to sign in if not authenticated
        navigate('/signin');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Only load messages once the basic user data is loaded
    if (user && !loading) {
      setChatLoading(true);
      
      // Set up real-time listener for chat messages
      const q = query(
        collection(db, 'chat'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData: Message[] = [];
        querySnapshot.forEach((doc) => {
          messagesData.push({
            id: doc.id,
            ...doc.data()
          } as Message);
        });
        
        // Reverse to show newest at the bottom
        setMessages(messagesData.reverse());
        setChatLoading(false);
        
        // Scroll to bottom of messages after they've loaded
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      });
      
      return () => unsubscribe();
    }
  }, [user, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await addDoc(collection(db, 'chat'), {
        text: newMessage,
        userName: displayName,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Show loading spinner while data is being loaded
  if (initialLoading || loading || !uiReady) {
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
    <div 
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        backgroundColor: '#093f3b',
        backgroundImage: bgImageLoaded 
          ? `url('${figmaImageUrl}')`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Welcome Text */}
      <h1 
        className="text-white text-[40px] font-jersey absolute"
        style={{ 
          top: '44px', 
          left: '50px',
          filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))'
        }}
      >
        Welcome back, {displayName}
      </h1>
      
      {/* Navigation Bar */}
      <nav className="flex items-center absolute" style={{ top: '37px', right: '50px' }}>
        {isAdmin && (
          <>
            <Link to="/admin" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md mx-12">Admin</Link>
            <div className="w-[1px] h-[38px] bg-white"></div>
          </>
        )}
        <Link to="/create" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md mx-12">Create</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/join" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md mx-12">Join</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/messages" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md mx-12">Messages</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/profile" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md mx-12">Profile</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/rules" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md mx-12">Rules</Link>
      </nav>
      
      {/* Main Content Layout */}
      <div className="flex h-[calc(100vh-120px)] absolute" style={{ top: '120px', left: 0, right: 0 }}>
        {/* Left Side - Game List Area (Scrollable) */}
        <div className="flex-grow h-full relative overflow-y-auto" style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#366b66 #093f3b'
        }} id="gameListContainer">
          <div className="absolute" style={{ 
            top: '50%', 
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: '600px'
          }}>
            <p className="text-white text-[40px] font-jersey mx-auto leading-[50px]">
              You have no ongoing or joined games.
              <br />
              Create one or join a game
            </p>
            
            {/* Create Button */}
            <button 
              className="bg-[#FF7700] hover:bg-[#FF8800] text-white text-[40px] font-jersey rounded-[38px] mx-auto block mt-[39px] transition-colors"
              style={{ 
                width: '220px',
                height: '71.16px',
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center' 
              }}
              onClick={() => navigate('/create')}
            >
              Create
            </button>
            
            {/* Join Button */}
            <button 
              className="bg-[#143f3b] hover:bg-[#1a4e49] text-white text-[40px] font-jersey rounded-[38px] mx-auto block mt-[22px] transition-colors"
              style={{ 
                width: '220px',
                height: '71.16px',
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center' 
              }}
              onClick={() => navigate('/join')}
            >
              Join
            </button>
          </div>
        </div>
        
        {/* Vertical Line - Only shows when content overflows */}
        <div className="relative w-[1px]">
          <div 
            className="w-[1px] bg-white absolute top-0" 
            style={{ 
              height: 'calc(100%)',
              display: 'none'  // Initially hidden
            }}
            id="verticalDivider"
            ref={(el) => {
              if (el) {
                // Check if content overflows
                const checkOverflow = () => {
                  const gameListContainer = document.getElementById('gameListContainer');
                  if (gameListContainer) {
                    // Show divider when content height > container height
                    el.style.display = gameListContainer.scrollHeight > gameListContainer.clientHeight ? 'block' : 'none';
                  }
                };
                
                // Check on initial render
                checkOverflow();
                
                // Add resize listener
                window.addEventListener('resize', checkOverflow);
                
                // Clean up on unmount
                const observer = new MutationObserver(checkOverflow);
                const gameListContainer = document.getElementById('gameListContainer');
                if (gameListContainer) {
                  observer.observe(gameListContainer, { 
                    childList: true, 
                    subtree: true,
                    attributes: true 
                  });
                }
              }
            }}
          />
        </div>
        
        {/* Right Side - Chat Box (Fixed width) */}
        <div className="h-full pr-[50px] pl-[30px] pb-[30px]" style={{ width: '528px' }}>
          {/* Chat Box */}
          <div 
            className="w-full h-full rounded-[13px] bg-[#0E342F] relative"
            style={{ 
              boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Chat Messages */}
            <div 
              className="overflow-y-auto px-[25px] py-[20px] flex flex-col justify-end"
              style={{ 
                height: 'calc(100% - 80px)',
                scrollbarWidth: 'thin', 
                scrollbarColor: '#366b66 #0E342F' 
              }}
            >
              {chatLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="spinner mb-4" style={{ width: '30px', height: '30px' }}></div>
                  <p className="text-white text-xl font-jersey">Loading chat...</p>
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                    <div key={msg.id} className="mb-[15px]">
                      <p className="text-white text-[20px] font-jersey drop-shadow-md">
                        {msg.userName}: {msg.text}
                      </p>
                      <div className="w-full h-[1px] bg-white mt-[17px] opacity-70"></div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white text-xl font-jersey">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="absolute bottom-0 left-0 right-0 px-[25px] pb-[30px] pt-[10px] bg-[#0E342F] rounded-b-[13px]">
              <form 
                onSubmit={sendMessage}
                className="flex items-center w-full"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-[#D9D9D9] text-black text-[20px] font-jersey rounded-[6px] px-4 py-2 flex-grow"
                  style={{ 
                    height: '38px',
                    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' 
                  }}
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className={`${chatLoading ? 'bg-gray-500' : 'bg-[#FF7700] hover:bg-[#FF8800]'} text-white text-[20px] font-jersey rounded-[5px] ml-[15px] w-[98px] h-[38px] transition-colors`}
                  style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
                  disabled={chatLoading}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 