"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_NAME, DEFAULT_SETTINGS } from "./config";
import { activities, encouragingPhrases } from "./data/learningContent";
import { Celebration } from "./components/Shared";
import { ParentArea, ParentGate } from "./components/ParentArea";
import type { ActivityId, DailyProgress, Settings } from "./types";
import { emptyProgress, loadProgress, loadSettings, resetStoredProgress, saveProgress, saveSettings } from "./utils/storage";
import { sample } from "./utils/random";
import { clapSound, unlockAudio } from "./utils/sound";
import { speak, stopSpeaking } from "./utils/speech";

const ActivitiesRouter = lazy(() => import("./activities/ActivitiesRouter"));

export interface ActivityRuntime {
  settings: Settings;
  say: (text: string) => void;
  reward: (phrase?: string) => void;
  trackItem: (kind: "colors" | "letters" | "animals", id: string) => void;
  trackDrawing: () => void;
  onHome: () => void;
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState<ActivityId | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [progress, setProgress] = useState<DailyProgress>(emptyProgress);
  const [parentOpen, setParentOpen] = useState(false);
  const [breakOpen, setBreakOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [phrase, setPhrase] = useState("Yay!");
  const rewardLock = useRef(0);
  const hydrated = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSettings(loadSettings());
      setProgress(loadProgress());
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated.current) saveSettings(settings); }, [settings]);
  useEffect(() => { if (hydrated.current) saveProgress(progress); }, [progress]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!started || !settings.reminderMinutes) return;
    const timer = window.setTimeout(() => setBreakOpen(true), settings.reminderMinutes * 60_000);
    return () => window.clearTimeout(timer);
  }, [started, settings.reminderMinutes]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [active]);
  useEffect(() => { if (!settings.speechOn) stopSpeaking(); }, [settings.speechOn]);
  useEffect(() => () => stopSpeaking(), []);

  const say = useCallback((text: string) => speak(text, { enabled: settings.speechOn, volume: settings.volume }), [settings.speechOn, settings.volume]);
  const reward = useCallback((custom?: string) => {
    const now = Date.now();
    if (now - rewardLock.current < 900) return;
    rewardLock.current = now;
    const nextPhrase = custom ?? sample(encouragingPhrases);
    setPhrase(nextPhrase);
    setBurst((value) => value + 1);
    if (settings.soundOn) clapSound(settings.volume);
    window.setTimeout(() => setBurst(0), 1800);
  }, [settings.soundOn, settings.volume]);

  const trackItem = useCallback((kind: "colors" | "letters" | "animals", id: string) => {
    setProgress((current) => current[kind].includes(id) ? current : { ...current, [kind]: [...current[kind], id] });
  }, []);
  const trackDrawing = useCallback(() => setProgress((current) => ({ ...current, drawingSessions: current.drawingSessions + 1 })), []);

  const openActivity = (id: ActivityId) => {
    stopSpeaking();
    setActive(id);
    setProgress((current) => ({ ...current, activities: { ...current.activities, [id]: (current.activities[id] ?? 0) + 1 } }));
  };

  const visibleActivities = useMemo(() => activities.filter((activity) => !settings.hiddenActivities.includes(activity.id)), [settings.hiddenActivities]);
  const favoriteActivities = useMemo(() => visibleActivities.filter((activity) => settings.favorites.includes(activity.id)), [visibleActivities, settings.favorites]);

  if (!started) {
    return (
      <main className={`welcome-screen theme-${settings.theme}`}>
        <div className="sky-blob sky-blob-one" /><div className="sky-blob sky-blob-two" />
        <section className="welcome-card" aria-labelledby="welcome-title">
          <div className="rainbow" aria-hidden="true"><span /><span /><span /></div>
          <p className="hello">Hello, {settings.childName || "Little Explorer"}! 👋</p>
          <h1 id="welcome-title">Ready to play?</h1>
          <p className="welcome-subtitle">A little world of happy discoveries awaits.</p>
          <button className="play-button" onClick={() => { unlockAudio(); setStarted(true); say(`Hello ${settings.childName || "little explorer"}! Ready to play?`); }}><span aria-hidden="true">▶</span> Let&apos;s Play</button>
          <div className="welcome-parent"><ParentGate onOpen={() => setParentOpen(true)} /></div>
        </section>
        {parentOpen && <ParentArea settings={settings} progress={progress} onChange={setSettings} onClose={() => setParentOpen(false)} onReset={() => { resetStoredProgress(); setProgress(emptyProgress()); }} onFullscreen={() => void document.documentElement.requestFullscreen?.()} />}
      </main>
    );
  }

  const runtime: ActivityRuntime = { settings, say, reward, trackItem, trackDrawing, onHome: () => { stopSpeaking(); setActive(null); } };

  return (
    <div className={`app-root theme-${settings.theme} motion-${settings.animation}`}>
      {active ? (
        <Suspense fallback={<div className="activity-loading">🌈<span>Getting the fun ready…</span></div>}><ActivitiesRouter activity={active} runtime={runtime} /></Suspense>
      ) : (
        <main className="home-screen">
          <header className="home-header">
            <div><p className="eyebrow">Play • Learn • Discover</p><h1>{settings.childName || "My"}&apos;s {APP_NAME}</h1></div>
            <div className="header-actions">
              <button className="round-button" onClick={() => setSettings((current) => { const turnOn = !(current.soundOn || current.speechOn); return { ...current, soundOn: turnOn, speechOn: turnOn }; })} aria-label={settings.soundOn || settings.speechOn ? "Mute all sound" : "Turn sound on"}>{settings.soundOn || settings.speechOn ? "🔊" : "🔇"}</button>
              <ParentGate onOpen={() => setParentOpen(true)} />
            </div>
          </header>

          <section className="hero-play" aria-label="Welcome">
            <div><span className="tiny-label">TODAY&apos;S ADVENTURE</span><h2>What shall we discover?</h2><p>Tap a big card and let&apos;s play together.</p></div>
            <div className="hero-friends" aria-hidden="true">🐘 🐥 🌈</div>
          </section>

          {favoriteActivities.length > 0 && <section className="activity-section favorites-section" aria-labelledby="favorites-title"><div className="section-title"><h2 id="favorites-title">{settings.childName}&apos;s favorites</h2><span>♥</span></div><div className="favorites-row">{favoriteActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} onClick={() => openActivity(activity.id)} compact />)}</div></section>}
          <section className="activity-section" aria-labelledby="activity-title"><h2 id="activity-title">Pick something fun</h2><div className="activity-grid">{visibleActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} onClick={() => openActivity(activity.id)} />)}</div></section>
          <footer className="home-footer"><span>Made with love for little learners</span><button onClick={() => void document.documentElement.requestFullscreen?.()}>⛶ Play Fullscreen</button></footer>
        </main>
      )}

      <Celebration burst={burst} phrase={phrase} />
      {parentOpen && <ParentArea settings={settings} progress={progress} onChange={setSettings} onClose={() => setParentOpen(false)} onReset={() => { resetStoredProgress(); setProgress(emptyProgress()); }} onFullscreen={() => void document.documentElement.requestFullscreen?.()} />}
      {breakOpen && <div className="modal-backdrop"><section className="break-card" role="dialog" aria-modal="true" aria-labelledby="break-title"><span aria-hidden="true">🌿</span><h2 id="break-title">Time for a little break!</h2><p>Stretch, sip some water, and come back whenever you&apos;re ready.</p><button className="primary-small" onClick={() => setBreakOpen(false)}>Okay!</button></section></div>}
    </div>
  );
}

function ActivityCard({ activity, onClick, compact = false }: { activity: (typeof activities)[number]; onClick: () => void; compact?: boolean }) {
  return (
    <button className={`activity-card ${compact ? "compact" : ""}`} style={{ "--card-color": activity.color } as React.CSSProperties} onClick={onClick} aria-label={`Play ${activity.name}`}>
      <span className="activity-icon" aria-hidden="true">{activity.icon}</span><span className="activity-copy"><b>{activity.shortName}</b>{!compact && <small>{activity.description}</small>}</span><span className="go-bubble" aria-hidden="true">→</span>
    </button>
  );
}
