/**
 * Utility for loading the Google Maps API
 * This centralizes the API loading to prevent duplicate script loading
 */

// Flag to track if loading has been initiated
let isLoading = false;
let isLoaded = false;

// Promise that resolves when API is loaded
let loadPromise: Promise<void> | null = null;

// The Google Maps API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDZ0bKD5EPCHctwI9bJPiGe1KQHbtqq2FU';

// Type definitions for Google Maps
export type GoogleAutocomplete = any;
export type GoogleAutocompletePrediction = any;
export type GooglePlace = any;
export type GoogleAddressComponent = any;

/**
 * Loads the Google Maps API if it hasn't been loaded already
 * @returns A promise that resolves when the API is loaded
 */
export function loadGoogleMapsApi(): Promise<void> {
  // If already loaded, return resolved promise
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    isLoaded = true;
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      // If script exists but API not loaded, wait for it
      const checkIfLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkIfLoaded);
          isLoaded = true;
          resolve();
        }
      }, 100);
      
      // Set timeout to prevent infinite waiting
      setTimeout(() => {
        clearInterval(checkIfLoaded);
        if (!isLoaded) {
          reject(new Error('Google Maps API failed to load within timeout period'));
        }
      }, 10000);
      
      return;
    }

    // Define callback function
    const callbackName = 'googleMapsApiLoaded';
    // Set callback on window object
    (window as any)[callbackName] = () => {
      isLoaded = true;
      
      // Add styles immediately after loading
      addAutocompleteStyles();
      
      resolve();
      // Clean up - use optional chaining to avoid linter error
      if ((window as any)[callbackName]) {
        delete (window as any)[callbackName];
      }
    };

    // Create and add the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Error handler
    script.onerror = (error) => {
      isLoading = false;
      loadPromise = null;
      console.error('Error loading Google Maps API script:', error);
      reject(new Error('Failed to load Google Maps API'));
    };

    // Add custom styling for autocomplete dropdown
    const addAutocompleteStyles = () => {
      // Remove any existing styles first to avoid duplicates
      const existingStyle = document.getElementById('google-maps-autocomplete-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'google-maps-autocomplete-styles';
      style.textContent = `
        /* Base container */
        .pac-container {
          z-index: 10000000 !important;
          position: absolute !important;
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          margin-top: 0.125rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          font-family: system-ui, -apple-system, sans-serif;
          overflow: hidden;
          pointer-events: auto !important;
          transform: translateZ(0);
          width: auto !important;
          min-width: 250px;
        }
        
        /* Hide Google logo */
        .pac-logo:after {
          display: none !important;
        }
        
        /* Items in dropdown */
        .pac-item {
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          border-top: 1px solid #e2e8f0;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #1a202c;
          display: flex;
          align-items: center;
        }
        
        /* First item */
        .pac-item:first-child {
          border-top: none;
        }
        
        /* Hover state */
        .pac-item:hover {
          background-color: #EBF8FF;
        }
        
        /* Selected item */
        .pac-item-selected, 
        .pac-item-selected:hover {
          background-color: #EBF8FF;
        }
        
        /* Icons */
        .pac-icon, .pac-icon-marker {
          margin-right: 8px;
        }
        
        /* Main text */
        .pac-item-query {
          font-size: 0.875rem;
          color: #2b6cb0;
          font-weight: 500;
          margin-right: 4px;
          padding-right: 3px;
        }
        
        /* Matched text highlighting */
        .pac-matched {
          color: #3182ce;
          font-weight: 600;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .pac-container {
            background-color: #2d3748;
            border-color: #4a5568;
          }
          
          .pac-item {
            color: #e2e8f0;
            border-top: 1px solid #4a5568;
          }
          
          .pac-item:hover {
            background-color: #2c5282;
          }
          
          .pac-item-selected, 
          .pac-item-selected:hover {
            background-color: #2c5282;
          }
          
          .pac-item-query {
            color: #90cdf4;
          }
          
          .pac-matched {
            color: #63b3ed;
          }
          
          .pac-icon, .pac-icon-marker {
            filter: invert(1);
          }
        }
      `;
      document.head.appendChild(style);
      
      // Add a global click handler to prevent dropdown from closing
      if (!window.document.googleMapsClickHandlerAdded) {
        document.addEventListener('click', (e) => {
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer && pacContainer.contains(e.target as Node)) {
            e.stopPropagation();
          }
        }, true);
        window.document.googleMapsClickHandlerAdded = true;
      }
    };

    // Auth failure handler
    window.gm_authFailure = function() {
      console.error('Google Maps API authentication failed. Your API key may be invalid or missing required API activations.');
      reject(new Error('Google Maps API authentication failed'));
    };

    // Add the script to the document
    document.head.appendChild(script);
    
    // Add autocomplete styles
    addAutocompleteStyles();
  });

  return loadPromise;
}

