// Mobile debugging utilities

export const addMobileDebugInfo = () => {
  if (typeof window === 'undefined') return;
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Force document height
    document.documentElement.style.height = 'auto';
    document.documentElement.style.minHeight = '100vh';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100vh';
    document.body.style.overflowY = 'auto';
    document.body.style.WebkitOverflowScrolling = 'touch';
    
    // Log debug info
    console.log('📱 Mobile detected');
    console.log('📏 Screen height:', window.screen.height);
    console.log('📏 Window height:', window.innerHeight);
    console.log('📏 Document height:', document.documentElement.scrollHeight);
    console.log('🌍 User Agent:', navigator.userAgent);
    
    // Add scroll debug
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop;
      console.log('📜 Scroll position:', scrollTop);
      lastScrollTop = scrollTop;
    }, { passive: true });
    
    // Force refresh layout
    setTimeout(() => {
      document.body.style.display = 'none';
      document.body.offsetHeight; // Trigger reflow
      document.body.style.display = 'block';
      console.log('🔄 Layout refreshed for mobile');
    }, 100);
  }
};

export const fixMobileLayout = () => {
  // Remove all height restrictions on mobile
  const elements = document.querySelectorAll('[class*="h-full"], [class*="h-screen"]');
  elements.forEach(el => {
    el.style.height = 'auto';
    el.style.minHeight = 'auto';
  });
  
  // Force container to be scrollable
  const root = document.getElementById('root');
  if (root) {
    root.style.height = 'auto';
    root.style.minHeight = '100vh';
    root.style.overflow = 'visible';
  }
  
  console.log('🔧 Mobile layout fixed - removed height restrictions');
};