console.log('[Auto-Flow Background] Service worker started');

// Simple message relay - forward messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Auto-Flow Background] Received message:', message);
  
  // Just acknowledge - content script communication is direct
  sendResponse({ received: true });
  return true;
});
