Team name: Git happens
Team project: Kisansetu
# 🌾 KisanSetu — किसान सेतु

### *The AI-powered bridge between India's farmers and the information they need to thrive.*

> **"Sow smarter. Harvest more. Worry less."**


---

## 📖 Table of Contents

- [💡 The Problem & The Solution](#-the-problem--the-solution)
- [✨ Key Features](#-key-features)
- [🛠 Architecture & Tech Stack](#-architecture--tech-stack)
- [🚀 Getting Started (Local Setup)](#-getting-started-local-setup)
- [💻 Usage / Demonstration](#-usagedemonstration)
- [🧠 Challenges Faced & Learnings](#-challenges-faced--learnings)
- [🔮 Future Roadmap](#-future-roadmap)
- [🤝 Contributors & Team](#-contributors--team)
- [📄 License](#-license)

---

## 💡 The Problem & The Solution

### The Problem

India has **140+ million farming households**. The vast majority operate smallholder farms — and make critical decisions about irrigation, fertiliser, pest treatment, and when to sell at market with little more than intuition and word of mouth.

The consequences are severe:
- 🦟 **Crop losses of 15–25%** annually from undiagnosed pests and diseases
- 📉 **Missed market windows** because farmers lack real-time mandi (wholesale market) prices
- 🌦️ **Weather-driven failures** from poor access to hyperlocal forecasts
- 🗣️ **Language barriers** — most agri-tech tools are English-only, excluding the very farmers who need them most

The result? A farmer in Solapur with 2 acres of paddy and a wilting leaf cannot tell whether it's bacterial blight or nitrogen deficiency — and may lose half their crop before they find out.

### The Solution

**KisanSetu** (Sanskrit: *किसान सेतु*, literally "Bridge for Farmers") is a full-stack AI platform that puts agronomist-grade intelligence into a farmer's palm — in their own language, optimised for a ₹8,000 Android phone under bright sunlight.

> 💡 **The "Aha!" moment:** A farmer snaps a photo of a diseased leaf, speaks a question in Hindi, and in seconds receives a diagnosis, a treatment plan, the current mandi price for their crop, and a yield forecast — all in one screen, without needing to read English or navigate complex menus.

The key differentiators:
- **Voice-first UX** — designed for low-literacy users; the prominent voice FAB is the primary interaction mode
- **Truly multilingual** — full Hindi and English support with fallback to system fonts for Marathi and Kannada (Noto Sans Devanagari/Kannada)
- **Offline-tolerant design** — critical UI remains functional under poor connectivity
- **100% tested** — 16/16 backend API tests passing at launch

---

## ✨ Key Features

> Features are listed from the farmer's perspective — what they *experience*, not just what the code *does*.

| # | Feature | What it means for the farmer |
|---|---------|-------------------------------|
| 🎙️ | **Voice-First Advisory** | Ask a farming question by voice in Hindi or English — no typing required. Get an AI-generated answer in your language within seconds. |
| 📸 | **Pest & Disease Scan** | Point your camera at a sick leaf. KisanSetu identifies the problem and recommends treatment — like having a plant doctor in your pocket. |
| 🌤️ | **Hyperlocal Dashboard** | Get weather (temp, humidity, rain chance), soil moisture, NDVI, and active alerts tailored to your exact location (Pune, Hubli, Solapur, Nashik…). |
| 📈 | **Live Mandi Prices** | Check today's wholesale price for 8 major crops — paddy, wheat, cotton, tomato, and more — before you decide when to sell. |
| 🌾 | **AI Yield Forecasting** | Enter your crop and field size; get an AI-powered harvest and revenue estimate to plan finances and negotiations. |
| 🔔 | **Contextual Alerts** | Automatically surfaced weather warnings and pest outbreak alerts based on your location and crop — no digging through menus. |
| 🌐 | **Multilingual Interface** | All AI responses delivered in Hindi (`hi`) or English (`en`), with system-font fallbacks for Marathi and Kannada. |
| ☀️ | **Sunlight-Optimised UI** | High-contrast, large-text, earthy colour palette designed specifically for readability in outdoor, bright-sunlight conditions. |

---

## 🛠 Architecture & Tech Stack

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Farmer's Device                        │
│   React PWA · Mobile-first (max-w-480px)                │
│   Manrope + DM Sans · Tailwind CSS · lucide-react       │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS / JSON
                      ▼
┌─────────────────────────────────────────────────────────┐
│               KisanSetu Backend API                     │
│           Python · FastAPI · /api prefix                │
│                                                         │
│  GET  /dashboard-data   POST /advisory                  │
│  POST /scan             POST /yield                     │
│  GET  /                 (16/16 tests ✅)                │
└────┬────────────┬──────────────┬───────────────┬────────┘
     │            │              │               │
     ▼            ▼              ▼               ▼
 Weather &    AI Advisory    Computer        Mandi Price
 Soil Data    NLP Engine      Vision          Feed
 (location-   (multilingual   (pest &         (8 crops,
  specific)    crop advice)    disease)        live rates)
```

### Technology Choices

| Layer | Technology | Why this choice |
|-------|-----------|-----------------|
| **Frontend** | React + Tailwind CSS | Component-based architecture enables rapid iteration; Tailwind's utility classes enforce the strict design system (earthy palette, fat-finger touches, mobile-first containers) without fighting the framework |
| **UI Library** | lucide-react (stroke-width 2.5) | Thick, high-contrast icons remain legible under direct sunlight on low-res screens — critical for the rural-outdoor use case |
| **Typography** | Manrope (headings) + DM Sans (body) | Both are variable fonts with excellent Devanagari fallback support; engineered for high legibility at small sizes on AMOLED/LCD screens in outdoor conditions |
| **Backend** | Python + FastAPI | FastAPI's async architecture handles concurrent AI inference calls without blocking; automatic OpenAPI schema generation makes the API self-documenting |
| **AI Layer** | Vision model + NLP model | Vision model handles multi-class pest/disease classification from raw JPEG/PNG; NLP model generates contextually grounded, crop-specific advice — both abstracted behind a clean `/scan` and `/advisory` API |
| **Testing** | Python `requests` test suite | 16 integration tests covering all endpoints, edge cases (missing image, invalid language), and location-specific data variants — 100% pass rate at deploy |
| **Design System** | Custom JSON (`design_guidelines.json`) | Design tokens are version-controlled alongside code, ensuring frontend engineers and the AI agent share a single source of truth for colours, spacing, and interaction patterns |

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Check |
|------|---------|-------|
| Python | ≥ 3.10 | `python --version` |
| Node.js | ≥ 18.x | `node --version` |
| npm / yarn | ≥ 9.x | `npm --version` |
| Git | any | `git --version` |

---

### 1. Clone the Repository

```bash
git clone https://github.com/rajyyug1132/KisanSetu-main.git
cd KisanSetu-main
```

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Copy the environment file and fill in your keys
cp .env.example .env

# Start the FastAPI development server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at: `http://localhost:8001/api`

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The app will open at: `http://localhost:3000`

---

### 4. Run the Test Suite

```bash
# From the project root (with the backend running)
python backend_test.py
```

Expected output:
```
🌾 KisanSetu API Testing Suite
==================================================
✅ Tests passed: 16/16
✅ Success rate: 100.0%
📄 Results saved to: backend_test_results.json
```

---

### Environment Variables

Create a `.env` file in the `/backend` directory. Use the template below:

```env
# ─── AI Model Configuration ───────────────────────────────────────
AI_API_KEY=your_ai_api_key_here
AI_MODEL_VISION=your_vision_model_id          # e.g., gpt-4-vision-preview
AI_MODEL_NLP=your_nlp_model_id                # e.g., gpt-4o

# ─── Weather / Data Services ──────────────────────────────────────
WEATHER_API_KEY=your_weather_api_key_here
MANDI_API_KEY=your_mandi_api_key_here         # Agmarknet or equivalent

# ─── Server Configuration ─────────────────────────────────────────
PORT=8001
ENVIRONMENT=development                        # development | production
CORS_ORIGINS=http://localhost:3000

# ─── Optional: Deployment ─────────────────────────────────────────
BASE_URL=https://your-deployment-url.com/api
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 💻 Usage/Demonstration

### As a Farmer (Web App)

The primary user journey in 4 steps:

```
1. OPEN the app → Dashboard loads instantly with your local weather,
   soil status, and today's mandi prices for 8 crops.

2. TAP the voice FAB (🎙️ the large green button at the bottom) →
   Ask in Hindi: "आज मुझे अपनी फसल में पानी देना चाहिए?"
   ("Should I water my crops today?")
   → Receive a tailored AI advisory in Hindi within seconds.

3. TAP "Pest Scan" → Point your camera at a diseased leaf →
   AI identifies the problem (e.g., "Bacterial Leaf Blight") and
   recommends treatment (e.g., copper-based fungicide, dosage, timing).

4. TAP "Yield Estimate" → Enter crop: Wheat, area: 2 acres →
   Receive an AI-powered harvest and revenue forecast.
```

---

### As a Developer (API)

The REST API is language-agnostic. Here are copy-pasteable examples:

**Health Check**
```bash
curl https://kisansetu-advisory.preview.emergentagent.com/api/
# → "OK"
```

**Get Dashboard Data for a Specific Location**
```bash
curl "https://kisansetu-advisory.preview.emergentagent.com/api/dashboard-data?location=pune"
```
```json
{
  "weather": {
    "temp": 21,
    "humidity": 76,
    "rain_chance": 30,
    "ndvi": 0.62,
    "soil_moisture": 54,
    "soil_status": "good"
  },
  "mandi_prices": [...],
  "alerts": [],
  "location": "pune"
}
```

**Get AI Advisory in Hindi**
```bash
curl -X POST "https://kisansetu-advisory.preview.emergentagent.com/api/advisory" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "आज मुझे खाद देनी चाहिए?",
    "crop": "Paddy",
    "lang": "hi"
  }'
```
```json
{
  "advisory": "आज मौसम की स्थिति को देखते हुए, यूरिया खाद देना उचित रहेगा...",
  "audio_ready": true,
  "alerts": []
}
```

**Scan a Crop Photo for Pest / Disease**
```bash
curl -X POST "https://kisansetu-advisory.preview.emergentagent.com/api/scan" \
  -H "Content-Type: application/json" \
  -d '{
    "image_b64": "<BASE64_ENCODED_IMAGE>",
    "crop": "Paddy",
    "lang": "en"
  }'
```
```json
{
  "diagnosis": "Bacterial Leaf Blight detected. Apply copper oxychloride at 3g/litre...",
  "crop": "Paddy"
}
```

**Estimate Yield**
```bash
curl -X POST "https://kisansetu-advisory.preview.emergentagent.com/api/yield" \
  -H "Content-Type: application/json" \
  -d '{"crop": "Wheat", "area_acres": 2.0, "lang": "en"}'
```

> 📘 For full API documentation including all request/response schemas, see [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).

---


---

## 🧠 Challenges Faced & Learnings

### Challenge 1: Designing for Connectivity & Hardware Constraints

**The problem:** The target users — smallholder farmers in Maharashtra and Karnataka — often operate on 2G/3G networks with ₹8,000–₹15,000 entry-level Android devices. Standard React SPAs with lazy-loading and heavy bundles would produce an unacceptable user experience.

**How we solved it:** We enforced a strict performance budget in the design system (`design_guidelines.json`): no glassmorphism (reduces legibility in sunlight), animations capped at 200ms (feels snappy on low-end CPUs), and all interactive targets set to a minimum height of 56px (`min-h-[56px]`) to accommodate imprecise touch inputs. The mobile-first container (`max-w-480px`) was enforced at the layout level, not as a responsive afterthought.

**Learning:** Designing for *constraints* rather than capabilities forced us to make every UI decision intentional — and produced a faster, cleaner product than we would have shipped otherwise.

---

### Challenge 2: Multilingual AI Output at Inference Time

**The problem:** Instructing an LLM to respond in Hindi is straightforward — but ensuring consistent, grammatically correct Devanagari output across diverse crop-specific queries (especially with technical terms like "bacterial blight" or "NPK ratio") required careful prompt engineering. Early versions would code-switch mid-sentence or default to English for technical terminology.

**How we solved it:** We implemented a structured prompt template that provides the AI with (a) the farmer's language preference, (b) the crop context, and (c) explicit instructions to use common Hindi agricultural vocabulary for technical terms, with a glossary of pre-approved substitutions. The `advisory` endpoint's 100% test pass rate — including the "invalid language" edge case gracefully defaulting to Hindi — validates this approach.

**Learning:** Multilingual AI is not just a `lang=hi` flag. It requires language-aware prompt design, test coverage of edge cases (empty queries, unsupported language codes), and a fallback strategy that never leaves the farmer staring at an error.

---

### Challenge 3: Reliable Pest Diagnosis from Consumer-Grade Photos

**The problem:** Crop disease identification requires high-quality, well-lit, correctly framed images — the exact opposite of what a farmer in a field at noon with a shaking hand will produce. Early tests showed the vision model struggling with overexposed, blurry, or partial-leaf images.

**How we solved it:** We implemented image pre-processing on the client side (contrast normalisation, centre-crop to focus on the affected region) before base64 encoding and sending to `/scan`. We also added a graceful 422 error for missing images and ensured the test suite validates this failure mode explicitly.

---

## 🔮 Future Roadmap

| Priority | Feature | Impact |
|----------|---------|--------|
| 🥇 **High** | **Offline-first PWA with local model caching** — download a compact TFLite pest classification model to the device so basic scans work without internet | Removes the single biggest barrier for farmers in areas with no signal |
| 🥈 **High** | **Community Alert Network** — crowdsource pest outbreak data; when 3+ farmers in a district report the same issue, auto-generate a region-wide alert | Turns individual data points into collective intelligence |
| 🥉 **Medium** | **Vernacular voice input for Marathi & Kannada** — extend speech-to-text beyond Hindi/English to Maharashtra's dominant regional language | Reaches an additional 83 million Marathi-speaking farmers |
| 🔬 **Medium** | **Soil health history tracking** — store NDVI and soil moisture readings over time per farm, enabling trend analysis and predictive irrigation scheduling | Moves the product from reactive to proactive farming guidance |

---

## 🤝 Contributors & Team

> 🏆 Built with ❤️ for Indian farmers at [Hackathon Name].

| Name | Role | GitHub | LinkedIn |
|------|------|--------|----------|
| **[Your Name]** | Full Stack Lead & Backend Architecture Frontend & UX / Design System  | [@rajyyug1132](https://github.com/rajyyug1132) | 
| **[Saahil Vinay Kumar]** | AI / ML Integration & Prompt Engineering | [@saahil666](https://github.com/) | 
| **[Dhruv Ranganatha YAdav]** | Data & API Integration (Mandi / Weather) | [@dhruvry28-afk](https://github.com/) | 



---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

```
MIT License

Copyright (c) 2026 KisanSetu Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**Made in India 🇮🇳 · For India's Farmers · किसानों के लिए**

<img src="https://images.pexels.com/photos/6870862/pexels-photo-6870862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=120&w=940" alt="Healthy crops" width="60%" style="border-radius:8px; opacity:0.8;" />

*If KisanSetu helps even one farmer make a better decision, we've built something worth building.*

⭐ **Star this repo** if you found it useful — it helps us reach more contributors and farmers.

</div>
