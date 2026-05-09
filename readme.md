Privacy Guard – Chrome Extension
Team Members
Mohamed Essam Mohamed Hassanin — ID: 250101035
Eman Hesham Soliman — ID: 230103682
Rania Hesham Soliman — ID: 230103687
Project Description
A Chrome browser extension that protects users' personal data while browsing through:
Tracker Detection & Blocking
Cookie Management
Fingerprinting Prevention
Page Text Analysis using Natural Language Processing (NLP) with NLTK
Personal Data Inventory
Generating GDPR Legal Request Templates

Installing the Required Libraries
pip install flask nltk flask-cors

Running the Server
python app.py

Extension Setup
Go to: `chrome://extensions/`
Enable Developer Mode
Click: Load unpacked
Select the folder that contains the project files
User Manual
Tracker Blocking
The extension works automatically as soon as you visit any website. It compares all outgoing requests against the bundled `easyprivacy.txt` file and blocks any request coming from a known tracker domain. Detected and blocked domains are stored locally in IndexedDB and displayed inside the extension. Blocking can be enabled or disabled at any time using the toggle in the extension popup.
Cookie Manager
Open the extension on any website to view all cookies associated with that site. Cookies are classified by keyword matching on the cookie name — any cookie whose name contains `_ga`, `_gid`, `ads`, or `track` is labeled as Tracking; everything else is labeled as Essential. A "Clear All Cookies" button removes every cookie for the current site at once.
Fingerprinting Prevention
The extension automatically protects against four types of browser fingerprinting:
Canvas Fingerprinting — modifies pixel data before it is read by trackers
WebGL Fingerprinting — returns generic vendor and renderer values
AudioContext Fingerprinting — adds minor random noise to frequency data
Navigator Properties — spoofs `hardwareConcurrency`, `deviceMemory`, and `platform`
NLP Analysis
Open the extension on any privacy policy page and click the "Extract & Analyze Terms" button. The extension extracts the full text from the page and sends it to the Python backend running on `localhost:5000`. The server tokenizes the text using NLTK and returns a privacy score from 0 to 100. The score starts at 50 and increases when privacy-positive keywords are found (e.g. `gdpr`, `consent`, `delete`, `security`) and decreases when privacy-negative keywords are found (e.g. `tracking`, `third-party`, `share`, `advertis`). The result is displayed as a score, a status label, and a list of matched keywords.
Personal Data Inventory
Open the extension on any website and go to the Data Inventory tab. The extension scans cookies and detected trackers to build a categorized inventory of personal data being collected, each with a risk level:
Behavioral Data — HIGH RISK — from tracking cookies (`_ga`, `_gid`, `ads`, `track`)
Identity Data — MEDIUM RISK — from session and user cookies
Preference Data — LOW RISK — from language and preference cookies
Tracking Pixels & APIs — HIGH RISK — from detected third-party tracker domains
GDPR Templates
Open the extension on any website and go to the GDPR SAR tab. The extension auto-fills the current site's domain into two ready-made legal templates:
Subject Access Request (SAR) — based on GDPR Article 15, requests all personal data the site holds about you.
Deletion Request — based on GDPR Article 17 (Right to be Forgotten), requests immediate erasure of all your personal data.
Both templates can be copied to clipboard and sent via email to the site's Data Protection Officer.
Technology Stack
Frontend: HTML5, CSS3, JavaScript, WebExtensions API (Manifest V3)
Chrome APIs: declarativeNetRequest, webRequest, cookies, scripting, storage, tabs
Storage: IndexedDB — stores tracker lists and blocking state locally
Backend: Python, Flask, Flask-CORS
NLP: NLTK (Natural Language Toolkit) — tokenization and keyword-based privacy scoring
Data Source: EasyPrivacy list (bundled `easyprivacy.txt`)
