function showTab(tabId, btnId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".tab button").forEach(btn => btn.classList.remove("active-btn"));
    document.getElementById(tabId).classList.add("active");
    document.getElementById(btnId).classList.add("active-btn");
}

document.getElementById("btnTrackers").addEventListener("click", () => { 
    showTab("trackers", "btnTrackers"); 
    updateTrackerUI(); 
});
document.getElementById("btnCookies").addEventListener("click", () => { 
    showTab("cookies", "btnCookies"); 
    updateCookiesUI(); 
});
document.getElementById("btnPrivacy").addEventListener("click", () => {
    showTab("privacy", "btnPrivacy")
});
document.getElementById("btnGdpr").addEventListener("click", () => { 
    showTab("gdpr", "btnGdpr"); 
    updateGdprUI(); 
});

function updateTrackerUI() {
    chrome.runtime.sendMessage({ type: "GET_TRACKER_LIST" }, (trackerResponse) => {
        const trackers = trackerResponse?.trackerList || [];
        chrome.runtime.sendMessage({ type: "GET_BLOCKING_STATE" }, (stateResponse) => {
            const isEnabled = stateResponse?.isBlockingEnabled || false;
            const listContainer = document.getElementById("trackerList");

            if (trackers.length > 0) {
                let statusText = isEnabled ? `Blocked ${trackers.length} Trackers:` : `Detected ${trackers.length} Trackers:`;
                let html = `<p class="text-blue"> ${statusText}</p>`;

                html += `<ul class="list-container">`;
                trackers.forEach(domain => {
                    let badgeClass = isEnabled ? 'badge-blocked' : 'badge-detected';
                    let badgeText = isEnabled ? 'Blocked' : 'Detected';
                    html += `<li class="list-item"> ${domain} <span class="${badgeClass}">${badgeText}</span></li>`;
                });
                html += "</ul>";
                listContainer.innerHTML = html;
            } else {
                listContainer.innerHTML = "<p>Safe browsing. No trackers yet!</p>";
            }
        });
    });
}

async function updateCookiesUI() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.startsWith('http')) return;

    chrome.cookies.getAll({ domain: new URL(tab.url).hostname }, function(cookies) {
        const cookieList = document.getElementById("cookieList");
        if (cookies.length > 0) {
            cookieList.innerHTML = cookies.map(c => {
                const isTracking = c.name.includes('_ga') || c.name.includes('_gid') || c.name.includes('ads') || c.name.includes('track');
                const category = isTracking ? "Tracking" : "Essential";
                const badgeClass = isTracking ? "badge-blocked" : "badge-essential";

                return `
                <div class="list-item">
                    <strong class="text-blue">${c.name}</strong> 
                    <span class="cookie-category ${badgeClass}">${category}</span>
                    <div class="cookie-value">${c.value.substring(0, 40)}...</div>
                </div>`;
            }).join('');
        } else {
            cookieList.innerHTML = "<p>No cookies found for this site.</p>";
        }
    });
}

document.getElementById("clearCookies").addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let url = new URL(tabs[0].url);
        chrome.cookies.getAll({domain: url.hostname}, function(cookies) {
            cookies.forEach(cookie => chrome.cookies.remove({ url: tabs[0].url, name: cookie.name }));
            alert("All cookies cleared!");
            updateCookiesUI();
        });
    });
});

document.getElementById("analyzePolicy").addEventListener("click", async () => {
    const resultDiv = document.getElementById("nlpResult");
    resultDiv.innerHTML = "<p class='text-blue'>Analyzing policy text...</p>";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => document.body.innerText }, async (results) => {
        try {
            const response = await fetch("http://localhost:5000/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: (results?.[0]?.result || "").substring(0, 8000) })
            });

            if (!response.ok) {
                throw new Error("Server response failed");
            }

            const data = await response.json();

            resultDiv.innerHTML = `
                <div class="nlp-result-box">
                    <strong class="text-blue">Privacy Score: ${data.score}%</strong><br>
                    <strong>Status:</strong> ${data.status}<br>
                    <strong>Key Terms:</strong> ${data.flags.join(", ") || "None"}
                </div>`;
        } catch (e) {
            resultDiv.innerHTML = "<p style='color: red;'>Error: Python server is not running!</p>";
        }
    });
});

async function updateGdprUI() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const siteName = new URL(tab.url).hostname;
    const container = document.getElementById("gdprOptions");
    
    container.innerHTML = `<p class="site-info">Actions for: <strong>${siteName}</strong></p>`;

    const sarBtn = document.createElement("button");
    sarBtn.className = "btn-outline-primary";
    sarBtn.innerHTML = "Copy Access Request (SAR)";
    sarBtn.onclick = () => { 
        navigator.clipboard.writeText(
`Subject: GDPR Article 15 - Data Subject Access Request

To the Data Protection Officer at ${siteName},

I am writing to request access to all personal data you hold about me,
in accordance with Article 15 of the GDPR.

Please provide:
1. Categories of data processed
2. Purposes of processing
3. Any third parties data is shared with
4. Retention period

I expect your response within 30 days.

Regards`
        );
        alert("SAR Template Copied!");
    };

    const delBtn = document.createElement("button");
    delBtn.className = "btn-outline-primary";
    delBtn.innerHTML = "Copy Deletion Request";
    delBtn.onclick = () => { 
        navigator.clipboard.writeText(
`Subject: GDPR Article 17 - Right to Erasure Request

To the Data Protection Officer at ${siteName},

I request the immediate erasure of all personal data you hold about me,
under Article 17 of the GDPR (Right to be Forgotten).

Please confirm deletion within 30 days.

Regards`
        );
        alert("Deletion Template Copied!");
    };

    container.appendChild(sarBtn);
    container.appendChild(delBtn);
}

document.addEventListener('DOMContentLoaded', () => {
    const blockingToggle = document.getElementById("blockingToggle");
    
    chrome.runtime.sendMessage({ type: "GET_BLOCKING_STATE" }, (response) => {
        blockingToggle.checked = response?.isBlockingEnabled || false;
    });

    blockingToggle.addEventListener("change", () => {
        chrome.runtime.sendMessage(
            { type: "SET_BLOCKING_STATE", isBlockingEnabled: blockingToggle.checked },
            () => updateTrackerUI()
        );
    });

    showTab("trackers", "btnTrackers");
    updateTrackerUI();
});
