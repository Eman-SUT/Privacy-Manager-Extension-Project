team members:
1: name: Mohamed Essam Mohamed Hassanin. ID: 250101035.
2: name: Eman Hesham Soliman. ID: 230103682.
3: name: Rania Hesham Soliman. ID: 230103687.

Project Description: A Chrome browser extension designed to protect users' privacy while browsing through:
Tracker Blocking.
Cookie Management.
Privacy Policy Analysis using Natural Language Processing (NLP).
Generating GDPR Subject Access Request (SAR) Templates.

Installing the Required Libraries:
pip install flask nltk flask-corsز

Running the Server:
python app.py.

Extension Setup:
1.Go to: chrome://extensions/.
2.Enable Developer Mode.
3.Click the: Load unpacked.
4.Select the folder that contains the project files.

User Manual:
Tracker Blocking: The extension works automatically when visiting any website. It compares website requests with the easyprivacy.txt file and blocks any suspicious tracking attempts.
NLP Analysis: When opening the “Privacy Policy” page of any website, open the extension and click the “Analyze” button. The Python backend server will analyze the text and provide a Privacy Grade based on how well the website respects user privacy.
Cookie Management: Through the extension interface, you can view the list of cookies associated with the currently opened website and clear them all at once.
GDPR Templates: The “GDPR SAR” section provides ready-made templates for data deletion requests or data access requests. You can copy and send them via email to websites.

Technology Stack:
Frontend: HTML5, CSS, JavaScript, WebExtensions API.
Storage: IndexedDB To save blocking status and tracking lists locally.
Backend: Python using the Flask framework to provide an API, and Natural Language Toolkit (NLTK) for text analysis.