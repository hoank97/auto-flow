// Side panel opens automatically via manifest.json configuration
// No need for manual tab creation

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Simple message relay - forward messages between popup and content scripts
chrome.runtime.onMessage.addListener((_message, _sender, sendResponse) => {

  // Just acknowledge - content script communication is direct
  sendResponse({ received: true });
  return true;
});
