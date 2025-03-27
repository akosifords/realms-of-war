// This script will create a fallback background if the Figma image is unavailable
document.addEventListener('DOMContentLoaded', function() {
  const mainContainer = document.querySelector('[data-bg-container]');
  if (!mainContainer) return;
  
  // Check if the background image loaded correctly
  const img = new Image();
  img.src = mainContainer.style.backgroundImage.replace(/url\(['"](.+)['"]\)/, '$1');
  
  img.onerror = function() {
    // Create a dark gradient background as fallback
    mainContainer.style.backgroundImage = 'linear-gradient(135deg, #1a2a6c, #2a3c5d, #16222A)';
  };
}); 