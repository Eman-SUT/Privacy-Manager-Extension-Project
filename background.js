let detectedTrackers = {};

// قايمة بسيطة للـ Trackers المشهورة
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

// استقبال الرسائل من الـ Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scan") {
    // هنجيب الـ ID بتاع الصفحة اللي إنتي واقفة عليها دلوقتي
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id;
      const trackers = detectedTrackers[activeTabId] ? Array.from(detectedTrackers[activeTabId]) : [];
      
      sendResponse({
        message: "Scan Complete!",
        trackers: trackers
      });
    });
    return true; // ضروري عشان الـ asynchronous response
  }
});