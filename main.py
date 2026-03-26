import os
import base64
from typing import Optional

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="KisanSetu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise the Anthropic client (reads ANTHROPIC_API_KEY from env automatically)
client = anthropic.Anthropic()

MODEL = "claude-sonnet-4-5"

# ---------------------------------------------------------------------------
# Mock data
# ---------------------------------------------------------------------------

WEATHER_DATA = {
    "temp": 21,
    "humidity": 76,
    "rain": 68,
    "ndvi": 0.61,
    "soilMoisture": 58,
    "soilStatus": "good",
}

MANDI_DATA = [
    {"crop": "Paddy",     "price": 2183, "change": +2.4,  "unit": "quintal"},
    {"crop": "Wheat",     "price": 2275, "change": -0.8,  "unit": "quintal"},
    {"crop": "Cotton",    "price": 6540, "change": +1.1,  "unit": "quintal"},
    {"crop": "Onion",     "price": 1820, "change": -3.2,  "unit": "quintal"},
    {"crop": "Tomato",    "price": 980,  "change": +5.7,  "unit": "quintal"},
    {"crop": "Soybean",   "price": 4250, "change": +0.3,  "unit": "quintal"},
    {"crop": "Sugarcane", "price": 315,  "change": 0.0,   "unit": "quintal"},
    {"crop": "Maize",     "price": 1895, "change": +1.9,  "unit": "quintal"},
]

# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class AdvisoryRequest(BaseModel):
    query: str
    crop: str
    language: str = "English"
    weather: Optional[dict] = None

class ScanRequest(BaseModel):
    image_base64: str          # raw base64 string (no data-URI prefix)
    language: str = "English"
    media_type: str = "image/jpeg"  # e.g. image/jpeg, image/png

class YieldRequest(BaseModel):
    crop: str
    area: float                # in acres
    language: str = "English"

# ---------------------------------------------------------------------------
# Helper – system prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are an expert Indian agricultural extension officer with 20+ years of field "
    "experience across multiple Indian states. You advise smallholder farmers in simple, "
    "practical language. Always ground your advice in local Indian agronomic practices, "
    "government schemes (PM-Kisan, PMFBY, e-NAM, etc.), and realistic input availability. "
    "Never suggest inputs unavailable in rural India. Be empathetic and concise."
)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/dashboard-data")
def get_dashboard_data():
    """Return weather snapshot and mandi prices for the dashboard."""
    return {
        "weather": WEATHER_DATA,
        "mandi": MANDI_DATA,
    }


@app.post("/api/advisory")
def post_advisory(req: AdvisoryRequest):
    """
    Accept a farmer query and return a 3-sentence advisory from Claude.
    """
    weather_ctx = ""
    if req.weather:
        w = req.weather
        weather_ctx = (
            f"\nCurrent field conditions – Temperature: {w.get('temp', 'N/A')}°C, "
            f"Humidity: {w.get('humidity', 'N/A')}%, "
            f"Rain probability: {w.get('rain', 'N/A')}%, "
            f"NDVI: {w.get('ndvi', 'N/A')}, "
            f"Soil moisture: {w.get('soilMoisture', 'N/A')}%, "
            f"Soil status: {w.get('soilStatus', 'N/A')}."
        )

    user_message = (
        f"Crop: {req.crop}"
        f"{weather_ctx}\n\n"
        f"Farmer's question: {req.query}\n\n"
        f"Reply in {req.language} in exactly 3 concise sentences."
    )

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        advisory_text = response.content[0].text
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}")

    return {"advisory": advisory_text}


@app.post("/api/scan")
def post_scan(req: ScanRequest):
    """
    Accept a base64-encoded leaf image and return a crop disease diagnosis.
    """
    # Validate base64
    try:
        base64.b64decode(req.image_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid base64 image data.")

    user_message_content = [
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": req.media_type,
                "data": req.image_base64,
            },
        },
        {
            "type": "text",
            "text": (
                "Examine this crop leaf image carefully. "
                "Identify any disease, pest damage, or nutrient deficiency visible. "
                "Provide: (1) Diagnosis name, (2) Confidence level (high/medium/low), "
                "(3) Two practical treatment steps using inputs commonly available in rural India. "
                f"Reply in {req.language}."
            ),
        },
    ]

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message_content}],
        )
        diagnosis = response.content[0].text
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}")

    return {"diagnosis": diagnosis}


@app.post("/api/yield")
def post_yield(req: YieldRequest):
    """
    Accept crop and area, return a yield estimate with season-specific advice.
    """
    user_message = (
        f"Crop: {req.crop}\n"
        f"Area: {req.area} acres\n\n"
        "Provide a realistic yield estimate for average Indian farming conditions. "
        "Include: (1) Expected yield range (low / average / high) in quintals for this area, "
        "(2) Key factor that most influences yield for this crop, "
        "(3) One quick tip to push yield toward the high end. "
        f"Reply in {req.language} in 3–4 sentences."
    )

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        estimate = response.content[0].text
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc}")

    return {"estimate": estimate}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
