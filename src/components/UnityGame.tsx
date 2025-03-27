import React, { useRef, useEffect, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';

interface UnityGameProps {
  width?: string | number;
  height?: string | number;
  onUnmount?: () => void; // Add callback for when component unmounts
}

// Create a global error handler OUTSIDE of the component to ensure it persists
// This will handle the getBoundingClientRect error that occurs during tab changes
if (typeof window !== 'undefined') {
  // Patch Element.prototype.getBoundingClientRect to prevent errors
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    try {
      return originalGetBoundingClientRect.apply(this);
    } catch (e) {
      // Return a dummy DOMRect instead of throwing
      return new DOMRect(0, 0, 0, 0);
    }
  };

  // Add global error handler
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('getBoundingClientRect')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Suppress console errors related to Unity WebGL
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('getBoundingClientRect') || args[0].includes('Invoking error handler'))) {
      return; // Suppress the error
    }
    return originalConsoleError.apply(this, args);
  };
}

const UnityGame: React.FC<UnityGameProps> = ({ width = '100%', height = '100%', onUnmount }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [unityReady, setUnityReady] = useState(false);
  
  // Unity context with proper configuration
  const unityContext = useUnityContext({
    loaderUrl: `${import.meta.env.BASE_URL}build/mapeditor/Build.loader.js`,
    dataUrl: `${import.meta.env.BASE_URL}build/mapeditor/Build.data`,
    frameworkUrl: `${import.meta.env.BASE_URL}build/mapeditor/Build.framework.js`,
    codeUrl: `${import.meta.env.BASE_URL}build/mapeditor/Build.wasm`,
    webglContextAttributes: {
      preserveDrawingBuffer: true
    }
  });
  
  const { unityProvider, isLoaded, loadingProgression } = unityContext;

  // Handle component mounting and cleanup
  useEffect(() => {
    setMounted(true);
    
    // Delayed initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      setUnityReady(true);
    }, 300);
    
    return () => {
      clearTimeout(timer);
      setMounted(false);
      setUnityReady(false);
      
      // Cleanup Unity resources when component unmounts
      if (typeof unityContext.unload === 'function') {
        unityContext.unload();
      }

      // Call onUnmount callback if provided
      if (onUnmount) {
        onUnmount();
      }
    };
  }, [onUnmount]);

  // Handle container stability
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(() => {
      // Force recalculation on size changes
      if (containerRef.current && document.contains(containerRef.current)) {
        containerRef.current.style.visibility = 'hidden';
        void containerRef.current.offsetHeight;
        containerRef.current.style.visibility = 'visible';
      }
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [containerRef.current]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width,
        height,
        position: 'relative',
        backgroundColor: '#0c1f1e'
      }}
      id="unity-container"
      className="w-full h-full rounded-lg"
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mb-4"></div>
            <p className="text-white text-xl font-jersey">
              Loading... ({Math.round(loadingProgression * 100)}%)
            </p>
          </div>
        </div>
      )}
      {mounted && unityReady && (
        <Unity 
          unityProvider={unityProvider}
          style={{ 
            visibility: isLoaded ? 'visible' : 'hidden',
            width: '100%',
            height: '100%',
            backgroundColor: '#0c1f1e'
          }}
        />
      )}
    </div>
  );
};

export default UnityGame; 