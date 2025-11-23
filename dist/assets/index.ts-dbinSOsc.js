console.log("[Auto-Flow Background] Service worker started");chrome.runtime.onMessage.addListener((e,r,o)=>(console.log("[Auto-Flow Background] Received message:",e),o({received:!0}),!0));
