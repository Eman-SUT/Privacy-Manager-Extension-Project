const EASYPRIVACY_FILE = "easyprivacy.txt";
const EASYPRIVACY_STORAGE_KEY = "easyPrivacyDomains";
const BLOCKING_STATE_KEY = "isBlockingEnabled";
const TRACKER_LIST_KEY = "trackerList";
const DB_NAME = "privacyGuardDB";
const DB_VERSION = 1;
const STORE_NAME = "appData";
const RULE_ID_START = 1000;
const RULE_ID_END = 2999;
const TRACKER_RULE_ID_END = 2998;
const DOMAINS_PER_RULE = 5000;
const THIRD_PARTY_COOKIE_RULE_ID = 2999;

let easyPrivacyDomainSet = new Set();
let trackerDomainSet = new Set();

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const request = tx.objectStore(STORE_NAME).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function parseEasyPrivacyDomains(content) {
  const domains = new Set();
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("!") || line.startsWith("[")) continue;
    const match = line.match(/^\|\|([a-z0-9.-]+\.[a-z]{2,})\^/i);
    if (match) domains.add(match[1].toLowerCase());
  }
  return Array.from(domains);
}

function setEasyPrivacyDomainsCache(domains) {
  const safeDomains = Array.isArray(domains) ? domains : [];
  easyPrivacyDomainSet = new Set(safeDomains);
}

function isTrackerDomain(hostname) {
  for (const domain of easyPrivacyDomainSet) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) return true;
  }
  return false;
}

async function getDynamicRules() {
  return new Promise((resolve) => {
    chrome.declarativeNetRequest.getDynamicRules((rules) => resolve(rules || []));
  });
}

async function updateDynamicRules(removeRuleIds, addRules) {
  return new Promise((resolve, reject) => {
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds, addRules },
      () => {
        const err = chrome.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve();
      }
    );
  });
}

async function clearManagedRules() {
  const rules = await getDynamicRules();
  const managedRuleIds = rules
    .map((rule) => rule.id)
    .filter((id) => id >= RULE_ID_START && id <= RULE_ID_END);
  if (managedRuleIds.length > 0) {
    await updateDynamicRules(managedRuleIds, []);
  }
}

async function loadEasyPrivacyDomains() {
  try {
    const response = await fetch(chrome.runtime.getURL(EASYPRIVACY_FILE));
    const text = await response.text();
    const domains = parseEasyPrivacyDomains(text);
    await idbSet(EASYPRIVACY_STORAGE_KEY, domains);
    setEasyPrivacyDomainsCache(domains);
  } catch (error) {
    console.error("Failed to load EasyPrivacy list:", error);
  }
}

async function ensureTrackerListLoaded() {
  const stored = await idbGet(TRACKER_LIST_KEY);
  if (Array.isArray(stored)) {
    trackerDomainSet = new Set(stored);
    return;
  }
  chrome.storage.local.get(TRACKER_LIST_KEY, async (data) => {
    const legacy = Array.isArray(data?.trackerList) ? data.trackerList : [];
    trackerDomainSet = new Set(legacy);
    await idbSet(TRACKER_LIST_KEY, Array.from(trackerDomainSet));
  });
}

async function saveTrackerDomain(domain) {
  if (trackerDomainSet.has(domain)) return;
  trackerDomainSet.add(domain);
  await idbSet(TRACKER_LIST_KEY, Array.from(trackerDomainSet));
}

async function updateRules(isEnabled) {
  try {
    if (!isEnabled) {
      await clearManagedRules();
      return;
    }

    const domains = await idbGet(EASYPRIVACY_STORAGE_KEY);
    const safeDomains = Array.isArray(domains) ? domains : [];
    setEasyPrivacyDomainsCache(safeDomains);

    const maxDomains = DOMAINS_PER_RULE * (TRACKER_RULE_ID_END - RULE_ID_START + 1);
    const appliedDomains = safeDomains.slice(0, maxDomains);
    const chunks = [];
    for (let i = 0; i < appliedDomains.length; i += DOMAINS_PER_RULE) {
      chunks.push(appliedDomains.slice(i, i + DOMAINS_PER_RULE));
    }

    const addRules = chunks.map((domainsChunk, idx) => ({
      id: RULE_ID_START + idx,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: "*",
        requestDomains: domainsChunk,
        resourceTypes: ["script", "image", "xmlhttprequest"]
      }
    }));

    addRules.push({
      id: THIRD_PARTY_COOKIE_RULE_ID,
      priority: 2,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "set-cookie", operation: "remove" }
        ]
      },
      condition: {
        urlFilter: "*",
        domainType: "thirdParty",
        resourceTypes: ["sub_frame", "script", "image", "xmlhttprequest"]
      }
    });

    console.info(
      `[EasyPrivacy] Applying ${appliedDomains.length} of ${safeDomains.length} domains across ${addRules.length} dynamic rule(s).`
    );

    await clearManagedRules();
    if (addRules.length > 0) {
      await updateDynamicRules([], addRules);
    }
  } catch (error) {
    console.error("Failed to update DNR rules:", error);
    await clearManagedRules();
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_BLOCKING_STATE") {
    idbGet(BLOCKING_STATE_KEY)
      .then((isEnabled) => sendResponse({ isBlockingEnabled: Boolean(isEnabled) }))
      .catch(() => sendResponse({ isBlockingEnabled: false }));
    return true;
  }

  if (message?.type === "SET_BLOCKING_STATE") {
    const isEnabled = Boolean(message.isBlockingEnabled);
    idbSet(BLOCKING_STATE_KEY, isEnabled)
      .then(() => updateRules(isEnabled))
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Failed to save blocking state to IndexedDB:", error);
        sendResponse({ success: false });
      });
    return true;
  }

  if (message?.type === "GET_TRACKER_LIST") {
    idbGet(TRACKER_LIST_KEY)
      .then((list) => sendResponse({ trackerList: Array.isArray(list) ? list : [] }))
      .catch(() => sendResponse({ trackerList: [] }));
    return true;
  }
});

Promise.all([loadEasyPrivacyDomains(), ensureTrackerListLoaded()])
  .then(() => idbGet(BLOCKING_STATE_KEY))
  .then((isEnabled) => updateRules(Boolean(isEnabled)))
  .catch(() => updateRules(false));

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const domain = new URL(details.url).hostname;
      if (!isTrackerDomain(domain)) return;
      saveTrackerDomain(domain).catch((error) => {
        console.error("Failed to save tracker domain:", error);
      });
    } catch (_error) {
    }
  },
  { urls: ["<all_urls>"] }
);
