// Global error handler for unhandled errors
export const setupGlobalErrorHandlers = () => {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console.error to filter out specific errors
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    
    // Suppress WebSocket connection errors
    if (errorString.includes('WebSocket connection') || 
        errorString.includes('wss://fra.cloud.appwrite.io') ||
        errorString.includes('channels%5B%5D=error')) {
      return;
    }
    
    // Suppress 401 unauthorized errors (expected when not logged in)
    if (errorString.includes('401') && errorString.includes('Unauthorized')) {
      return;
    }
    
    // Call original error for other errors
    originalError.apply(console, args);
  };

  // Override console.warn to filter out warnings
  console.warn = (...args: any[]) => {
    const warnString = args.join(' ');
    
    // Suppress WebSocket warnings
    if (warnString.includes('WebSocket') || 
        warnString.includes('realtime') ||
        warnString.includes('wss://')) {
      return;
    }
    
    // Call original warn for other warnings
    originalWarn.apply(console, args);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.toString() || '';
    
    // Suppress specific errors
    if (errorMessage.includes('removeChild') || 
        errorMessage.includes('NotFoundError') ||
        errorMessage.includes('Failed to execute') ||
        errorMessage.includes('WebSocket connection') ||
        errorMessage.includes('WebSocket') ||
        errorMessage.includes('wss://') ||
        errorMessage.includes('realtime') ||
        errorMessage.includes('feature_collector') ||
        errorMessage.includes('using deprecated parameters') ||
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized')) {
      event.preventDefault();
      return;
    }
    
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const errorMessage = event.error?.toString() || event.message || '';
    
    // Suppress specific React DOM errors during hot reload
    if (errorMessage.includes('removeChild') || 
        errorMessage.includes('NotFoundError') ||
        errorMessage.includes('Failed to execute') ||
        errorMessage.includes('WebSocket') ||
        errorMessage.includes('wss://') ||
        errorMessage.includes('realtime')) {
      event.preventDefault();
      return;
    }
    
    console.error('Uncaught error:', event.error);
    event.preventDefault();
  });

  // Suppress performance violations
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    const logString = args.join(' ');
    
    // Suppress reflow violations
    if (logString.includes('Violation') || 
        logString.includes('Forced reflow') ||
        logString.includes('[Violation]')) {
      return;
    }
    
    originalLog.apply(console, args);
  };

  // Globally suppress console output in the app (logs, warns, infos, debugs, errors)
  // This is intentional to keep the UI console clean in production/demo environments.
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.debug = () => {};
  console.error = () => {};
};

// Initialize error handlers
setupGlobalErrorHandlers();
