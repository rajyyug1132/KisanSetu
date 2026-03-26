import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "@/App.css";
import {
  Home, Camera, ShoppingCart, Droplets, Bug, Leaf,
  TrendingUp, TrendingDown, ArrowRight, CheckCircle,
  AlertTriangle, Loader2, MapPin, Upload,
  ChevronRight, ChevronDown, Users, X, Share2, PenLine
} from "lucide-react";
import {
  T, LANG_VOICES, LANG_LABELS, LANG_NAMES, CROPS, LOCATIONS,
  MANDI_DATA, WEATHER, COMMON_ISSUES, NEARBY_MANDIS, AREA_OPTIONS
} from "@/lib/kisanData";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/* ── Sub-components ── */
function KisanCard({ children, className = "", onClick, testId }) {
  return (
    <div
      data-testid={testId}
      onClick={onClick}
      className={`bg-[#f0ece4] rounded-2xl p-5 shadow-sm border border-[#c4c8bc40] ${onClick ? "cursor-pointer active:scale-[0.98]" : ""} transition-transform ${className}`}
    >
      {children}
    </div>
  );
}

function PillBtn({ label, active, onClick, testId }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
        active
          ? "bg-[#4a7c59] text-white border-transparent"
          : "bg-transparent text-[#4a4e4a] border border-[#c4c8bc]"
      }`}
    >
      {label}
    </button>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up") return <TrendingUp size={16} className="text-[#4a7c59]" />;
  if (trend === "down") return <TrendingDown size={16} className="text-[#b83230]" />;
  return <ArrowRight size={16} className="text-[#705c30]" />;
}

/* ── Main Component ── */
export default function KisanSetu() {
  const [lang, setLang] = useState("hi");
  const [tab, setTab] = useState("home");
  const [crop, setCrop] = useState("Paddy");

  const [pestImg, setPestImg] = useState(null);
  const [pestResult, setPestResult] = useState("");
  const [pestLoading, setPestLoading] = useState(false);
  const [yieldResult, setYieldResult] = useState("");
  const [yieldLoading, setYieldLoading] = useState(false);
  const [area, setArea] = useState("2");
  const [apiError, setApiError] = useState("");
  const [dashWeather, setDashWeather] = useState(WEATHER);
  const [dashMandi, setDashMandi] = useState(MANDI_DATA);
  const [profile, setProfile] = useState(null);
  const [showSetup, setShowSetup] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupLocation, setSetupLocation] = useState("");
  const [setupCrop, setSetupCrop] = useState("Paddy");
  const fileRef = useRef();

  /* ── Strip markdown from Claude responses ── */
  const stripMd = (text) => (text || "").replace(/\*{1,2}/g, "").replace(/#{1,6}\s/g, "").trim();

  const t = T[lang];
  const W = dashWeather;
  const mandi = (dashMandi[crop]) || MANDI_DATA[crop];

  const soilBarPct = { good: "82%", low: "40%", critical: "15%" }[W.soilStatus];
  const soilBarColor = { good: "#4a7c59", low: "#d4a017", critical: "#b83230" }[W.soilStatus];
  const currentLocation = profile
    ? LOCATIONS.find(l => l.id === profile.location) || LOCATIONS[0]
    : LOCATIONS[0];

  /* ── Load profile from localStorage ── */
  useEffect(() => {
    const saved = localStorage.getItem("kisanProfile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setShowSetup(false);
        if (parsed.crop) setCrop(parsed.crop);
      } catch {
        localStorage.removeItem("kisanProfile");
      }
    }
  }, []);

  /* ── Fetch location-specific dashboard data ── */
  useEffect(() => {
    if (!profile?.location) return;
    axios.get(`${API}/dashboard-data`, { params: { location: profile.location, crop, area: parseFloat(area || 1) } })
      .then(res => {
        if (res.data.weather) setDashWeather(res.data.weather);
        
        const d = res.data;
        if (d && !d.mandi_prices) {
           const actionStr = d.advice && d.advice.includes("SELL") ? "sell" : "hold";
           const parsedPrice = parseInt(String(d.mandi_price).replace(/\D/g, '')) || 2000;
           const mappedMandi = {
               price: parsedPrice,
               msp: d.msp || 2000,
               trend: actionStr === "sell" ? "up" : "down",
               forecast: actionStr === "sell" ? parsedPrice - 40 : parsedPrice + 60,
               action: actionStr,
               gain: 60,
               nearby_mandis: d.nearby_mandis,
               estimated_yield_qtl: d.estimated_yield_qtl,
               estimated_revenue_inr: d.estimated_revenue_inr,
               advice_raw: d.advice
           };
           setDashMandi(prev => ({ ...prev, [crop]: mappedMandi }));
        } else if (res.data.mandi_prices) {
           setDashMandi(res.data.mandi_prices);
        }
      })
      .catch(() => {});
  }, [profile?.location, crop, area]);

  /* ── Save profile ── */
  const handleSetupSubmit = () => {
    if (!setupName.trim() || !setupLocation) return;
    const loc = LOCATIONS.find(l => l.id === setupLocation);
    const newProfile = {
      name: setupName.trim(),
      location: setupLocation,
      locationName: loc?.name || setupLocation,
      locationState: loc?.state || "",
      crop: setupCrop,
    };
    localStorage.setItem("kisanProfile", JSON.stringify(newProfile));
    setProfile(newProfile);
    setCrop(setupCrop);
    setShowSetup(false);
  };

  /* ── Change location ── */
  const changeLocation = (loc) => {
    const updated = { ...profile, location: loc.id, locationName: loc.name, locationState: loc.state };
    setProfile(updated);
    localStorage.setItem("kisanProfile", JSON.stringify(updated));
    setShowLocationPicker(false);
  };

  /* ── Clear stale results on language change ── */
  useEffect(() => {
    setPestResult("");
    setYieldResult("");
  }, [lang]);

  /* ── WhatsApp Share ── */
  const shareToWhatsApp = (text) => {
    const msg = encodeURIComponent(`KisanSetu Advisory:\n${text}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  /* ── Edit Profile ── */
  const openEditProfile = () => {
    if (profile) {
      setSetupName(profile.name || "");
      setSetupLocation(profile.location || "");
      setSetupCrop(profile.crop || "Paddy");
    }
    // Defer showing setup so state is committed first
    setTimeout(() => setShowSetup(true), 0);
  };



  /* ── Pest ID ── */
  const handlePestPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target.result.split(",")[1];
      setPestImg(ev.target.result);
      setPestResult("");
      setPestLoading(true);
      setApiError("");
      try {
        const res = await axios.post(`${API}/scan`, { image_b64: b64, crop, lang });
        setPestResult(res.data);
      } catch (err) {
        setApiError("AI service temporarily unavailable. Please try again.");
      } finally {
        setPestLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  /* ── Yield ── */
  const estimateYield = async () => {
    setYieldLoading(true);
    setYieldResult("");
    setApiError("");
    try {
      const res = await axios.post(`${API}/yield`, { crop, area_acres: parseFloat(area), lang });
      setYieldResult(stripMd(res.data.estimated_yield));
    } catch (err) {
      setApiError("AI service temporarily unavailable. Please try again.");
    } finally {
      setYieldLoading(false);
    }
  };

  /* ── Crop Selector Row ── */
  const CropSelector = () => (
    <div className="flex gap-2 overflow-x-auto pill-scroll pb-1 mb-3.5">
      {CROPS.map((c) => (
        <PillBtn key={c} label={c} active={crop === c} onClick={() => setCrop(c)} testId={`crop-pill-${c.toLowerCase()}`} />
      ))}
    </div>
  );

  /* ── Setup Screen ── */
  if (showSetup) {
    return (
      <div data-testid="setup-screen" className="font-sans bg-[#faf6f0] min-h-screen max-w-[480px] mx-auto flex flex-col shadow-2xl">
        {/* Language selector */}
        <div className="flex justify-end p-4 gap-1">
          {Object.entries(LANG_LABELS).map(([k, v]) => (
            <button
              key={k}
              data-testid={`setup-lang-${k}`}
              onClick={() => setLang(k)}
              className={`w-[30px] h-[30px] rounded-full font-extrabold text-[13px] cursor-pointer transition-all ${
                lang === k
                  ? "border-2 border-[#4a7c59] bg-[#c8e8d0] text-[#2a6038]"
                  : "border border-[#c4c8bc] bg-transparent text-[#74796e]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-10">
          {/* Logo */}
          <div className="bg-[#c8e8d0] rounded-full p-5 mb-5">
            <Leaf size={44} strokeWidth={2.5} className="text-[#4a7c59]" />
          </div>
          <h1 className="font-serif text-3xl font-black text-[#4a7c59] mb-1">KisanSetu</h1>
          <p className="text-sm text-[#4a4e4a] mb-8 text-center leading-relaxed">{t.setupSub}</p>

          {/* Form */}
          <div className="w-full space-y-5">
            {/* Name */}
            <div>
              <label className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px] mb-2 block">{t.yourName}</label>
              <input
                data-testid="setup-name-input"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full bg-[#f0ece4] border border-[#c4c8bc] rounded-2xl px-4 py-4 text-base text-[#2e3230] placeholder:text-[#74796e80] focus:outline-none focus:ring-2 focus:ring-[#4a7c59] font-sans min-h-[56px]"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px] mb-2 block">{t.yourLocation}</label>
              <div className="relative">
                <select
                  data-testid="setup-location-select"
                  value={setupLocation}
                  onChange={(e) => setSetupLocation(e.target.value)}
                  className="w-full bg-[#f0ece4] border border-[#c4c8bc] rounded-2xl px-4 py-4 text-base text-[#2e3230] focus:outline-none focus:ring-2 focus:ring-[#4a7c59] font-sans appearance-none cursor-pointer min-h-[56px]"
                >
                  <option value="">{t.selectLocation}</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}, {loc.state}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74796e] pointer-events-none" />
              </div>
            </div>

            {/* Primary Crop */}
            <div>
              <label className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px] mb-2 block">{t.primaryCrop}</label>
              <div className="flex flex-wrap gap-2">
                {CROPS.map((c) => (
                  <PillBtn key={c} label={c} active={setupCrop === c} onClick={() => setSetupCrop(c)} testId={`setup-crop-${c.toLowerCase()}`} />
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              data-testid="setup-submit-btn"
              onClick={handleSetupSubmit}
              disabled={!setupName.trim() || !setupLocation}
              className={`w-full text-white border-none rounded-2xl py-4 text-lg font-extrabold cursor-pointer flex items-center justify-center gap-3 transition-all min-h-[56px] mt-4 ${
                setupName.trim() && setupLocation
                  ? "bg-[#4a7c59] active:scale-[0.98]"
                  : "bg-[#c4c8bc] cursor-not-allowed"
              }`}
            >
              <Leaf size={20} />
              {t.getStarted}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="kisan-setu-app" className="font-sans bg-[#faf6f0] min-h-screen max-w-[480px] mx-auto text-[#2e3230] pb-20 relative shadow-2xl">

      {/* ── HEADER ── */}
      <header data-testid="app-header" className="sticky top-0 z-[100] bg-[#faf6f0]/96 backdrop-blur-xl border-b border-[#c4c8bc60] px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#4a7c5918] rounded-full p-1.5 flex">
            <MapPin size={18} className="text-[#4a7c59]" />
          </div>
          <div className="relative">
            <div className="font-serif font-black text-xl text-[#4a7c59] leading-none">KisanSetu</div>
            <button
              data-testid="location-btn"
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              className="flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span className="text-[9px] font-extrabold tracking-[1.2px] text-[#74796e] uppercase">
                {currentLocation.name}, {currentLocation.state}
              </span>
              <ChevronDown size={10} className="text-[#74796e]" />
            </button>

            {/* Location Picker Dropdown */}
            {showLocationPicker && (
              <div data-testid="location-dropdown" className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-lg border border-[#c4c8bc] py-2 z-[200] min-w-[220px]">
                <div className="flex items-center justify-between px-3 pb-2 border-b border-[#c4c8bc50]">
                  <span className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px]">{t.changeLocation}</span>
                  <button data-testid="close-location-btn" onClick={() => setShowLocationPicker(false)} className="p-0.5 cursor-pointer bg-transparent border-none">
                    <X size={14} className="text-[#74796e]" />
                  </button>
                </div>
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    data-testid={`location-${loc.id}`}
                    onClick={() => changeLocation(loc)}
                    className={`w-full text-left px-3 py-2.5 text-[13px] cursor-pointer border-none transition-colors ${
                      currentLocation.id === loc.id
                        ? "bg-[#c8e8d0] text-[#2a6038] font-bold"
                        : "bg-transparent text-[#4a4e4a] hover:bg-[#f0ece4]"
                    }`}
                  >
                    <span className="font-semibold">{loc.name}</span>
                    <span className="text-[11px] text-[#74796e] ml-1">{loc.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {Object.entries(LANG_LABELS).map(([k, v]) => (
              <button
                key={k}
                data-testid={`lang-btn-${k}`}
                onClick={() => setLang(k)}
                title={LANG_NAMES[k]}
                className={`w-[30px] h-[30px] rounded-full font-extrabold text-[13px] cursor-pointer transition-all ${
                  lang === k
                    ? "border-2 border-[#4a7c59] bg-[#c8e8d0] text-[#2a6038]"
                    : "border border-[#c4c8bc] bg-transparent text-[#74796e]"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            data-testid="edit-profile-btn"
            onClick={openEditProfile}
            title="Edit Profile"
            className="w-[38px] h-[38px] rounded-full border-2 border-[#c8e8d0] bg-[#e4e0d8] overflow-hidden flex items-center justify-center cursor-pointer"
          >
            <PenLine size={16} className="text-[#4a7c59]" />
          </button>
        </div>
      </header>

      <main className="px-4">
        {/* Error banner */}
        {apiError && (
          <div data-testid="api-error-banner" className="mt-3 bg-[#ffdad8] border border-[#b8323030] rounded-2xl p-3 text-sm text-[#b83230] font-semibold text-center fade-up">
            {apiError}
            <button onClick={() => setApiError("")} className="ml-2 underline font-bold">Dismiss</button>
          </div>
        )}

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          <div data-testid="home-tab" className="fade-up">
            {/* Greeting */}
            <section className="mt-5 mb-5">
              <h1 data-testid="greeting" className="font-serif text-[26px] font-black text-[#2e3230] leading-tight">{t.greeting(profile?.name || "Ramesh")}</h1>
              <p className="text-[13px] text-[#4a4e4a] mt-1 leading-relaxed">{t.sub}</p>
            </section>



            {/* Alert Banner */}
            <section data-testid="alert-banner" className="bg-[#ffdad8] border-[1.5px] border-[#b8323030] rounded-2xl p-3.5 px-4 flex gap-3 items-start mb-4">
              <div className="bg-[#b83230] rounded-[10px] p-1.5 px-2 flex flex-shrink-0">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <div className="font-extrabold text-[13px] text-[#2e3230]">{t.alertTitle}</div>
                <div className="text-xs text-[#4a4e4a] mt-0.5 leading-relaxed">{t.alertMsg}</div>
              </div>
            </section>

            {/* Crop selector */}
            <CropSelector />

            {/* 2x2 Grid */}
            <section data-testid="dashboard-grid" className="grid grid-cols-2 gap-3 mb-5">
              {/* Weather */}
              <KisanCard testId="weather-card" className="aspect-square flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[9px] font-extrabold tracking-[1.2px] text-[#74796e] uppercase mb-1">{t.weather}</div>
                    <div className="font-serif text-[28px] font-black text-[#2e3230]">{W.temp}&deg;C</div>
                  </div>
                  <Droplets size={18} className="text-[#3a86c4] mt-0.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1.5">
                    <span className="text-[#4a4e4a]">{t.soilMoisture}</span>
                    <span className="text-[#4a7c59]">{t.good}</span>
                  </div>
                  <div className="h-1.5 bg-[#c4c8bc] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: soilBarPct, backgroundColor: soilBarColor }} />
                  </div>
                  <div className="text-[10px] text-[#74796e] mt-1.5 italic">Humidity at {W.humidity}%</div>
                </div>
              </KisanCard>

              {/* Pest Check */}
              <KisanCard testId="pest-check-card" className="aspect-square flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="text-[9px] font-extrabold tracking-[1.2px] text-[#74796e] uppercase">{t.pestCheck}</div>
                  <Bug size={18} className="text-[#705c30]" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePestPhoto} />
                <button
                  data-testid="scan-crop-btn"
                  onClick={() => { fileRef.current?.click(); setTab("scan"); }}
                  className="bg-[#705c30] text-white border-none rounded-xl py-3 cursor-pointer flex items-center justify-center gap-2 font-extrabold text-xs min-h-[44px]"
                >
                  <Camera size={16} /> {t.scanCrop}
                </button>
              </KisanCard>

              {/* Markets */}
              <KisanCard testId="markets-card" className="aspect-square flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[9px] font-extrabold tracking-[1.2px] text-[#74796e] uppercase mb-1">{t.markets}</div>
                    <div className="text-[11px] text-[#4a4e4a]">{crop} ({currentLocation.name})</div>
                  </div>
                  <TrendIcon trend={mandi.trend} />
                </div>
                <div>
                  <div className="font-serif text-[22px] font-black text-[#2e3230]">
                    &#8377;{mandi.price.toLocaleString("en-IN")}<span className="text-[14px] font-semibold text-[#74796e]">/qtl</span>
                  </div>
                  <button
                    data-testid="market-action-btn"
                    onClick={() => setTab("market")}
                    className={`mt-2.5 text-white border-none rounded-full py-[7px] px-[18px] text-xs font-black cursor-pointer ${
                      mandi.action === "sell" ? "bg-[#b83230]" : "bg-[#4a7c59]"
                    }`}
                  >
                    {mandi.action === "sell" ? t.sell : t.hold}
                  </button>
                </div>
              </KisanCard>

              {/* Soil Health */}
              <KisanCard testId="soil-health-card" className="aspect-square flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="text-[9px] font-extrabold tracking-[1.2px] text-[#74796e] uppercase">{t.soilHealth}</div>
                  <Leaf size={18} className="text-[#4a7c59]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-[#4a7c59]" />
                    <span className="text-xs font-semibold text-[#2e3230]">{t.nitrogenOk}</span>
                  </div>
                  <span className="text-xs text-[#4a7c59] underline cursor-pointer font-bold">{t.viewReport}</span>
                </div>
              </KisanCard>
            </section>

            {/* Community */}
            <section data-testid="community-section" className="mb-6">
              <h2 className="font-serif text-xl font-extrabold mb-3.5">{t.community}</h2>
              <KisanCard className="p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-[#c8e8d0] to-[#f0e8db] h-[140px] flex items-center justify-center">
                  <Users size={56} className="text-[#4a7c59] opacity-40" />
                </div>
                <div className="p-4">
                  <div className="text-[11px] font-extrabold text-[#705c30] uppercase tracking-[0.8px]">{t.upcomingEvent}</div>
                  <div className="font-serif font-bold text-[15px] text-[#2e3230] mt-1">{t.eventTitle}</div>
                  <div className="text-xs text-[#4a4e4a] mt-1">{t.eventSub}</div>
                </div>
              </KisanCard>
            </section>
          </div>
        )}



        {/* ── SCAN / PEST ID TAB ── */}
        {tab === "scan" && (
          <div data-testid="scan-tab" className="fade-up pt-5">
            <h2 className="font-serif text-[22px] font-extrabold mb-1">{t.pestTitle}</h2>
            <p className="text-[13px] text-[#4a4e4a] mb-5">{t.pestSub}</p>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePestPhoto} />
            <button
              data-testid="upload-photo-btn"
              onClick={() => fileRef.current?.click()}
              className="w-full bg-[#f0ece4] border-2 border-dashed border-[#c4c8bc] rounded-2xl py-9 px-6 cursor-pointer flex flex-col items-center gap-3 mb-4 min-h-[56px] active:scale-[0.98] transition-transform"
            >
              <div className="bg-[#705c3018] rounded-full p-4">
                <Upload size={28} className="text-[#705c30]" />
              </div>
              <span className="font-extrabold text-[15px] text-[#2e3230]">{t.takePhoto}</span>
              <span className="text-xs text-[#74796e]">{t.tapCamera}</span>
            </button>

            {pestImg && (
              <div className="fade-up">
                <img
                  data-testid="pest-preview-img"
                  src={pestImg}
                  alt="leaf"
                  className="w-full rounded-2xl max-h-60 object-cover mb-3.5 border border-[#c4c8bc]"
                />
                {pestLoading ? (
                  <KisanCard className="text-center py-6">
                    <Loader2 size={32} className="anim-spin text-[#4a7c59] mx-auto" />
                    <div className="mt-2.5 font-semibold text-[#4a4e4a]">{t.analyzing}</div>
                  </KisanCard>
                ) : pestResult ? (
                  <KisanCard testId="pest-result-card" className="fade-up border-2 border-[#b8323030]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-[11px] font-extrabold text-[#b83230] uppercase tracking-[1px] flex items-center gap-1.5">
                        <AlertTriangle size={14} /> AI Diagnosis
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-1 rounded-full text-white bg-[#b83230]">
                        {pestResult.risk_level} RISK
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="font-serif text-[24px] font-black text-[#2e3230] leading-none mb-1">
                        {pestResult.primary_disease}
                      </div>
                      <div className="text-[12px] font-bold text-[#74796e]">
                        Confidence Score: <span className="text-[#4a7c59]">{pestResult.confidence_score <= 1 ? (pestResult.confidence_score * 100).toFixed(1) : pestResult.confidence_score}%</span>
                      </div>
                    </div>

                    <div className="bg-[#b8323010] rounded-xl p-3 mb-3">
                      <div className="text-[11px] font-extrabold text-[#b83230] uppercase mb-1">Immediate Action</div>
                      <div className="text-[13px] text-[#2e3230] font-semibold">{pestResult.immediate_action}</div>
                    </div>

                    <button
                      data-testid="share-pest-btn"
                      onClick={() => shareToWhatsApp(`${pestResult.primary_disease} detected. Action: ${pestResult.immediate_action}`)}
                      className="w-full bg-[#25D36620] border border-[#25D36640] text-[#128C7E] rounded-xl py-2.5 text-sm cursor-pointer font-extrabold flex items-center justify-center gap-2"
                    >
                      <Share2 size={16} /> Alert Community via WhatsApp
                    </button>
                  </KisanCard>
                ) : null}
              </div>
            )}

            {/* Common Issues */}
            <div className="mt-5">
              <div className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px] mb-3">{t.commonIssues} - {crop}</div>
              {COMMON_ISSUES.map((item) => (
                <KisanCard key={item.disease} testId={`issue-${item.disease.toLowerCase().replace(/\s/g, "-")}`} className="flex items-center gap-3 p-3 px-4 mb-2">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.severity === "HIGH" ? "bg-[#b83230]" : item.severity === "MEDIUM" ? "bg-[#d4a017]" : "bg-[#4a7c59]"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px]">{item.disease}</div>
                    <div className="text-[11px] text-[#74796e] mt-0.5 flex items-center gap-1">
                      <Leaf size={10} /> {item.treatment}
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    item.severity === "HIGH"
                      ? "text-[#b83230] bg-[#b8323018]"
                      : item.severity === "MEDIUM"
                        ? "text-[#705c30] bg-[#705c3018]"
                        : "text-[#4a7c59] bg-[#4a7c5910]"
                  }`}>{item.severity}</span>
                </KisanCard>
              ))}
            </div>
          </div>
        )}

        {/* ── MARKET TAB ── */}
        {tab === "market" && (
          <div data-testid="market-tab" className="fade-up pt-5">
            <h2 className="font-serif text-[22px] font-extrabold mb-1">{t.marketTitle}</h2>
            <p className="text-[13px] text-[#4a4e4a] mb-4">{t.marketSub}</p>

            <CropSelector />

            {/* Price card */}
            <KisanCard testId="price-card" className="mb-3.5">
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <div className="text-[10px] font-extrabold tracking-[1px] text-[#74796e] uppercase">{crop} · {t.localMandi}</div>
                  <div className="font-serif text-[32px] font-black text-[#2e3230] mt-1">
                    &#8377;{mandi.price.toLocaleString("en-IN")}
                    <span className="text-sm font-semibold text-[#74796e]">/qtl</span>
                  </div>
                </div>
                <TrendIcon trend={mandi.trend} />
              </div>
              <div className="flex gap-4 text-xs text-[#4a4e4a] mb-3.5">
                <span>MSP: &#8377;{mandi.msp}</span>
                <span>7-day forecast: &#8377;{mandi.forecast}</span>
              </div>
              {mandi.action === "sell" ? (
                <div className="bg-[#b8323012] border border-[#b8323030] rounded-xl p-3.5 text-center">
                  <div className="text-lg font-black text-[#b83230] flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> {t.sell}
                  </div>
                  <div className="text-xs text-[#4a4e4a] mt-1">{mandi.advice_raw || t.sellAdvice}</div>
                </div>
              ) : (
                <div className="bg-[#4a7c5910] border border-[#4a7c5930] rounded-xl p-3.5 text-center">
                  <div className="text-lg font-black text-[#4a7c59]">
                    {t.hold} &mdash; +&#8377;{mandi.gain}/qtl in 7 {t.holdDays}
                  </div>
                  <div className="text-xs text-[#4a4e4a] mt-1">{mandi.advice_raw || t.holdAdvice}</div>
                </div>
              )}
            </KisanCard>

            {/* Nearby mandis */}
            <KisanCard testId="nearby-mandis-card" className="mb-4">
              <div className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px] mb-3">{t.nearbyMandis} (&#8377;/qtl)</div>
              {(mandi.nearby_mandis || NEARBY_MANDIS).map((m) => {
                 const name = m.market_name || m.name;
                 const price = m.price || (mandi.price + m.delta);
                 const trend = m.trend || (m.delta > 0 ? "up" : "down");
                 return (
                <div key={name} className="flex justify-between py-2 border-b border-[#c4c8bc50] text-[13px] last:border-b-0">
                  <span className="text-[#4a4e4a]">{name}</span>
                  <span className={`font-extrabold ${trend === "up" ? "text-[#4a7c59]" : "text-[#b83230]"}`}>
                    &#8377;{price.toLocaleString("en-IN")} {trend === "up" ? "\u2191" : "\u2193"}
                  </span>
                </div>
              )})}
            </KisanCard>

            {/* Yield estimator */}
            <KisanCard testId="yield-estimator-card">
              <div className="text-[11px] font-extrabold text-[#74796e] uppercase tracking-[1px] mb-3.5 flex items-center gap-1.5">
                <Leaf size={14} className="text-[#4a7c59]" /> {t.yieldEst}
              </div>
              <div className="mb-3">
                <div className="text-xs font-bold text-[#4a4e4a] mb-2">{t.area}</div>
                <div className="flex gap-2">
                  {AREA_OPTIONS.map((v) => (
                    <button
                      key={v}
                      data-testid={`area-btn-${v}`}
                      onClick={() => setArea(v)}
                      className={`flex-1 border-none rounded-[10px] py-2.5 text-[13px] cursor-pointer transition-all ${
                        area === v
                          ? "bg-[#4a7c59] text-white font-extrabold"
                          : "bg-[#e4e0d8] text-[#4a4e4a] font-normal"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <button
                data-testid="estimate-yield-btn"
                onClick={estimateYield}
                disabled={true}
                className={`hidden`}
              >
                {yieldLoading ? <Loader2 size={16} className="anim-spin" /> : <ChevronRight size={16} />}
                {yieldLoading ? t.estimating : t.estimateYield}
              </button>
              
              {mandi.estimated_yield_qtl && (
                <div data-testid="yield-result" className="fade-up mt-2 p-3.5 bg-[#4a7c5910] border border-[#4a7c5930] rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[11px] font-extrabold text-[#705c30] uppercase">Proj. Yield</div>
                    <div className="text-sm font-black text-[#4a7c59]">{mandi.estimated_yield_qtl} qtl</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[11px] font-extrabold text-[#705c30] uppercase">Est. Revenue</div>
                    <div className="text-[15px] font-black text-[#2e3230]">&#8377;{mandi.estimated_revenue_inr.toLocaleString("en-IN")}</div>
                  </div>
                </div>
              )}
            </KisanCard>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav data-testid="bottom-nav" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#faf6f0]/96 backdrop-blur-xl border-t border-[#c4c8bc60] flex z-[9999]">
        {[
          { key: "home",   icon: Home,         label: t.home },
          { key: "scan",   icon: Camera,        label: t.scan },
          { key: "market", icon: ShoppingCart,   label: t.market },
        ].map(({ key, icon: Icon, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              data-testid={`nav-${key}`}
              onClick={() => setTab(key)}
              className={`flex-1 bg-none border-none cursor-pointer pt-2.5 pb-3 flex flex-col items-center gap-0.5 transition-colors ${
                active ? "text-[#4a7c59]" : "text-[#74796e]"
              }`}
            >
              {key === "home" && active ? (
                <div className="bg-[#4a7c59] rounded-full px-5 py-2 flex text-white">
                  <Icon size={22} strokeWidth={2.5} />
                </div>
              ) : (
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              )}
              <span className={`text-[10px] ${active ? "font-extrabold" : "font-semibold"}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
