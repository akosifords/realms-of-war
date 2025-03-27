import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const [bgImageLoaded, setBgImageLoaded] = useState(true);
  const figmaImageUrl = "https://s3-alpha-sig.figma.com/img/976e/997d/435a69e3664787312a76ffcff224a585?Expires=1743379200&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=PJPPPI7fV0G7laZgSu4LJb2zkEDIV7R6gl81zXRcEpQYVvdwcGQ6p0IzGiMneKv9Ia1PnJwyTAmE9q~BeyJtfqliPHIofSyRws10A5R~AOfFg9r73dU1bgk3pij2NZ4NuV1QkorcUmT-WpgyjnSCcCg8txmITl48c8FTlGpX6Ou8FMMS6vZtsvuOT-BZ4MnT2PG9W6CbrcYHARofu9vL1oyBPz~0vNkIDoYFT83ZZtQD0Lq3zvo4uCVpRj0woOhwHVdJT6bUNDua6pBBJ-NUN13~StUV318OpvlETqac5tzFQTGNU-8qOY2N0UUDciMcd9RijIgSPe9X6JAaSwRdog__";
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if the background image is loadable
    const img = new Image();
    img.src = figmaImageUrl;
    img.onerror = () => setBgImageLoaded(false);
  }, []);
  
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
      
      {/* Navigation */}
      <nav className="flex justify-between items-center absolute" style={{ top: '57px', right: '50px', gap: '24px' }}>
        <Link to="#about" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">About us</Link>
        <div className="w-[1px] h-[38px] bg-white"></div>
        <Link to="#devlogs" className="text-white text-[24px] font-jersey hover:text-white drop-shadow-md">Devlogs</Link>
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
            className="relative text-white text-[24px] font-jersey hover:text-white drop-shadow-md z-10 flex items-center justify-center"
            style={{ width: '112px', height: '43px' }}
          >
            Sign in
          </Link>
        </div>
      </nav>
      
      {/* Main Content */}
      <div className="absolute" style={{ top: '350px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 
          className="text-white text-[64px] font-jersey text-center mx-auto leading-[64px] drop-shadow-md"
          style={{
            maxWidth: '1162px',
            filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))'
          }}
        >
          Online Multiplayer 2D Turn-Based Strategy Game
        </h1>
        
        <div className="flex flex-col items-center" style={{ marginTop: '96px' }}>
          <h2 
            className="text-white text-[56px] font-jersey leading-[56px]"
            style={{
              marginBottom: '28px',
              filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25))'
            }}
          >
            Join the Fight!
          </h2>
          
          <button 
            className="bg-[#FF7700] hover:bg-[#FF8800] text-white text-[40px] font-jersey rounded-[38px] flex items-center justify-center transition-colors"
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
              className="text-white text-[28px] font-jersey-10"
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