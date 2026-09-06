"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActivityRuntime } from "../App";
import { ActivityShell, BigPrompt, ListenButton, ModeTabs } from "../components/Shared";
import { alphabet, animals, bodyParts, colors, foods, shapes, vehicles } from "../data/learningContent";
import type { LearningItem } from "../types";
import { sample, shuffle } from "../utils/random";
import { popSound, tone } from "../utils/sound";

type Props = { runtime: ActivityRuntime };

const matchItems = colors.slice(0, 3);

export function MatchingActivity({ runtime }: Props) {
  const [matched, setMatched] = useState<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [targets, setTargets] = useState(() => shuffle(matchItems));
  const completeMatch = (pieceId: string, targetId: string) => {
    if (pieceId === targetId) {
      const next = matched.includes(pieceId) ? matched : [...matched, pieceId];
      setMatched(next); setHeld(null); runtime.say(`${pieceId}. Match!`);
      if (next.length === matchItems.length) runtime.reward("All matched!");
    } else runtime.say("Try another place!");
  };
  const tryMatch = (id: string) => {
    if (!held) { setHeld(id); return; }
    completeMatch(held, id);
  };
  const reset = () => { setMatched([]); setHeld(null); setTargets(shuffle(matchItems)); };
  return (
    <ActivityShell title="Match It" subtitle="Put every color with its twin" icon="🧩" onHome={runtime.onHome} actions={<button className="activity-tool-button" onClick={reset}>↻ New</button>}>
      <BigPrompt>{matched.length === 3 ? <>Beautiful matching! <span aria-hidden="true">🌟</span></> : held ? <>Now tap the same color below</> : <>Tap or drag a color to its twin</>}</BigPrompt>
      <div className="matching-board">
        <div className="match-pieces" aria-label="Pieces to match">{matchItems.map((item) => <button key={item.id} draggable={!matched.includes(item.id)} disabled={matched.includes(item.id)} className={`match-piece ${held === item.id ? "held" : ""} ${matched.includes(item.id) ? "matched" : ""}`} style={{ "--match-color": item.color } as React.CSSProperties} onClick={() => tryMatch(item.id)} onDragStart={(event) => { event.dataTransfer.setData("text/plain", item.id); setHeld(item.id); }} aria-label={`${item.name} piece`}><span /><b>{matched.includes(item.id) ? "✓" : item.name}</b></button>)}</div>
        <div className="match-arrow" aria-hidden="true">↓</div>
        <div className="match-targets" aria-label="Matching spaces">{targets.map((item) => <button key={item.id} className={`match-target ${matched.includes(item.id) ? "matched" : ""}`} style={{ "--match-color": item.color } as React.CSSProperties} onClick={() => tryMatch(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); completeMatch(event.dataTransfer.getData("text/plain"), item.id); }} aria-label={`${item.name} target`}><span>{matched.includes(item.id) ? "★" : ""}</span></button>)}</div>
      </div>
      {matched.length === 3 && <button className="play-again" onClick={reset}>Play again ↻</button>}
    </ActivityShell>
  );
}

type MemoryCard = LearningItem & { uid: string };

