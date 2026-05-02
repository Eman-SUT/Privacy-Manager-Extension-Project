let detectedTrackers = {};

const trackerKeywords = ["google-analytics", "doubleclick", "facebook.net", "adsystem", "analytics"];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    const tabId = details.tabId;

    trackerKeywords.forEach(keyword => {
      if (url.includes(keyword)) {
        if (!detectedTrackers[tabId]) {
          detectedTrackers[tabId] = new Set();
        }
        detectedTrackers[tabId].add(keyword);
      }
    });
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scan") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      const trackers = detectedTrackers[activeTabId] ? Array.from(detectedTrackers[activeTabId]) : [];
      
      sendResponse({
        message: "Scan Complete!",
        trackers: trackers
      });
    });
    return true; 
  }
});