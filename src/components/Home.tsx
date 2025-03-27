import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Create a gradient background
    document.body.style.background = 'linear-gradient(135deg, #093f3b, #0d524d, #16222A)';
    
    return () => {
      document.body.style.background = '';
    };
  }, []);
  
  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden" 
      data-bg-container
      style={{
        backgroundColor: '#093f3b', // Exact teal background color from Figma
        backgroundImage: 'linear-gradient(135deg, #093f3b, #0d524d, #16222A)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      
      {/* Navigation */}
      <nav className="flex justify-between items-center p-4 lg:p-0 w-full lg:w-auto" style={{ top: '57px', right: '50px', gap: '24px', position: 'absolute' }}>
        <Link to="#about" className="text-white text-[18px] md:text-[24px] font-jersey hover:text-white drop-shadow-md">About us</Link>
        <div className="w-[1px] h-[38px] bg-white hidden md:block"></div>
        <Link to="#devlogs" className="text-white text-[18px] md:text-[24px] font-jersey hover:text-white drop-shadow-md">Devlogs</Link>
        <div className="w-[1px] h-[38px] bg-white hidden md:block"></div>
        <a 
          href="https://patreon.com/realmsofwar" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-white text-[18px] md:text-[24px] font-jersey hover:text-white drop-shadow-md"
        >
          Support us!
        </a>
        <div className="w-[1px] h-[38px] bg-white hidden md:block"></div>
        <div className="relative">
          <div 
            className="absolute -left-[3px] right-0 top-0 bottom-0 bg-[#FF7700] rounded-[38px] shadow-md"
            style={{ 
              width: '112px',
              height: '43px',
              boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)' 
            }}
          ></div>
          <Link 
            to="/signin" 
            className="relative text-white text-[18px] md:text-[24px] font-jersey hover:text-white drop-shadow-md z-10 flex items-center justify-center"
            style={{ width: '112px', height: '43px' }}
          >
            Sign in
          </Link>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="absolute px-4 md:px-0" style={{ top: '350px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 
          className="text-white text-[40px] md:text-[64px] font-jersey text-center mx-auto leading-tight md:leading-[64px] drop-shadow-md"
          style={{
            maxWidth: '1162px',
            filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))'
          }}
        >
          Online Multiplayer 2D Turn-Based Strategy Game
        </h1>
        
        <div className="flex flex-col items-center" style={{ marginTop: '96px' }}>
          <h2 
            className="text-white text-[36px] md:text-[56px] font-jersey leading-tight md:leading-[56px]"
            style={{
              marginBottom: '28px',
              filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))'
            }}
          >
            Join the Fight!
          </h2>
          
          <button 
            className="bg-[#FF7700] hover:bg-[#FF8800] text-white text-[32px] md:text-[40px] font-jersey rounded-[38px] flex items-center justify-center transition-colors"
            style={{ 
              boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
              width: '220px',
              height: '85px',
            }}
            onClick={() => navigate('/signin')}
          >
            Play Now
          </button>
          
          <div 
            className="rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(10, 46, 43, 0.6)',
              width: '320px',
              height: '35px',
              marginTop: '29px'
            }}
          >
            <p 
              className="text-white text-[20px] md:text-[28px] font-jersey-10"
              style={{
                filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))',
                lineHeight: '30px'
              }}
            >
              Beta version open (0.2 alpha)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 