export function MemoryActivity({ runtime }: Props) {
  const [round, setRound] = useState(0);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const cards = useMemo<MemoryCard[]>(() => {
    const chosen = animals.slice(round % 4, (round % 4) + runtime.settings.memoryPairs);
    return shuffle(chosen.flatMap((item) => [{ ...item, uid: `${item.id}-a` }, { ...item, uid: `${item.id}-b` }]));
  }, [round, runtime.settings.memoryPairs]);
  const flip = (card: MemoryCard) => {
    if (busy || open.includes(card.uid) || found.includes(card.id)) return;
    runtime.say(card.name);
    if (open.length === 0) { setOpen([card.uid]); return; }
    const first = cards.find((item) => item.uid === open[0]);
    setOpen([open[0], card.uid]);
    if (first?.id === card.id) {
      const next = [...found, card.id];
      window.setTimeout(() => { setFound(next); setOpen([]); if (next.length === runtime.settings.memoryPairs) runtime.reward("You found every pair!"); }, 500);
    } else {
      setBusy(true);
      window.setTimeout(() => { setOpen([]); setBusy(false); runtime.say("Where is its friend?"); }, 1200);
    }
  };
  const reset = () => { setRound((value) => value + 1); setOpen([]); setFound([]); setBusy(false); };
  return (
    <ActivityShell title="Peek-a-Pair" subtitle="Find two animal friends" icon="🃏" onHome={runtime.onHome} actions={<button className="activity-tool-button" onClick={reset}>↻ New</button>}>
      <BigPrompt>{found.length === runtime.settings.memoryPairs ? "Every friend has a pair!" : "Tap a card. Where is its friend?"}</BigPrompt>
      <div className={`memory-grid pairs-${runtime.settings.memoryPairs}`}>{cards.map((card) => { const visible = open.includes(card.uid) || found.includes(card.id); return <button key={card.uid} className={`memory-card ${visible ? "flipped" : ""} ${found.includes(card.id) ? "found" : ""}`} onClick={() => flip(card)} aria-label={visible ? card.name : "Hidden card"} aria-pressed={visible}><span className="card-back" aria-hidden="true">✦</span><span className="card-face" aria-hidden="true">{card.icon}<b>{card.name}</b></span></button>; })}</div>
      {found.length === runtime.settings.memoryPairs && <button className="play-again" onClick={reset}>More animal friends</button>}
    </ActivityShell>
  );
}

type DrawTool = "brush" | "eraser" | "star" | "heart" | "flower" | "smile";

export function DrawingActivity({ runtime }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const sessionTracked = useRef(false);
  const [color, setColor] = useState("#ef514c");
  const [size, setSize] = useState(28);
  const [tool, setTool] = useState<DrawTool>("brush");

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  };
  const snapshot = () => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    history.current = history.current.slice(-12);
  };
  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    canvas.setPointerCapture(event.pointerId); snapshot();
    if (!sessionTracked.current) { runtime.trackDrawing(); sessionTracked.current = true; }
    const { x, y } = point(event);
    if (["star","heart","flower","smile"].includes(tool)) { stamp(ctx, x, y, tool, color); return; }
    drawing.current = true; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineCap = "round"; ctx.lineJoin = "round";
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const { x, y } = point(event); ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over"; ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => { drawing.current = false; const ctx = canvasRef.current?.getContext("2d"); if (ctx) { ctx.closePath(); ctx.globalCompositeOperation = "source-over"; } };
  const clear = () => { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (canvas && ctx) { snapshot(); ctx.clearRect(0, 0, canvas.width, canvas.height); } };
  const undo = () => { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); const previous = history.current.pop(); if (canvas && ctx && previous) ctx.putImageData(previous, 0, 0); };
  return (
    <ActivityShell title="Draw & Paint" subtitle="Make anything you can imagine" icon="🖍️" onHome={runtime.onHome} actions={<><button className="activity-tool-button" onClick={undo}>↶ Undo</button><button className="activity-tool-button" onClick={clear}>Clear</button></>}>
      <div className="drawing-toolbar">
        <div className="paint-colors" role="group" aria-label="Paint colors">{colors.slice(0, 8).map((item) => <button key={item.id} className={color === item.color ? "selected" : ""} style={{ background: item.color }} onClick={() => { setColor(item.color!); setTool("brush"); }} aria-label={item.name} />)}</div>
        <div className="brush-tools"><button className={tool === "brush" && size === 16 ? "selected" : ""} onClick={() => { setTool("brush"); setSize(16); }}>• Small</button><button className={tool === "brush" && size === 38 ? "selected" : ""} onClick={() => { setTool("brush"); setSize(38); }}>● Big</button><button className={tool === "eraser" ? "selected" : ""} onClick={() => setTool("eraser")}>▱ Eraser</button></div>
        <div className="stamp-tools" role="group" aria-label="Stamps">{(["star","heart","flower","smile"] as DrawTool[]).map((item) => <button key={item} className={tool === item ? "selected" : ""} onClick={() => setTool(item)} aria-label={`${item} stamp`}>{item === "star" ? "★" : item === "heart" ? "♥" : item === "flower" ? "✿" : "☺"}</button>)}</div>
      </div>
      <div className="canvas-wrap"><canvas ref={canvasRef} width={1100} height={610} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} aria-label="Drawing canvas" /></div>
    </ActivityShell>
  );
}

