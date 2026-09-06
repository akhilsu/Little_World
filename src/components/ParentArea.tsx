"use client";

import { useRef, useState } from "react";
import { activities } from "../data/learningContent";
import type { DailyProgress, Settings } from "../types";

export function ParentGate({ onOpen }: { onOpen: () => void }) {
  const timer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);
  const start = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => { setHolding(false); onOpen(); }, 3000);
  };
  const stop = () => {
    setHolding(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <button
      className={`parent-gate ${holding ? "holding" : ""}`}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) start(); }}
      onKeyUp={stop}
      aria-label="Parent area. Hold for three seconds."
      title="Parents: hold for 3 seconds"
    >
      <span aria-hidden="true">⚙</span>
    </button>
  );
}

export function ParentArea({ settings, progress, onChange, onClose, onReset, onFullscreen }: {
  settings: Settings;
  progress: DailyProgress;
  onChange: (next: Settings) => void;
  onClose: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}) {
  const patch = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });
  const toggleList = (key: "hiddenActivities" | "favorites", id: Settings[typeof key][number]) => {
    const list = settings[key];
    patch(key, list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="parent-panel" role="dialog" aria-modal="true" aria-labelledby="parent-title">
        <header><div><p className="eyebrow">GROWN-UPS ONLY</p><h2 id="parent-title">Parent Area</h2></div><button className="close-button" onClick={onClose} aria-label="Close parent area">×</button></header>

        <div className="progress-strip">
          <div><strong>{progress.colors.length}</strong><span>Colors today</span></div>
          <div><strong>{progress.letters.length}</strong><span>Letters today</span></div>
          <div><strong>{progress.animals.length}</strong><span>Animals today</span></div>
          <div><strong>{progress.drawingSessions}</strong><span>Drawings today</span></div>
        </div>

        <div className="settings-grid">
          <label className="field"><span>Child&apos;s name</span><input value={settings.childName} maxLength={20} onChange={(event) => patch("childName", event.target.value)} /></label>
          <label className="field"><span>Break reminder</span><select value={settings.reminderMinutes} onChange={(event) => patch("reminderMinutes", Number(event.target.value))}><option value={0}>Off</option><option value={10}>10 minutes</option><option value={20}>20 minutes</option><option value={30}>30 minutes</option></select></label>
          <div className="switch-row"><span><label htmlFor="sound-toggle">Play sounds</label><small>Gentle musical feedback</small></span><input id="sound-toggle" type="checkbox" checked={settings.soundOn} onChange={(event) => patch("soundOn", event.target.checked)} /></div>
          <div className="switch-row"><span><label htmlFor="speech-toggle">Speak words</label><small>Warm, friendly female voice when supported</small></span><input id="speech-toggle" type="checkbox" checked={settings.speechOn} onChange={(event) => patch("speechOn", event.target.checked)} /></div>
          <label className="field wide"><span>Volume: {Math.round(settings.volume * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(event) => patch("volume", Number(event.target.value))} /></label>
          <fieldset className="field wide"><legend>Theme</legend><div className="parent-segments"><button className={settings.theme === "day" ? "selected" : ""} onClick={() => patch("theme", "day")}>☀️ Day</button><button className={settings.theme === "calm" ? "selected" : ""} onClick={() => patch("theme", "calm")}>🌙 Calm</button></div></fieldset>
          <fieldset className="field wide"><legend>Animation</legend><div className="parent-segments"><button className={settings.animation === "full" ? "selected" : ""} onClick={() => patch("animation", "full")}>Playful</button><button className={settings.animation === "gentle" ? "selected" : ""} onClick={() => patch("animation", "gentle")}>Gentle</button><button className={settings.animation === "off" ? "selected" : ""} onClick={() => patch("animation", "off")}>Still</button></div></fieldset>
          <fieldset className="field wide"><legend>Memory cards</legend><div className="parent-segments"><button className={settings.memoryPairs === 2 ? "selected" : ""} onClick={() => patch("memoryPairs", 2)}>Little game</button><button className={settings.memoryPairs === 3 ? "selected" : ""} onClick={() => patch("memoryPairs", 3)}>More cards</button></div></fieldset>
        </div>

        <details className="activity-controls"><summary>Choose activities & favorites</summary><div className="activity-control-list">{activities.map((activity) => (
          <div key={activity.id}><span>{activity.icon} {activity.shortName}</span><label><input type="checkbox" checked={!settings.hiddenActivities.includes(activity.id)} onChange={() => toggleList("hiddenActivities", activity.id)} /> Show</label><label><input type="checkbox" checked={settings.favorites.includes(activity.id)} onChange={() => toggleList("favorites", activity.id)} /> Favorite</label></div>
        ))}</div></details>

        <footer className="parent-footer"><button className="secondary-button" onClick={onFullscreen}>⛶ Play Fullscreen</button><button className="danger-soft" onClick={onReset}>Reset today&apos;s progress</button><button className="primary-small" onClick={onClose}>Done</button></footer>
      </section>
    </div>
  );
}
