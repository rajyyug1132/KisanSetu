# KisanSetu (AgriGuard AI) - PRD

## Original Problem Statement
Climate-induced uncertainties cause 20-40% annual crop losses for Indian smallholder farmers. KisanSetu is an Integrated Advisory Engine using voice-first, vernacular multi-modal interface.

## Architecture
- **Frontend:** React + Tailwind CSS (mobile-first 480px)
- **Backend:** FastAPI + MongoDB
- **AI Engine:** Claude Sonnet 4.5 via Emergent LLM Key
- **Voice:** Web Speech API (STT + TTS with Pause/Resume)

## What's Been Implemented (Feb 2026)
### Iteration 1 - MVP
- 4 AI endpoints: dashboard-data, advisory, scan, yield
- 4-tab mobile app: Home, Voice, Scan, Market
- 4-language support (EN/HI/MR/KN)
- Voice hero with STT/TTS, pest scanner, mandi prices, yield estimator

### Iteration 2 - Profile & Location
- Profile setup page (Name, Location, Crop → localStorage)
- Dynamic location switching via header dropdown (8 districts)
- Marathi label fix ("म" instead of duplicate "अ")

### Iteration 3 - Audio Fixes & Enhancements
- TTS Pause/Resume toggle with speakingSource tracking
- Language mismatch fix: useEffect cancels speech + clears stale results on lang change
- WhatsApp Share buttons on advisory & pest result cards
- Edit Profile via pen icon (reopens setup pre-filled)
- Location-specific mock data: 8 districts with unique weather/mandi prices
- Frontend fetches dashboard data per location dynamically

## Prioritized Backlog
### P0 - DONE
- [x] All core features implemented and tested

### P1
- [ ] Real weather API (OpenWeatherMap)
- [ ] Real mandi price API
- [ ] GPS location detection
- [ ] PWA offline mode

### P2
- [ ] User profiles with MongoDB persistence
- [ ] Crop calendar recommendations
- [ ] Push notifications for alerts
- [ ] Historical advisory tracking
