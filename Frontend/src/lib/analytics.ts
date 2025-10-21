// Google Analytics utility functions

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Analytics
 * Call this once when the app loads
 */
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  // Only initialize GA if measurement ID is provided and not in development
  if (!measurementId || measurementId === 'your-ga-measurement-id') {
    console.log('Google Analytics not initialized: No valid measurement ID');
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll manually track page views for SPA routing
  });

  console.log('Google Analytics initialized with ID:', measurementId);
};

/**
 * Track a page view
 * Call this on route changes in your SPA
 */
export const trackPageView = (path: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
};

/**
 * Track custom events
 * @param eventName - Name of the event
 * @param eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track user login
 */
export const trackLogin = (method: string) => {
  trackEvent('login', { method });
};

/**
 * Track user signup
 */
export const trackSignup = (method: string) => {
  trackEvent('sign_up', { method });
};

/**
 * Track search
 */
export const trackSearch = (searchTerm: string) => {
  trackEvent('search', { search_term: searchTerm });
};

