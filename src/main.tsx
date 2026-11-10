import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle benign stream connection aborts from Firestore WebChannel in proxy environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason &&
      (reason.name === 'AbortError' ||
        (typeof reason.message === 'string' &&
          (reason.message.includes('signal is aborted') ||
            reason.message.includes('aborted without reason'))))
    ) {
      event.preventDefault();
      console.warn('Benign Firestore stream abort handled gracefully.');
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
