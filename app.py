from flask import Flask, jsonify, request
from flask_cors import CORS
import nltk
from nltk.tokenize import word_tokenize
 
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)
 
app = Flask(__name__)
CORS(app)
 
POSITIVE_KEYWORDS = [
    "gdpr", "consent", "delete", "security", "encrypt",
    "protect", "anonymize", "opt-out", "transparent", "rights"
]
 
NEGATIVE_KEYWORDS = [
    "tracking", "third-party", "share", "advertis", "collect",
    "monitor", "profil", "sell", "retain", "disclose"
]
 
 
def score_policy(text: str):
    tokens = word_tokenize(text.lower())
 
    positive_hits = [t for t in tokens if any(t.startswith(k) for k in POSITIVE_KEYWORDS)]
    negative_hits = [t for t in tokens if any(t.startswith(k) for k in NEGATIVE_KEYWORDS)]
 
    score = 50
    score += len(set(positive_hits)) * 5
    score -= len(set(negative_hits)) * 5
    score = max(0, min(100, score))
 
    if score >= 70:
        status = "Good Privacy Posture"
    elif score >= 40:
        status = "Moderate Privacy Risk"
    else:
        status = "High Privacy Risk"
 
    return score, status
 
 
def extract_flags(text: str):
    keywords = [
        "privacy", "data", "personal", "cookies", "tracking",
        "consent", "gdpr", "retention", "security",
        "third-party", "share", "delete"
    ]
    lower_text = text.lower()
    return [k for k in keywords if k in lower_text]
 
 
@app.route("/analyze", methods=["POST"])
def analyze():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    if not isinstance(text, str):
        return jsonify({"error": "Invalid text"}), 400
 
    score, status = score_policy(text)
    flags = extract_flags(text)
    return jsonify({
        "score": score,
        "status": status,
        "flags": flags,
    })
 
 
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
 
