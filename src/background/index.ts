

// Simple message relay - forward messages between popup and content scripts
chrome.runtime.onMessage.addListener((_message, _sender, sendResponse) => {

  // Just acknowledge - content script communication is direct
  sendResponse({ received: true });
  return true;
});