function stamp(ctx: CanvasRenderingContext2D, x: number, y: number, tool: DrawTool, color: string) {
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.font = "96px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const symbol = tool === "star" ? "★" : tool === "heart" ? "♥" : tool === "flower" ? "✿" : "☺";
  ctx.fillText(symbol, x, y); ctx.restore();
}

const pianoNotes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];

export function MusicActivity({ runtime }: Props) {
  const [mode, setMode] = useState<"piano" | "drums" | "animals" | "xylo">("piano");
  const play = (frequency: number, type: OscillatorType = "sine", duration = .42) => { if (runtime.settings.soundOn) tone(frequency, runtime.settings.volume, duration, type); };
  return (
    <ActivityShell title="Music Garden" subtitle="Tap gently and make a tune" icon="🎵" onHome={runtime.onHome}>
      <ModeTabs value={mode} options={[{ value: "piano", label: "Piano", icon: "🎹" }, { value: "drums", label: "Drums", icon: "🥁" }, { value: "animals", label: "Animal Band", icon: "🐮" }, { value: "xylo", label: "Xylophone", icon: "🎶" }]} onChange={setMode} />
      {mode === "piano" && <div className="piano">{pianoNotes.map((note, index) => <button key={note} style={{ "--key-index": index } as React.CSSProperties} onClick={() => play(note)} aria-label={`Piano key ${index + 1}`}><span>{["Do","Re","Mi","Fa","Sol","La","Ti","Do"][index]}</span></button>)}</div>}
      {mode === "drums" && <div className="drum-kit"><button onClick={() => play(90, "sine", .28)}><span>🥁</span><b>BOOM</b></button><button onClick={() => play(170, "triangle", .18)}><span>🪘</span><b>TAP</b></button><button onClick={() => play(310, "square", .12)}><span>✨</span><b>TING</b></button></div>}
      {mode === "animals" && <div className="animal-band">{animals.slice(0, 6).map((item, index) => <button key={item.id} onClick={() => { play(pianoNotes[index], "triangle"); runtime.say(`${item.speech}!`); }}><span>{item.icon}</span><b>{item.speech}</b></button>)}</div>}
      {mode === "xylo" && <div className="xylophone">{pianoNotes.map((note, index) => <button key={note} style={{ width: `${100 - index * 5}%`, "--bar-index": index } as React.CSSProperties} onClick={() => play(note * 1.5, "sine", .55)} aria-label={`Xylophone bar ${index + 1}`} />)}</div>}
      <p className="music-note">🔈 Sounds start softly. Volume lives in the Parent Area.</p>
    </ActivityShell>
  );
}

