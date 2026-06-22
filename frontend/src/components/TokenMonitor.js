import { useEffect } from 'react';

const TOKEN_THRESHOLD = 18000; // Refresh at 18k tokens
const CHECK_INTERVAL = 30000; // Check every 30 seconds

export default function TokenMonitor() {
  useEffect(() => {
    const checkTokens = () => {
      // Look for text containing "TOTAL" to find token count
      const allElements = document.querySelectorAll('*');
      let currentTokens = 0;
      
      for (const el of allElements) {
        const text = el.textContent;
        if (text && text.includes('TOTAL')) {
          const match = text.match(/(\d+)\s*TOTAL/);
          if (match) {
            currentTokens = parseInt(match[1], 10);
            break;
          }
        }
      }
      
      if (!currentTokens) return;
      
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
