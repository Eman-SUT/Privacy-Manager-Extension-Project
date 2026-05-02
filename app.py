import nltk
from nltk.tokenize import word_tokenize
from flask import Flask, request, jsonify
from flask_cors import CORS

nltk.download('punkt')

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data.get('text', '').lower()

    tokens = word_tokenize(text)

    risk_keywords = {
        "tracking": ["track", "cookies", "pixel", "fingerprinting"],
        "sharing": ["third-party", "partners", "share", "sell"],
        "collection": ["collect", "location", "contacts", "history"]
    }

    found_risks = []
    for category, words in risk_keywords.items():
        for word in words:
            if word in tokens:
                found_risks.append(category)
                break

    score = 100 - (len(found_risks) * 25)

    return jsonify({
        "status": "Safe ✅" if score > 75 else ("Moderate ⚠️" if score > 50 else "Risky 🚨"),
        "score": score,
        "details": f"Analysis detected potential issues in: {', '.join(found_risks)}" if found_risks else "No major risks detected."
    })

if __name__ == '__main__':
    app.run(port=5000)