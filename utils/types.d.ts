// Google Maps API global declarations
interface Window {
  google?: any;
  gm_authFailure?: () => void;
  googleMapsApiLoaded?: () => void;
  initPlacesAPI?: () => void;
} 