import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import UnityGame from './UnityGame';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: any;
}

interface Map {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  width?: number;
  height?: number;
  createdAt: any;
  createdBy: string;
  mapData?: any;
}

// Update the spinner CSS with a pulsing effect
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

// Add TypeScript interface for the window object with ReactUnityMapEditor
declare global {
  interface Window {
    ReactUnityMapEditor?: {
      onMapSaved: (mapData: string) => void;
    };
    gc?: () => void;
  }
}

const AdminPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('createMap');
  
  // User management states
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Map management states
  const [maps, setMaps] = useState<Map[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(false);

  // General states
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('Player');
  
  const navigate = useNavigate();

  // Add new loading state to track UI readiness
  const [initialLoading, setInitialLoading] = useState(true);
  const [uiReady, setUiReady] = useState(false);

  // Add panel loading states
  const [panelLoading, setPanelLoading] = useState(false);

  // Add loading progress state
  const [loadingMessage, setLoadingMessage] = useState("Loading dashboard...");

  // Add state to track Unity instances
  const [unityActive, setUnityActive] = useState(false);
  const [unityCleanupInProgress, setUnityCleanupInProgress] = useState(false);

  // Add function to handle Unity cleanup
  const handleUnityCleanup = () => {
    // Mark Unity as no longer active
    setUnityActive(false);
    
    // Set a flag that cleanup is in progress
    setUnityCleanupInProgress(true);
    
    // Force garbage collection if possible
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        console.log('Manual garbage collection not available');
      }
    }
    
    // Clear any Unity-related errors from the console
    if (console.clear) {
      console.clear();
    }
    
    // After a short delay, mark cleanup as complete
    setTimeout(() => {
      setUnityCleanupInProgress(false);
    }, 300);
  };

  // Update tab change handler to properly clean up Unity
  const handleTabChange = (tabName: string) => {
    // If already on this tab, do nothing
    if (tabName === activePanel) return;
    
    // Clear error and message states
    setError('');
    setMessage('');

    // Check if we're leaving a Unity tab
    const leavingUnityTab = (activePanel === 'createMap' || activePanel === 'editMapTiles');
    
    // Check if we're going to a Unity tab
    const goingToUnityTab = (tabName === 'createMap' || tabName === 'editMapTiles');
    
    // If Unity cleanup is in progress, delay any tab change
    if (unityCleanupInProgress) {
      setTimeout(() => handleTabChange(tabName), 200);
      return;
    }
    
    // If leaving a Unity tab, clean up first
    if (leavingUnityTab && unityActive) {
      handleUnityCleanup();
      
      // Delay the actual tab change to allow cleanup
      setTimeout(() => {
        setActivePanel(tabName);
        
        // If going to another Unity tab, mark as active
        if (goingToUnityTab) {
          setUnityActive(true);
        }
        
        // Handle loading if needed for specific panels
        if (tabName === 'mapList') {
          setPanelLoading(true);
          fetchMaps().then(() => setPanelLoading(false));
        } else if (tabName === 'userList') {
          setPanelLoading(true);
          fetchUsers().then(() => setPanelLoading(false));
        } else if (tabName === 'clearAllData') {
          handleClearAllData();
        }
      }, 500); // Longer delay when leaving a Unity tab
    } else {
      // Otherwise change immediately
      setActivePanel(tabName);
      
      // If going to a Unity tab, mark as active
      if (goingToUnityTab) {
        setUnityActive(true);
      }
      
      // Handle loading if needed for specific panels
      if (tabName === 'mapList') {
        setPanelLoading(true);
        fetchMaps().then(() => setPanelLoading(false));
      } else if (tabName === 'userList') {
        setPanelLoading(true);
        fetchUsers().then(() => setPanelLoading(false));
      } else if (tabName === 'clearAllData') {
        handleClearAllData();
      }
    }
  };

  // Add initial data loading function to centralize all loading operations
  const loadInitialData = async (): Promise<void> => {
    try {
      // Load all data concurrently
      await Promise.all([
        loadUsers(),
        loadMaps()
      ]);
      
      // Even after data is loaded, delay UI appearance for smoother experience
      return new Promise((resolve) => {
        setTimeout(() => {
          setLoading(false);
          setTimeout(() => {
            setUiReady(true);
            setInitialLoading(false);
            resolve();
          }, 500); // Short delay after data is loaded to ensure UI rendering completes
        }, 1000); // Minimum loading time to give a consistent experience
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('There was a problem loading the dashboard. Please refresh the page.');
      setLoading(false);
      throw error;
    }
  };

  // Update the useEffect to use this function
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setInitialLoading(true);
      setLoading(true);
      
      if (!user) {
        navigate('/signin');
        return;
      }

      setCurrentUser(user);

      try {
        // Check if the logged-in user is an admin
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin || false);
          
          // Set display name
          if (userData.name) {
            setDisplayName(userData.name);
          } else if (user.displayName) {
            setDisplayName(user.displayName);
          } else if (user.email) {
            const emailName = user.email.split('@')[0];
            setDisplayName(emailName);
          }
          
          if (!userData.isAdmin) {
            navigate('/dashboard'); // Redirect non-admins
            return;
          }
          
          // Load all initial data
          await loadInitialData();
          
        } else {
          setIsAdmin(false);
          navigate('/dashboard'); // Redirect if no user doc
          return;
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        navigate('/dashboard');
        return;
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Add a component to show loading during render
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!loading && !uiReady) {
      timer = setTimeout(() => {
        setUiReady(true);
        setInitialLoading(false);
      }, 1500); // Ensure UI is marked ready eventually to prevent infinite loading
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, uiReady]);

  // Update loading message based on loading state
  useEffect(() => {
    if (initialLoading) {
      const messages = [
        "Loading dashboard...",
        "Preparing admin panel...",
        "Loading user data...",
        "Loading map data...",
        "Almost ready..."
      ];
      
      let messageIndex = 0;
      
      const interval = setInterval(() => {
        setLoadingMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [initialLoading]);

  // Add these helper functions to load data
  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          id: doc.id,
          name: userData.name || 'Unknown',
          email: userData.email || 'No email',
          isAdmin: userData.isAdmin || false,
          createdAt: userData.createdAt
        });
      });
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error preloading users:', err);
      setError('Failed to load users. Please try again.');
    }
  };

  const loadMaps = async () => {
    try {
      const mapsRef = collection(db, 'maps');
      const q = query(mapsRef, orderBy('createdAt', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const mapsData: Map[] = [];
      querySnapshot.forEach((doc) => {
        const mapData = doc.data();
        mapsData.push({
          id: doc.id,
          name: mapData.name || 'Unnamed Map',
          description: mapData.description || 'No description',
          imageUrl: mapData.imageUrl || '',
          width: mapData.width,
          height: mapData.height,
          createdAt: mapData.createdAt,
          createdBy: mapData.createdBy || 'Unknown',
          mapData: mapData.mapData || null
        });
      });
      
      setMaps(mapsData);
    } catch (err) {
      console.error('Error preloading maps:', err);
      setError('Failed to load maps. Please try again.');
    }
  };

  // Modify the existing fetchUsers and fetchMaps functions to return promises
  const fetchUsers = async (): Promise<void> => {
    setLoadingUsers(true);
    try {
      await loadUsers();
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMaps = async (): Promise<void> => {
    setLoadingMaps(true);
    try {
      await loadMaps();
    } finally {
      setLoadingMaps(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !isCurrentlyAdmin
      });
      
      setMessage(`User admin status toggled successfully`);
      fetchUsers(); // Refresh the users list
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleCreateMap = async (e?: React.FormEvent, mapData?: any) => {
    if (e) e.preventDefault();
    setMessage('');
    setError('');
    
    // Show loading overlay - this ensures loading appears immediately
    setPanelLoading(true);
    document.body.style.cursor = 'wait';

    try {
      // Create new map document with map data if available, removing name field
      await addDoc(collection(db, 'maps'), {
        imageUrl: "",
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        // Save the map data if available
        mapData: mapData || null
      });
      
      // Refresh maps list
      await fetchMaps();
      
      // Switch to map list tab
      setActivePanel('mapList');
    } catch (err) {
      console.error('Error creating map:', err);
      setError('Failed to create map. Please try again.');
    } finally {
      setPanelLoading(false); // Hide loading screen
      document.body.style.cursor = 'default';
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    if (confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'maps', mapId));
        setMessage('Map deleted successfully');
        fetchMaps(); // Refresh the maps list
      } catch (err) {
        console.error('Error deleting map:', err);
        setError('Failed to delete map. Please try again.');
      }
    }
  };

  const handleClearAllData = () => {
    if (confirm('WARNING: This will delete ALL data from the application. This action cannot be undone. Are you absolutely sure?')) {
      if (confirm('Last chance: This will PERMANENTLY DELETE all maps, users, and game data. Continue?')) {
        // TODO: Implement actual data clearing functionality
        setMessage('Clear all data functionality not yet implemented');
      }
    }
  };

  // Add effect to track Unity active state based on active panel
  useEffect(() => {
    // Set Unity as active when on Unity-related tabs
    if (activePanel === 'createMap' || activePanel === 'editMapTiles') {
      setUnityActive(true);
    }
  }, [activePanel]);

  // Add React to Unity communication for map saving
  useEffect(() => {
    if (activePanel === 'createMap') {
      // Define a global handler that Unity will call
      window.ReactUnityMapEditor = {
        onMapSaved: (mapData: string) => {
          console.log('Map data received from Unity:', mapData);
          
          // Ensure loading screen shows
          setPanelLoading(true);
          document.body.style.cursor = 'wait';
          
          // Process the map data
          try {
            const mapObject = JSON.parse(mapData);
            
            // Call handleCreateMap with the map data
            handleCreateMap(undefined, mapObject).catch(error => {
              console.error('Error saving map:', error);
              setError('Failed to save map data from Unity');
              document.body.style.cursor = 'default';
            });
          } catch (error) {
            console.error('Error processing map data:', error);
            setError('Failed to process map data from Unity');
            setPanelLoading(false);
            document.body.style.cursor = 'default';
          }
        }
      };

      // Listen for the custom event (fallback method)
      const handleUnityMapEvent = (event: CustomEvent) => {
        console.log('Map data received via event:', event.detail);
        
        // Ensure loading screen shows
        setPanelLoading(true);
        document.body.style.cursor = 'wait';
        
        // Process the map data
        try {
          const { mapData } = event.detail;
          // Parse the map data if it's a string
          const mapObject = typeof mapData === 'string' ? JSON.parse(mapData) : mapData;
          
          // Call handleCreateMap with the map data
          handleCreateMap(undefined, mapObject).catch(error => {
            console.error('Error saving map:', error);
            setError('Failed to save map data from Unity');
            document.body.style.cursor = 'default';
          });
        } catch (error) {
          console.error('Error processing map data:', error);
          setError('Failed to process map data from Unity');
          setPanelLoading(false);
          document.body.style.cursor = 'default';
        }
      };
      
      window.addEventListener('unity-map-saved', handleUnityMapEvent as EventListener);
      
      // Clean up event listener when component unmounts or changes tabs
      return () => {
        window.removeEventListener('unity-map-saved', handleUnityMapEvent as EventListener);
        document.body.style.cursor = 'default';
      };
    }
  }, [activePanel, currentUser]);

  // Update the loading condition
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

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#093f3b]">
        <style>{spinnerCSS}</style>
        <div className="text-white text-3xl font-jersey mb-4">Access Denied</div>
        <p className="text-white text-xl font-jersey">You don't have admin privileges</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-6 bg-[#0E342F] hover:bg-[#143f3b] text-white text-xl font-jersey rounded-lg py-2 px-6 transition-colors"
          style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#093f3b]">
      {/* Welcome Text and Navigation */}
      <h1 className="text-white text-[40px] font-jersey absolute" style={{ top: '44px', left: '50px' }}>
        Welcome back, {displayName}
      </h1>
      
      {/* Navigation Bar */}
      <nav className="flex items-center justify-end absolute" style={{ top: '47px', right: '50px', gap: '40px' }}>
        <Link to="/home" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Home</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/create" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Create</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/join" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Join</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/messages" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Messages</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/profile" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Profile</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/rules" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Rules</Link>
      </nav>
      
      {/* Main Layout with Tabs */}
      <div className="flex flex-col pt-32 px-16 pb-4 h-screen">
        {/* Notifications */}
        {(message || error) && (
          <div className="absolute top-28 left-1/2 transform -translate-x-1/2 w-1/2 z-10">
            {error && (
              <div className="bg-red-600/80 text-white p-3 rounded-lg mb-2 shadow-lg">
                <p className="font-jersey">{error}</p>
              </div>
            )}
            {message && (
              <div className="bg-green-600/80 text-white p-3 rounded-lg shadow-lg">
                <p className="font-jersey">{message}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="w-full flex flex-col h-[calc(100vh-160px)]">
          {/* Tab List */}
          <div className="flex">
            <button
              onClick={() => handleTabChange('createMap')}
              className={`text-white text-[24px] font-jersey py-3 px-8 rounded-t-lg focus:outline-none ${
                activePanel === 'createMap' 
                  ? 'bg-[#0E342F]' 
                  : 'bg-[#093f3b]'
              }`}
            >
              Create a Map
            </button>
            
            <button
              onClick={() => handleTabChange('mapList')}
              className={`text-white text-[24px] font-jersey py-3 px-8 focus:outline-none ${
                activePanel === 'mapList' 
                  ? 'bg-[#0E342F]' 
                  : 'bg-[#093f3b]'
              }`}
            >
              Map List
            </button>
            
            <button
              onClick={() => handleTabChange('editMapTiles')}
              className={`text-white text-[24px] font-jersey py-3 px-8 focus:outline-none ${
                activePanel === 'editMapTiles' 
                  ? 'bg-[#0E342F]' 
                  : 'bg-[#093f3b]'
              }`}
            >
              Edit Map Tiles
            </button>
            
            <button
              onClick={() => handleTabChange('userList')}
              className={`text-white text-[24px] font-jersey py-3 px-8 focus:outline-none ${
                activePanel === 'userList' 
                  ? 'bg-[#0E342F]' 
                  : 'bg-[#093f3b]'
              }`}
            >
              User List
            </button>
            
            <button
              onClick={() => handleTabChange('clearAllData')}
              className={`text-white text-[24px] font-jersey py-3 px-8 rounded-tr-lg focus:outline-none ${
                activePanel === 'clearAllData' 
                  ? 'bg-[#0E342F]' 
                  : 'bg-[#093f3b]'
              }`}
            >
              Clear All Data
            </button>
          </div>
          
          {/* Content Area */}
          <div className="bg-[#0E342F] rounded-b-lg rounded-tr-lg p-4 flex-1 overflow-auto">
            {activePanel === 'createMap' && (
              <div className="p-5 h-full relative">
                {/* Loading Overlay */}
                {panelLoading && (
                  <div className="absolute inset-0 bg-black z-10 flex flex-col items-center justify-center">
                    <div className="spinner mb-6" style={{ width: '50px', height: '50px' }}></div>
                    <p className="text-white text-2xl font-jersey mt-4 pulse">
                      Saving map...
                    </p>
                  </div>
                )}
                
                {/* Unity Canvas - Full width */}
                <div className="h-full w-full">
                  <div className="h-full w-full bg-[#0c1f1e] rounded-lg overflow-hidden flex">
                    <UnityGame 
                      height="100%" 
                      width="100%" 
                      onUnmount={handleUnityCleanup}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activePanel === 'mapList' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-2xl font-jersey">Map List</h3>
                  <button
                    onClick={() => {
                      setPanelLoading(true);
                      fetchMaps().then(() => setPanelLoading(false));
                    }}
                    className="bg-[#FF7700] hover:bg-[#FF8800] text-white px-4 py-2 rounded-[20px] font-jersey"
                    style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
                  >
                    Refresh
                  </button>
                </div>
                
                {(loadingMaps || panelLoading) ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="spinner mb-4" style={{ width: '30px', height: '30px' }}></div>
                    <p className="text-white">Loading maps...</p>
                  </div>
                ) : maps.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {maps.map(map => (
                      <div key={map.id} className="bg-[#072a27] rounded-lg p-4">
                        <h4 className="text-white text-xl mb-2">
                          {map.mapData?.mapName || map.name || 'Unnamed Map'}
                        </h4>
                        <p className="text-gray-300 mb-4 h-20 overflow-hidden">
                          {map.mapData?.mapDescription || map.description || 'No description'}
                        </p>
                        <div className="flex justify-between">
                          <button 
                            className="bg-[#FF7700] hover:bg-[#FF8800] text-white px-5 py-2 rounded-[20px] font-jersey"
                            onClick={() => handleTabChange('editMapTiles')}
                            style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
                          >
                            Edit
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-[20px] font-jersey"
                            onClick={() => handleDeleteMap(map.id)}
                            style={{ boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white">No maps found.</p>
                )}
              </div>
            )}
            
            {activePanel === 'editMapTiles' && (
              <div className="h-full p-5">
                <h3 className="text-white text-2xl font-jersey mb-4">Map Editor</h3>
                <div className="h-[calc(100%-4rem)] w-full overflow-hidden">
                  <UnityGame 
                    height="100%" 
                    onUnmount={handleUnityCleanup}
                  />
                </div>
              </div>
            )}
            
            {activePanel === 'userList' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-2xl font-jersey">User List</h3>
                  <button
                    onClick={() => {
                      setPanelLoading(true);
                      fetchUsers().then(() => setPanelLoading(false));
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Refresh
                  </button>
                </div>
                
                {(loadingUsers || panelLoading) ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="spinner mb-4" style={{ width: '30px', height: '30px' }}></div>
                    <p className="text-white">Loading users...</p>
                  </div>
                ) : users.length > 0 ? (
                  <table className="w-full text-white">
                    <thead className="bg-[#072a27] border-b border-gray-600">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-center">Admin</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-700">
                          <td className="p-2">{user.name}</td>
                          <td className="p-2">{user.email}</td>
                          <td className="p-2 text-center">
                            {user.isAdmin ? (
                              <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                                Yes
                              </span>
                            ) : (
                              <span className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs">
                                No
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                              className={user.isAdmin ? "bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded" : "bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"}
                            >
                              {user.isAdmin ? "Remove Admin" : "Make Admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-white">No users found.</p>
                )}
              </div>
            )}
            
            {activePanel === 'clearAllData' && (
              <div>
                <h3 className="text-white text-2xl font-jersey mb-4">Clear All Data</h3>
                <p className="text-white mb-6">This action will delete ALL data from the application. This cannot be undone.</p>
                <button
                  onClick={handleClearAllData}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold"
                >
                  Clear All Data
                </button>
              </div>
            )}
            
            {activePanel === 'none' && (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-white text-2xl font-jersey">Select an option from the menu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 