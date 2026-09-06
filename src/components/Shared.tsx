"use client";

import React, { type CSSProperties, type ReactNode } from "react";

export function ActivityShell({ title, subtitle, icon, onHome, children, actions }: {
  title: string; subtitle: string; icon: string; onHome: () => void; children: ReactNode; actions?: ReactNode;
}) {
  return (
    <main className="activity-page">
      <header className="activity-header">
        <button className="home-button" onClick={onHome} aria-label="Go home"><span aria-hidden="true">⌂</span> Home</button>
        <div className="activity-heading">
          <span className="activity-heading-icon" aria-hidden="true">{icon}</span>
          <div><h1>{title}</h1><p>{subtitle}</p></div>
        </div>
        <div className="activity-actions">{actions}</div>
      </header>
      <div className="activity-body">{children}</div>
    </main>
  );
}

export function ModeTabs<T extends string>({ value, options, onChange, label = "Play mode" }: {
  value: T; options: { value: T; label: string; icon?: string }[]; onChange: (value: T) => void; label?: string;
}) {
  return (
    <div className="mode-tabs" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} className={value === option.value ? "active" : ""} onClick={() => onChange(option.value)} aria-pressed={value === option.value}>
          {option.icon && <span aria-hidden="true">{option.icon}</span>} {option.label}
        </button>
      ))}
    </div>
  );
}

export function Celebration({ burst, phrase }: { burst: number; phrase: string }) {
  if (!burst) return null;
  return (
    <div className="celebration" key={burst} aria-live="polite" aria-atomic="true">
      <div className="celebration-phrase">{phrase}</div>
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className="sparkle" style={{ "--sparkle-index": index } as CSSProperties} aria-hidden="true">{index % 3 === 0 ? "★" : "✦"}</span>
      ))}
    </div>
  );
}

export function BigPrompt({ children }: { children: ReactNode }) {
  return <div className="big-prompt" aria-live="polite">{children}</div>;
}

export function ListenButton({ onClick, label = "Hear it again" }: { onClick: () => void; label?: string }) {
  return <button className="listen-button" onClick={onClick} aria-label={label}>🔊 <span>Listen</span></button>;
}

export class ErrorBoundary extends React.Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <main className="soft-error">
          <span aria-hidden="true">🌤️</span>
          <h1>Let&apos;s try that again</h1>
          <p>Nothing is lost. We can hop back home.</p>
          <button className="play-button" onClick={() => window.location.reload()}>Back to my world</button>
        </main>
      );
    }
    return this.props.children;
  }
}
