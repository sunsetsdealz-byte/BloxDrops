import { useEffect } from 'react';

const TOKEN_THRESHOLD = 18000; // Refresh at 18k tokens
const CHECK_INTERVAL = 30000; // Check every 30 seconds

export default function TokenMonitor() {
  useEffect(() => {
    const checkTokens = () => {
      const tokenDisplay = document.querySelector('[data-testid="token-count"]');
      if (!tokenDisplay) return;

      const text = tokenDisplay.textContent;
      const match = text.match(/(\d+)/);
      if (!match) return;

      const currentTokens = parseInt(match[1], 10);
      
      if (currentTokens >= TOKEN_THRESHOLD) {
        sessionStorage.setItem('autoRefreshTriggered', Date.now().toString());
        window.location.reload();
      }
    };

    const interval = setInterval(checkTokens, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return null;
}