export function KeyboardActivity({ runtime }: Props) {
  const [key, setKey] = useState("A");
  const item = alphabet.find((letter) => letter.name === key);
  const isNumber = /^\d$/.test(key);
  const handleKey = useCallback((event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (["Backspace","Delete","Escape","Tab"," "].includes(event.key)) event.preventDefault();
    const pressed = event.key.toUpperCase();
    if (/^[A-Z]$/.test(pressed) || /^\d$/.test(pressed)) { setKey(pressed); const letter = alphabet.find((entry) => entry.name === pressed); runtime.say(letter ? `${pressed}. ${letter.association}.` : pressed === "0" ? "Zero" : pressed); if (letter) runtime.trackItem("letters", letter.id); if (runtime.settings.soundOn) tone(sample([340, 380, 420, 460, 500]), runtime.settings.volume, .18); }
  }, [runtime]);
  useEffect(() => { window.addEventListener("keydown", handleKey, { passive: false }); return () => window.removeEventListener("keydown", handleKey); }, [handleKey]);
  return (
    <ActivityShell title="Keyboard Fun" subtitle="Press any letter or number" icon="⌨️" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(item ? `${key}. ${item.association}.` : key)} />}>
      <div className="keyboard-stage" key={key}><div className="key-burst">{key}</div>{item && <div className="key-friend"><span>{item.icon}</span><h2>{item.association}</h2><p>{key} is for {item.association}</p></div>}{isNumber && !item && <div className="key-friend"><div className="key-dots">{Array.from({ length: Number(key) }, (_, index) => <span key={index} />)}</div><h2>{key === "0" ? "Zero" : `${key} happy dots`}</h2></div>}</div>
      <div className="keyboard-hint"><span aria-hidden="true">☝️</span><div><b>Try the real keyboard</b><p>Letters and numbers make a surprise appear.</p></div></div>
    </ActivityShell>
  );
}

type BubbleMode = "colors" | "numbers" | "animals";
type Bubble = { id: number; x: number; y: number; size: number; color: string; popped: boolean; value: string; icon: string };
const bubblePositions = [[8,12,128],[34,8,104],[64,17,138],[82,7,96],[18,52,112],[48,48,144],[76,55,118]];

function makeBubbles(mode: BubbleMode, offset = 0): Bubble[] {
  return bubblePositions.map(([x,y,size], index) => {
    const color = colors[(index + offset) % colors.length]; const animal = animals[(index + offset) % animals.length]; const number = String((index + offset) % 9 + 1);
    return { id: index + offset * 10, x, y, size, color: color.color!, popped: false, value: mode === "colors" ? color.name : mode === "numbers" ? number : animal.name, icon: mode === "animals" ? animal.icon : mode === "numbers" ? number : "" };
  });
}

export function BubbleActivity({ runtime }: Props) {
  const [mode, setMode] = useState<BubbleMode>("colors");
  const [round, setRound] = useState(0);
  const [bubbles, setBubbles] = useState(() => makeBubbles("colors"));
  const [reveal, setReveal] = useState<Bubble | null>(null);
  const changeMode = (next: BubbleMode) => { setMode(next); setReveal(null); setBubbles(makeBubbles(next, round)); };
  const pop = (bubble: Bubble) => {
    if (bubble.popped) return;
    setBubbles((current) => current.map((item) => item.id === bubble.id ? { ...item, popped: true } : item));
    setReveal(bubble);
    if (runtime.settings.soundOn) popSound(runtime.settings.volume);
    runtime.say(bubble.value);
    window.setTimeout(() => { const nextRound = round + 1; setRound(nextRound); setBubbles(makeBubbles(mode, nextRound)); }, 900);
    window.setTimeout(() => setReveal((current) => current?.id === bubble.id ? null : current), 1300);
  };
  return (
    <ActivityShell title="Bubble Pop" subtitle="Slow bubbles for careful little clicks" icon="🫧" onHome={runtime.onHome}>
      <ModeTabs value={mode} options={[{ value: "colors", label: "Colors", icon: "🎨" }, { value: "numbers", label: "Numbers", icon: "123" }, { value: "animals", label: "Animals", icon: "🦁" }]} onChange={changeMode} />
      <div className="bubble-sky">{reveal && <div className="bubble-reveal" aria-live="polite" style={{ "--reveal-color": reveal.color } as React.CSSProperties}><span>{reveal.icon || "●"}</span><b>{reveal.value}</b></div>}{bubbles.map((bubble, index) => <button key={bubble.id} className={`play-bubble ${bubble.popped ? "popped" : ""}`} style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: bubble.size, height: bubble.size, "--bubble-color": bubble.color, "--float-delay": `${index * -.7}s` } as React.CSSProperties} onClick={() => pop(bubble)} aria-label={`Pop ${bubble.value}`}><span>{bubble.popped ? bubble.icon || bubble.value : bubble.icon}</span></button>)}<div className="bubble-ground" aria-hidden="true">🌱 🌼 🌱 🌷 🌱</div></div>
    </ActivityShell>
  );
}