/**
 * Apply Google Maps autocomplete styles
 * This can be called again if styles need to be refreshed
 */
export function refreshAutocompleteStyles(): void {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  // Remove any existing styles first
  const existingStyle = document.getElementById('google-maps-autocomplete-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = 'google-maps-autocomplete-styles';
  style.textContent = `
    /* Base container */
    .pac-container {
      z-index: 10000000 !important;
      position: absolute !important;
      background-color: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      margin-top: 0.125rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      pointer-events: auto !important;
      transform: translateZ(0);
      width: auto !important;
      min-width: 250px;
    }
    
    /* Hide Google logo */
    .pac-logo:after {
      display: none !important;
    }
    
    /* Items in dropdown */
    .pac-item {
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      border-top: 1px solid #e2e8f0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #1a202c;
      display: flex;
      align-items: center;
    }
    
    /* First item */
    .pac-item:first-child {
      border-top: none;
    }
    
    /* Hover state */
    .pac-item:hover {
      background-color: #EBF8FF;
    }
    
    /* Selected item */
    .pac-item-selected, 
    .pac-item-selected:hover {
      background-color: #EBF8FF;
    }
    
    /* Icons */
    .pac-icon, .pac-icon-marker {
      margin-right: 8px;
    }
    
    /* Main text */
    .pac-item-query {
      font-size: 0.875rem;
      color: #2b6cb0;
      font-weight: 500;
      margin-right: 4px;
      padding-right: 3px;
    }
    
    /* Matched text highlighting */
    .pac-matched {
      color: #3182ce;
      font-weight: 600;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .pac-container {
        background-color: #2d3748;
        border-color: #4a5568;
      }
      
      .pac-item {
        color: #e2e8f0;
        border-top: 1px solid #4a5568;
      }
      
      .pac-item:hover {
        background-color: #2c5282;
      }
      
      .pac-item-selected, 
      .pac-item-selected:hover {
        background-color: #2c5282;
      }
      
      .pac-item-query {
        color: #90cdf4;
      }
      
      .pac-matched {
        color: #63b3ed;
      }
      
      .pac-icon, .pac-icon-marker {
        filter: invert(1);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add a click handler to prevent dropdown from closing
  if (!window.document.googleMapsClickHandlerAdded) {
    document.addEventListener('click', (e) => {
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer && pacContainer.contains(e.target as Node)) {
        e.stopPropagation();
      }
    }, true);
    window.document.googleMapsClickHandlerAdded = true;
  }
}

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.google?.maps?.places;
}

/**
 * Get the Google Maps API key
 */
export function getGoogleMapsApiKey(): string {
  return GOOGLE_MAPS_API_KEY;
}

// Add extensions to Window interface for our custom properties
declare global {
  interface Document {
    googleMapsClickHandlerAdded?: boolean;
  }
}

// TypeScript type definitions for the Google Maps API
// These are based on the actual API but simplified for our use case
export interface GoogleMapsWindow extends Window {
  google: {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: {
            types?: string[];
            componentRestrictions?: { country: string };
            fields?: string[];
          }
        ) => GoogleAutocomplete;
        AutocompleteService: any;
        PlacesService: any;
      };
      Map: any;
      Marker: any;
      Geocoder: any;
    };
  };
  gm_authFailure: () => void;
  googleMapsApiLoaded: () => void;
} 