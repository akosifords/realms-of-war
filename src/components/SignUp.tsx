import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Link } from 'react-router-dom';

// Add spinner CSS
const spinnerCSS = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spinner-sm {
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 3px solid #fff;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  }
`;

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bgImageLoaded, setBgImageLoaded] = useState(true);
  const figmaImageUrl = "https://s3-alpha-sig.figma.com/img/976e/997d/435a69e3664787312a76ffcff224a585?Expires=1743379200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=PJPPPI7fV0G7laZgSu4LJb2zkEDIV7R6gl81zXRcEpQYVvdwcGQ6p0IzGiMneKv9Ia1PnJwyTAmE9q~BeyJtfqliPHIofSyRws10A5R~AOfFg9r73dU1bgk3pij2NZ4NuV1QkorcUmT-WpgyjnSCcCg8txmITl48c8FTlGpX6Ou8FMMS6vZtsvuOT-BZ4MnT2PG9W6CbrcYHARofu9vL1oyBPz~0vNkIDoYFT83ZZtQD0Lq3zvo4uCVpRj0woOhwHVdJT6bUNDua6pBBJ-NUN13~StUV318OpvlETqac5tzFQTGNU-8qOY2N0UUDciMcd9RijIgSPe9X6JAaSwRdog__";
  
  useEffect(() => {
    // Check if the background image is loadable
    const img = new Image();
    img.src = figmaImageUrl;
    img.onerror = () => setBgImageLoaded(false);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update the user profile with display name
      if (displayName && user) {
        await updateProfile(user, {
          displayName: displayName
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: displayName,
          id: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          gamesJoined: [],
          completedGames: [],
          isAdmin: false
        });
      }
      
      // Don't navigate here - let App.tsx handle redirection
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      console.error('Sign up error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden"
      data-bg-container
      style={{
        backgroundColor: '#093f3b', // Exact teal background color from Figma
        backgroundImage: bgImageLoaded 
          ? `url('${figmaImageUrl}')`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style>{spinnerCSS}</style>
      {/* Navigation */}
      <nav className="flex justify-between items-center absolute" style={{ top: '57px', right: '50px', gap: '24px' }}>
        <Link to="/#about" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">About us</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="/#devlogs" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Devlogs</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <a 
          href="https://patreon.com/realmsofwar" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md"
        >
          Support us!
        </a>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link 
          to="/signin" 
          className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md"
        >
          Sign In
        </Link>
      </nav>

      {/* Sign Up Form */}
      <div 
        className="rounded-[24px] flex flex-col absolute"
        style={{
          backgroundColor: 'rgba(14, 50, 46, 0.89)',
          boxShadow: 'inset 0 4px 4px rgba(0, 0, 0, 0.25)',
          width: '513px',
          height: '787px',
          left: '50%',
          top: '223px',
          transform: 'translateX(-50%)'
        }}
      >
        <h1 
          className="text-white text-[40px] font-jersey text-center"
          style={{ 
            marginTop: '154px',
            filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))',
            lineHeight: '40px',
            width: '309px',
            alignSelf: 'center'
          }}
        >
          Create your account
        </h1>
        
        <form onSubmit={handleSignUp} className="flex flex-col mt-[45px]" style={{ alignItems: 'center' }}>
          <div className="flex flex-col">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-white text-[#B0B0B0] px-6 rounded-[21px] text-[32px] font-jersey"
              style={{ 
                height: '50px',
                width: '346px',
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
                paddingTop: '9px',
                paddingBottom: '9px'
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex flex-col mt-[26px]">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="bg-white text-[#B0B0B0] px-6 rounded-[21px] text-[32px] font-jersey"
              style={{ 
                height: '50px',
                width: '346px',
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
                paddingTop: '9px',
                paddingBottom: '9px'
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex flex-col mt-[26px]">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="bg-white text-[#B0B0B0] px-6 rounded-[21px] text-[32px] font-jersey"
              style={{ 
                height: '50px',
                width: '346px',
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
                paddingTop: '9px',
                paddingBottom: '9px'
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex flex-col mt-[26px]">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              className="bg-white text-[#B0B0B0] px-6 rounded-[21px] text-[32px] font-jersey"
              style={{ 
                height: '50px',
                width: '346px',
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
                paddingTop: '9px',
                paddingBottom: '9px'
              }}
              required
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}
          
          <button 
            type="submit"
            className="bg-[#FF7700] hover:bg-[#FF8800] text-white font-jersey text-[36px] rounded-[38px]"
            style={{ 
              width: '190px',
              height: '58.31px',
              boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '36px',
              marginTop: '31px'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="spinner-sm"></div>
            ) : (
              "Enter"
            )}
          </button>
        </form>
        
        <div className="flex flex-col items-center" style={{ marginTop: 'auto', marginBottom: '60px' }}>
          <p 
            className="text-white text-[32px] font-jersey"
            style={{ 
              filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))',
              lineHeight: '32px',
              width: '321px',
              textAlign: 'center'
            }}
          >
            Already have an account?
          </p>
          <Link 
            to="/signin" 
            className="text-white text-[32px] font-jersey underline"
            style={{ 
              filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))',
              lineHeight: '32px',
              textAlign: 'center',
              marginTop: '3px',
              textDecoration: 'underline'
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 