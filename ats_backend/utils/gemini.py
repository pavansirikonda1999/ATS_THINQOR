import requests
import json
import os
import re
from utils.prompt_builder import build_prompt

# Load API key & model
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")

# Correct Gemini 2.5 endpoint
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def extract_json(text: str):
    """Extract pure JSON from Gemini output (removes extra text)."""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("AI returned no valid JSON")
    return json.loads(match.group(0))


def _skills_set(value):
    if not value:
        return set()
    if isinstance(value, (list, tuple)):
        items = value
    else:
        items = re.split(r"[,/|]", str(value))
    return {item.strip().lower() for item in items if item.strip()}


def _fallback_screening(candidate, req, cause="Missing Gemini API"):
    """Return a deterministic screening payload when Gemini is unavailable."""
    cand_skills = _skills_set(candidate.get("skills"))
    req_skills = _skills_set(req.get("skills_required"))
    overlap = len(cand_skills & req_skills)
    required = len(req_skills) or 1

    try:
        experience = float(candidate.get("experience") or 0)
    except (TypeError, ValueError):
        experience = 0.0

    overlap_ratio = overlap / required
    score = min(100, max(20, 40 + overlap_ratio * 40 + experience * 4))

    rationale = [
        f"Matched {overlap} out of {required} required skills",
        f"Candidate experience considered at {experience} years",
    ]
    if cause:
        rationale.append(f"Score generated via fallback logic ({cause}).")

    red_flags = []
    if overlap_ratio < 0.3:
        red_flags.append("Low skill overlap with requirement")
    if experience < (req.get("experience_required") or 0):
        red_flags.append("Below required years of experience")

    if score >= 75:
        recommend = "SHORTLISTED"
    elif score <= 45:
        recommend = "REJECTED"
    else:
        recommend = "NEEDS_INTERVIEW"

    return {
        "score": round(score, 2),
        "rationale": rationale,
        "red_flags": red_flags,
        "recommend": recommend,
    }


def run_gemini_screening(candidate, req):
    """Call Gemini for candidate screening and return parsed JSON. Falls back to heuristic scoring if Gemini is unavailable."""

    # If API key is missing we fall back immediately
    if not GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY not set. Using fallback screening logic.")
        return _fallback_screening(candidate, req, cause="No API key")

    # Build prompt safely
    prompt = build_prompt(candidate, req)

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    try:
        response = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=20,
        )
    except requests.RequestException as exc:
        print("⚠️ Gemini request failed:", exc)
        return _fallback_screening(candidate, req, cause=str(exc))

    # If Gemini fails
    if response.status_code != 200:
        print("⚠️ Gemini API error:", response.status_code, response.text[:250])
        return _fallback_screening(candidate, req, cause=f"HTTP {response.status_code}")

    # Parse Gemini output
    data = response.json()

    try:
        text_output = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        print("⚠️ Gemini output parsing failed:", e)
        return _fallback_screening(candidate, req, cause="Invalid response")

    # Extract JSON inside the output
    try:
        parsed = extract_json(text_output)
        return parsed
    except Exception as e:
        print("⚠️ Gemini returned invalid JSON:", e)
        return _fallback_screening(candidate, req, cause="Invalid JSON")
