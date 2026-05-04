from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

nltk.download('punkt_tab')

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_privacy():
    data = request.json
    text = data.get('text', '').lower()

    stemmer = PorterStemmer()
    tokens = word_tokenize(text)
    stemmed = [stemmer.stem(w) for w in tokens if w.isalpha()]

    risky_categories = {
        "Data Sharing": ["share", "sell", "disclos", "affiliat", "partner", "third"],
        "Tracking":     ["track", "cooki", "beacon", "pixel", "fingerprint", "identifi"],
        "Advertising":  ["advertis", "market", "target", "personal", "promot"],
        "Sensitive":    ["locat", "biomet", "contact", "camera", "microphon", "storag"]
    }

    found_flags = {}
    for category, stems in risky_categories.items():
        hits = [w for w in stemmed if any(w.startswith(s) for s in stems)]
        if hits:
            found_flags[category] = len(hits)

    weights = {
        "Data Sharing": 25,
        "Tracking":     20,
        "Advertising":  15,
        "Sensitive":    20
    }
    deduction = sum(min(count * 5, weights[cat]) for cat, count in found_flags.items())
    score = max(0, 100 - deduction)

    if score > 80:
        status = "Excellent"
    elif score > 60:
        status = "Safe"
    elif score > 40:
        status = "Warning"
    else:
        status = "High Risk"

    return jsonify({
        "score": score,
        "flags": [f"{cat} ({cnt} mentions)" for cat, cnt in found_flags.items()],
        "status": status,
        "total_found": len(found_flags)
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