const findChallenges = [
  { prompt: "Can you find the cat?", target: animals[2], options: [animals[2], animals[1], animals[0]] },
  { prompt: "Find the yellow one.", target: colors[3], options: [colors[0], colors[3], colors[2]] },
  { prompt: "Can you find the circle?", target: shapes[0], options: [shapes[2], shapes[1], shapes[0]] },
  { prompt: "Where is the bus?", target: vehicles[1], options: [vehicles[0], vehicles[1], vehicles[5]] },
  { prompt: "Can you find the banana?", target: foods[1], options: [foods[0], foods[1], foods[3]] },
];

export function FindActivity({ runtime }: Props) {
  const [challenge, setChallenge] = useState(0);
  const [wiggle, setWiggle] = useState<string | null>(null);
  const current = findChallenges[challenge];
  useEffect(() => { runtime.say(current.prompt); }, [challenge]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (item: LearningItem) => {
    if (item.id === current.target.id) { runtime.reward("You found it!"); window.setTimeout(() => setChallenge((value) => (value + 1) % findChallenges.length), 800); }
    else { setWiggle(item.id); runtime.say("Try another one!"); window.setTimeout(() => setWiggle(null), 450); }
  };
  return (
    <ActivityShell title="Find It" subtitle="Look closely and tap the answer" icon="🔎" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(current.prompt)} />}>
      <BigPrompt>{current.prompt}</BigPrompt>
      <div className="find-options">{current.options.map((item) => { const isShape = shapes.some((shape) => shape.id === item.id); return <button key={item.id} className={wiggle === item.id ? "try-wiggle" : ""} onClick={() => choose(item)} style={item.color ? { "--find-color": item.color } as React.CSSProperties : undefined}><span className={isShape ? "find-shape-symbol" : ""} aria-hidden="true">{isShape ? item.icon : item.color ? "●" : item.icon}</span><b>{item.name}</b></button>; })}</div>
      <div className="find-progress" aria-label={`Question ${challenge + 1} of ${findChallenges.length}`}>{findChallenges.map((_, index) => <span key={index} className={challenge === index ? "active" : ""} />)}</div>
    </ActivityShell>
  );
}

export function BodyActivity({ runtime }: Props) {
  const [mode, setMode] = useState<"explore" | "find">("explore");
  const [selected, setSelected] = useState(bodyParts[2]);
  const [target, setTarget] = useState(bodyParts[2]);
  const choose = (id: string) => {
    const item = bodyParts.find((part) => part.id === id)!; setSelected(item);
    if (mode === "explore") runtime.say(item.name);
    else if (id === target.id) { runtime.reward(`Yes! ${item.name}!`); setTarget(sample(bodyParts.filter((part) => part.id !== target.id))); }
    else runtime.say("Try another body part!");
  };
  return (
    <ActivityShell title="My Body" subtitle="Tap the friendly picture" icon="🙋" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "find" ? `Where are the ${target.name}?` : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "👆" }, { value: "find", label: "Where is it?", icon: "🔎" }]} onChange={(next) => { setMode(next); if (next === "find") runtime.say(`Where are the ${target.name}?`); }} />
      {mode === "find" && <BigPrompt>Where {target.id === "nose" || target.id === "mouth" || target.id === "head" || target.id === "hair" ? "is" : "are"} the <strong>{target.name}</strong>?</BigPrompt>}
      <div className="body-playground"><div className="body-figure" aria-label="Friendly child body diagram"><div className="figure-hair" /><div className="figure-head"><button className="hotspot head" onClick={() => choose("head")} aria-label="Head" /><button className="hotspot hair" onClick={() => choose("hair")} aria-label="Hair" /><button className="hotspot eye left" onClick={() => choose("eyes")} aria-label="Eyes">•</button><button className="hotspot eye right" onClick={() => choose("eyes")} aria-label="Eyes">•</button><button className="hotspot ear left" onClick={() => choose("ears")} aria-label="Ears" /><button className="hotspot ear right" onClick={() => choose("ears")} aria-label="Ears" /><button className="hotspot nose" onClick={() => choose("nose")} aria-label="Nose">●</button><button className="hotspot mouth" onClick={() => choose("mouth")} aria-label="Mouth">⌣</button></div><div className="figure-body" /><button className="figure-arm left" onClick={() => choose("hands")} aria-label="Left hand">✋</button><button className="figure-arm right" onClick={() => choose("fingers")} aria-label="Right fingers">🤚</button><div className="figure-leg left"><button onClick={() => choose("feet")} aria-label="Left foot">🦶</button></div><div className="figure-leg right"><button onClick={() => choose("feet")} aria-label="Right foot">🦶</button></div></div><div className="body-label"><span>{selected.icon}</span><h2>{selected.name}</h2><p>{bodyPhrase(selected.id)}</p></div></div>
    </ActivityShell>
  );
}

