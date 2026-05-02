function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-tab');
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            const targetElement = document.getElementById(target);
            if (targetElement) targetElement.classList.add('active');
        });
    });
}
document.addEventListener('DOMContentLoaded', setupTabs);

document.getElementById("scanBtn").addEventListener("click", () => {
    const displayArea = document.getElementById("content");
    displayArea.innerHTML = "<p>Scanning... please wait.</p>";
    chrome.runtime.sendMessage({ action: "scan" }, (response) => {
        if (chrome.runtime.lastError) {
            displayArea.innerHTML = "<p style='color:red;'>Error connecting to background script.</p>";
            return;
        }
        if (response && response.trackers && response.trackers.length > 0) {
            displayArea.innerHTML = `<h4>Found ${response.trackers.length} Trackers:</h4><ul>`;
            response.trackers.forEach(t => displayArea.innerHTML += `<li>${t}</li>`);
            displayArea.innerHTML += "</ul>";
        } else {
            displayArea.innerHTML = "<p>No trackers detected. Try refreshing the target page!</p>";
        }
    });
});

document.getElementById("cookieBtn").addEventListener("click", () => {
    const cookieArea = document.getElementById("cookieList");
    cookieArea.innerHTML = "<p>Fetching cookies...</p>";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.url) return;
        chrome.cookies.getAll({ url: activeTab.url }, (cookies) => {
            if (cookies && cookies.length > 0) {
                cookieArea.innerHTML = `<h4>Found ${cookies.length} Cookies:</h4><ul>`;
                const categories = {'_ga': 'Analytics', '_gid': 'Analytics', '_fbp': 'Marketing', 'session_id': 'Essential'};
                cookies.forEach(c => {
                    let cat = categories[c.name] || 'General/Third-Party';
                    let col = cat === 'Essential' ? 'green' : (cat === 'Analytics' ? 'blue' : 'orange');
                    cookieArea.innerHTML += `<li><b>${c.name}</b> <span style="color:${col}; font-size:10px;">[${cat}]</span></li>`;
                });
                cookieArea.innerHTML += "</ul>";
            } else {
                cookieArea.innerHTML = "<p>No cookies found for this site.</p>";
            }
        });
    });
});

document.getElementById("clearCookiesBtn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = new URL(tabs[0].url);
        chrome.cookies.getAll({ domain: url.hostname }, (cookies) => {
            cookies.forEach((c) => {
                const protocol = c.secure ? "https://" : "http://";
                const domain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
                chrome.cookies.remove({ url: `${protocol}${domain}${c.path}`, name: c.name });
            });
            document.getElementById("cookieList").innerHTML = "<p style='color: #34a853;'>All cookies cleared! ✅</p>";
        });
    });
});

document.getElementById("analyzeBtn").addEventListener("click", async () => {
    const privacyArea = document.getElementById("privacyTab") || document.getElementById("privacyTabContent");
    if (!privacyArea) return;
    privacyArea.innerHTML = "<p>Analyzing policy text... please wait.</p>";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText, 
    }, (results) => {
        if (!results || !results[0]) {
            privacyArea.innerHTML = "<p style='color:red;'>Failed to get text.</p>";
            return;
        }
        fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: results[0].result.substring(0, 5000) })
        })
        .then(res => res.json())
        .then(data => {
            let blueColor = "#1a73e8"; 
            let finalScore = (data.score !== undefined && data.score !== null) ? data.score : 100;
            privacyArea.innerHTML = `
                <h4 style="color: ${blueColor};">${data.status}</h4>
                <div style="background: #e0e0e0; border-radius: 10px; height: 12px; width: 100%; overflow: hidden; margin-bottom: 10px;">
                    <div style="background: ${blueColor}; height: 100%; width: ${finalScore}%; transition: width 0.5s ease-in-out;"></div>
                </div>
                <p><b>Trust Score:</b> ${finalScore}%</p>
                <p style="font-size: 12px; color: #555;"><b>Details:</b> ${data.details}</p>`;
        })
        .catch(err => privacyArea.innerHTML = "<p style='color:red;'>Make sure Flask is running.</p>");
    });
});

const templates = {
    access: "Subject Access Request: I am requesting access to all personal data you hold about me under Article 15 of the GDPR...",
    delete: "Right to Erasure: I am requesting that you delete all personal data you hold about me under Article 17 of the GDPR..."
};
const templateSelect = document.getElementById("templateSelect");
const templateArea = document.getElementById("templateArea");
if (templateSelect && templateArea) {
    templateSelect.addEventListener("change", (e) => templateArea.value = templates[e.target.value]);
    templateArea.value = templates.access;
}
document.getElementById("copyTemplateBtn")?.addEventListener("click", () => {
    templateArea.select();
    document.execCommand("copy");
    alert("Template copied!");
});