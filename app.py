from flask import Flask, jsonify, request
from flask_cors import CORS
import re
import nltk


app = Flask(__name__)
CORS(app)


def ensure_nltk_resources():
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)


def extract_flags(text: str):
    keywords = [
        "privacy", "data", "personal", "cookies", "tracking", "consent",
        "gdpr", "retention", "security", "third-party", "share", "delete"
    ]
    found = []
    lower_text = text.lower()
    for k in keywords:
        if k in lower_text:
            found.append(k)
    return found


def score_policy(text: str):
    lower_text = text.lower()
    score = 50

    positive = [
        ("gdpr", 8),
        ("consent", 8),
        ("delete", 8),
        ("security", 8),
        ("retention", 6),
        ("access", 6),
    ]
    negative = [
        ("third-party", 10),
        ("share", 8),
        ("tracking", 8),
        ("advertis", 6),
    ]

    for token, weight in positive:
        if token in lower_text:
            score += weight
    for token, weight in negative:
        if token in lower_text:
            score -= weight

    score = max(0, min(100, score))
    if score >= 75:
        status = "Good Privacy Posture"
    elif score >= 50:
        status = "Moderate Privacy Risk"
    else:
        status = "High Privacy Risk"

    return score, status


@app.route("/analyze", methods=["POST"])
def analyze():
    ensure_nltk_resources()
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    if not isinstance(text, str):
        return jsonify({"error": "Invalid text"}), 400

    tokens = nltk.word_tokenize(text)
    cleaned_text = " ".join(tokens) if tokens else re.sub(r"\s+", " ", text)

    score, status = score_policy(cleaned_text)
    flags = extract_flags(cleaned_text)
    return jsonify({
        "score": score,
        "status": status,
        "flags": flags,
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