function bodyPhrase(id: string) { return ({ eyes: "Eyes help us see.", ears: "Ears help us hear.", nose: "Our nose helps us smell.", mouth: "Our mouth helps us talk and eat.", hands: "Hands help us hold things.", fingers: "Fingers help us touch and point.", feet: "Feet help us walk.", head: "Our head is up top.", hair: "Hair grows on our head." } as Record<string,string>)[id]; }

type SurpriseChallenge = { prompt: string; target: string; kind: "tap" | "key"; options?: LearningItem[] };
const surpriseChallenges: SurpriseChallenge[] = [
  { prompt: "Pop the star!", target: "star", kind: "tap", options: [shapes[0], shapes[4], shapes[5]] },
  { prompt: "Find the lion!", target: "lion", kind: "tap", options: [animals[0], animals[6], animals[2]] },
  { prompt: "Can you find blue?", target: "blue", kind: "tap", options: [colors[0], colors[1], colors[3]] },
  { prompt: "Press the letter B!", target: "B", kind: "key" },
  { prompt: "Find the circle!", target: "circle", kind: "tap", options: [shapes[2], shapes[0], shapes[1]] },
];

export function SurpriseActivity({ runtime }: Props) {
  const [index, setIndex] = useState(() => sample([0, 1, 2, 3, 4]));
  const current = surpriseChallenges[index];
  const next = useCallback(() => { setIndex((value) => (value + sample([1, 2, 3, 4])) % surpriseChallenges.length); }, []);
  useEffect(() => { runtime.say(current.prompt); }, [current.prompt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (current.kind !== "key") return;
    const listener = (event: KeyboardEvent) => { if (event.key.toUpperCase() === current.target) { runtime.reward("That is B!"); window.setTimeout(next, 900); } else if (/^[a-z]$/i.test(event.key)) runtime.say("Try the letter B!"); };
    window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener);
  }, [current, next, runtime]);
  const tap = (item: LearningItem) => { if (item.id === current.target) { runtime.reward("Surprise! You found it!"); window.setTimeout(next, 900); } else runtime.say("Try another one!"); };
  return (
    <ActivityShell title="Surprise Me!" subtitle="A new tiny adventure every time" icon="🎁" onHome={runtime.onHome} actions={<button className="activity-tool-button" onClick={next}>🎲 Another</button>}>
      <div className="surprise-box"><div className="box-lid" aria-hidden="true">🎁</div><BigPrompt>{current.prompt}</BigPrompt>{current.kind === "key" ? <div className="press-key-stage"><span>B</span><p>Find B on the keyboard</p></div> : <div className="surprise-options">{current.options?.map((item) => { const isColor = colors.some((color) => color.id === item.id); return <button key={item.id} onClick={() => tap(item)} style={item.color ? { "--surprise-color": item.color } as React.CSSProperties : undefined}><span className={isColor ? "surprise-color-dot" : ""} aria-hidden="true">{isColor ? "" : item.icon}</span><b>{item.name}</b></button>; })}</div>}</div>
    </ActivityShell>
  );
}
