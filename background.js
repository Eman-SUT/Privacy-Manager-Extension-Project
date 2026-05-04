const BLOCKED_URLS = [
  "*://*.doubleclick.net/*",
  "*://*.google-analytics.com/*",
  "*://*.facebook.net/*",
  "*://*.googlesyndication.com/*",
  "*://*.adnxs.com/*"
];

function updateRules(isEnabled) {
  const ruleId = 1;
  if (isEnabled) {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: [{
        id: ruleId,
        priority: 1,
        action: { type: "block" },
        condition: { 
          urlFilter: "*", 
          domains: ["doubleclick.net", "google-analytics.com", "facebook.net"], 
          resourceTypes: ["script", "image", "xmlhttprequest"] 
        }
      }]
    });
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleId] });
  }
}


chrome.storage.onChanged.addListener((changes) => {
  if (changes.isBlockingEnabled) {
    updateRules(changes.isBlockingEnabled.newValue);
  }
});


chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    chrome.storage.local.get("trackerList", (data) => {
      const list = data.trackerList || [];
      try {
        const domain = new URL(details.url).hostname;
        if (!list.includes(domain)) {
          list.push(domain);
          chrome.storage.local.set({ trackerList: list });
        }
      } catch (e) { console.error("Invalid URL"); }
    });
  },
  { urls: BLOCKED_URLS }
);
