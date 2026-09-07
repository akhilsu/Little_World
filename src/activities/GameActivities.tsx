"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActivityRuntime } from "../App";
import { ActivityShell, BigPrompt, ListenButton, ModeTabs } from "../components/Shared";
import { alphabet, animals, bodyParts, colors, foods, shapes, vehicles } from "../data/learningContent";
import type { ActivityId, LearningItem } from "../types";
import { sample, shuffle } from "../utils/random";
import { tone } from "../utils/sound";
import { RhythmCopyPlay } from "./ActivityExtensions";

type Props = { runtime: ActivityRuntime };

type MatchMode = "colors" | "shadows" | "families";
type MatchPair = { id: string; pieceName: string; pieceIcon?: string; targetName: string; targetIcon?: string; color?: string };
const matchSets: Record<MatchMode, MatchPair[]> = {
  colors: colors.slice(0, 3).map((item) => ({ id: item.id, pieceName: item.name, targetName: item.name, color: item.color })),
  shadows: [
    { id: "cat", pieceName: "Cat", pieceIcon: "🐱", targetName: "Cat shadow", targetIcon: "🐱" },
    { id: "duck", pieceName: "Duck", pieceIcon: "🦆", targetName: "Duck shadow", targetIcon: "🦆" },
    { id: "fish", pieceName: "Fish", pieceIcon: "🐟", targetName: "Fish shadow", targetIcon: "🐟" },
  ],
  families: [
    { id: "dog", pieceName: "Dog", pieceIcon: "🐕", targetName: "Puppy", targetIcon: "🐶" },
    { id: "cat", pieceName: "Cat", pieceIcon: "🐈", targetName: "Kitten", targetIcon: "🐱" },
    { id: "chicken", pieceName: "Chicken", pieceIcon: "🐔", targetName: "Chick", targetIcon: "🐥" },
  ],
};

export function MatchingActivity({ runtime }: Props) {
  const [mode, setMode] = useState<MatchMode>("colors");
  const [matched, setMatched] = useState<string[]>([]);
  const matchedRef = useRef<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [tryTarget, setTryTarget] = useState("");
  const [targets, setTargets] = useState(() => shuffle(matchSets.colors));
  const pairs = matchSets[mode];
  const completeMatch = (pieceId: string, targetId: string) => {
    if (matchedRef.current.includes(pieceId)) return;
    if (pieceId === targetId) {
      const next = [...matchedRef.current, pieceId];
      matchedRef.current = next;
      const name = pairs.find((item) => item.id === pieceId)?.pieceName ?? pieceId;
      setMatched(next); setHeld(null); runtime.reward(next.length === pairs.length ? "All matched!" : `${name}!`);
    } else {
      setTryTarget(targetId);
      window.setTimeout(() => setTryTarget(""), 420);
    }
  };
  const reset = (nextMode = mode) => { matchedRef.current = []; setMatched([]); setHeld(null); setTryTarget(""); setTargets(shuffle(matchSets[nextMode])); };
  const changeMode = (next: MatchMode) => { setMode(next); reset(next); };
  return (
    <ActivityShell title="Match It" subtitle="Put every friend with its twin" icon="🧩" onHome={runtime.onHome} actions={<button className="activity-tool-button" onClick={() => reset()}>↻ New</button>}>
      <ModeTabs value={mode} options={[{ value: "colors", label: "Colors", icon: "🎨" }, { value: "shadows", label: "Shadows", icon: "👤" }, { value: "families", label: "Grown-up & Baby", icon: "🐥" }]} onChange={changeMode} />
      <BigPrompt>{matched.length === pairs.length ? <>Beautiful matching! <span aria-hidden="true">🌟</span></> : held ? <>Now tap its friend below</> : <>Tap or drag a picture to its friend</>}</BigPrompt>
      <div className="matching-board">
        <div className="match-pieces" aria-label="Pieces to match">{pairs.map((item) => <button key={item.id} draggable={!matched.includes(item.id)} disabled={matched.includes(item.id)} className={`match-piece ${item.pieceIcon ? "icon-piece" : ""} ${held === item.id ? "held" : ""} ${matched.includes(item.id) ? "matched" : ""}`} style={{ "--match-color": item.color } as React.CSSProperties} onClick={() => { setHeld(item.id); runtime.say(item.pieceName); }} onDragStart={(event) => { event.dataTransfer.setData("text/plain", item.id); setHeld(item.id); }} aria-label={`${item.pieceName} piece`}><span aria-hidden="true">{item.pieceIcon}</span><b>{matched.includes(item.id) ? "✓" : item.pieceName}</b></button>)}</div>
        <div className="match-arrow" aria-hidden="true">↓</div>
        <div className="match-targets" aria-label="Matching spaces">{targets.map((item) => <button key={item.id} className={`match-target ${item.targetIcon ? "icon-target" : ""} ${mode === "shadows" ? "shadow-target" : ""} ${tryTarget === item.id ? "try-wiggle" : ""} ${matched.includes(item.id) ? "matched" : ""}`} style={{ "--match-color": item.color } as React.CSSProperties} onClick={() => held && completeMatch(held, item.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); completeMatch(event.dataTransfer.getData("text/plain"), item.id); }} aria-label={`${item.targetName} target`}><span aria-hidden="true">{matched.includes(item.id) ? "★" : item.targetIcon}</span><b>{mode === "families" ? item.targetName : ""}</b></button>)}</div>
      </div>
      {matched.length === pairs.length && <button className="play-again" onClick={() => reset()}>Play again ↻</button>}
    </ActivityShell>
  );
}

type MemoryCard = LearningItem & { uid: string };

export function MemoryActivity({ runtime }: Props) {
  const [round, setRound] = useState(0);
  const [pairCount, setPairCount] = useState<2 | 3>(2);
  const [open, setOpen] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const cards = useMemo<MemoryCard[]>(() => {
    const chosen = animals.slice(round % 4, (round % 4) + pairCount);
    return shuffle(chosen.flatMap((item) => [{ ...item, uid: `${item.id}-a` }, { ...item, uid: `${item.id}-b` }]));
  }, [round, pairCount]);
  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };
  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };
  useEffect(() => { if (runtime.settings.memoryPairs !== 2) return; const timer = window.setTimeout(() => setPairCount(2), 0); return () => window.clearTimeout(timer); }, [runtime.settings.memoryPairs]);
  useEffect(() => () => clearTimers(), []);
  const flip = (card: MemoryCard) => {
    if (busyRef.current || busy || open.includes(card.uid) || found.includes(card.id)) return;
    runtime.say(card.name);
    if (open.length === 0) { setOpen([card.uid]); return; }
    const first = cards.find((item) => item.uid === open[0]);
    busyRef.current = true;
    setBusy(true);
    setOpen([open[0], card.uid]);
    if (first?.id === card.id) {
      const next = [...found, card.id];
      later(() => { setFound(next); setOpen([]); busyRef.current = false; setBusy(false); runtime.reward(next.length === pairCount ? "You found every pair!" : `${card.name}!`); }, 500);
    } else {
      later(() => { setOpen([]); busyRef.current = false; setBusy(false); }, 1200);
    }
  };
  const reset = (grow = false) => { clearTimers(); busyRef.current = false; if (grow && runtime.settings.memoryPairs === 3) setPairCount(3); setRound((value) => value + 1); setOpen([]); setFound([]); setBusy(false); };
  return (
    <ActivityShell title="Peek-a-Pair" subtitle="Begin little, grow when ready" icon="🃏" onHome={runtime.onHome} actions={<button className="activity-tool-button" onClick={() => reset(false)}>↻ New</button>}>
      <BigPrompt>{found.length === pairCount ? "Every friend has a pair!" : `Find ${pairCount} little pairs`}</BigPrompt>
      <div className={`memory-grid pairs-${pairCount}`}>{cards.map((card) => { const visible = open.includes(card.uid) || found.includes(card.id); return <button key={card.uid} className={`memory-card ${visible ? "flipped" : ""} ${found.includes(card.id) ? "found" : ""}`} onClick={() => flip(card)} aria-label={visible ? card.name : "Hidden card"} aria-pressed={visible}><span className="card-back" aria-hidden="true">✦</span><span className="card-face" aria-hidden="true">{card.icon}<b>{card.name}</b></span></button>; })}</div>
      {found.length === pairCount && <button className="play-again" onClick={() => reset(true)}>{pairCount === 2 && runtime.settings.memoryPairs === 3 ? "Ready for one more pair?" : "More animal friends"}</button>}
    </ActivityShell>
  );
}

type DrawTool = "brush" | "eraser" | "star" | "heart" | "flower" | "smile" | "rainbow" | "teddy" | "apple";
type DrawMode = "free" | "mirror" | "path";
type GuidePath = "line" | "curve" | "circle";

export function DrawingActivity({ runtime }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const sessionTracked = useRef(false);
  const [color, setColor] = useState("#ef514c");
  const [size, setSize] = useState(28);
  const [tool, setTool] = useState<DrawTool>("brush");
  const [mode, setMode] = useState<DrawMode>("free");
  const [guide, setGuide] = useState<GuidePath>("line");

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
    if (["star","heart","flower","smile","rainbow","teddy","apple"].includes(tool)) { stamp(ctx, x, y, tool, color); if (mode === "mirror") stamp(ctx, canvas.width - x, y, tool, color); return; }
    drawing.current = true; lastPoint.current = { x, y }; ctx.lineCap = "round"; ctx.lineJoin = "round";
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); const previous = lastPoint.current; if (!canvas || !ctx || !previous) return;
    const next = point(event); ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over"; ctx.strokeStyle = color; ctx.lineWidth = size;
    drawSegment(ctx, previous, next);
    if (mode === "mirror") drawSegment(ctx, { x: canvas.width - previous.x, y: previous.y }, { x: canvas.width - next.x, y: next.y });
    lastPoint.current = next;
  };
  const end = () => { drawing.current = false; lastPoint.current = null; const ctx = canvasRef.current?.getContext("2d"); if (ctx) ctx.globalCompositeOperation = "source-over"; };
  const clear = () => { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); if (canvas && ctx) { snapshot(); ctx.clearRect(0, 0, canvas.width, canvas.height); } };
  const undo = () => { const canvas = canvasRef.current; const ctx = canvas?.getContext("2d"); const previous = history.current.pop(); if (canvas && ctx && previous) ctx.putImageData(previous, 0, 0); };
  return (
    <ActivityShell title="Draw & Paint" subtitle="Make anything you can imagine" icon="🖍️" onHome={runtime.onHome} actions={<><button className="activity-tool-button" onClick={undo}>↶ Undo</button><button className="activity-tool-button" onClick={clear}>Clear</button></>}>
      <ModeTabs value={mode} options={[{ value: "free", label: "Free Draw", icon: "🖍️" }, { value: "mirror", label: "Mirror", icon: "🦋" }, { value: "path", label: "Follow a Path", icon: "〰️" }]} onChange={setMode} />
      <div className="drawing-toolbar">
        <div className="paint-colors" role="group" aria-label="Paint colors">{colors.slice(0, 8).map((item) => <button key={item.id} className={color === item.color ? "selected" : ""} style={{ background: item.color }} onClick={() => { setColor(item.color!); setTool("brush"); }} aria-label={item.name} />)}</div>
        <div className="brush-tools"><button className={tool === "brush" && size === 16 ? "selected" : ""} onClick={() => { setTool("brush"); setSize(16); }}>• Small</button><button className={tool === "brush" && size === 38 ? "selected" : ""} onClick={() => { setTool("brush"); setSize(38); }}>● Big</button><button className={tool === "eraser" ? "selected" : ""} onClick={() => setTool("eraser")}>▱ Eraser</button></div>
        <div className="stamp-tools" role="group" aria-label="Shape stamps">{(["star","heart","flower","smile"] as DrawTool[]).map((item) => <button key={item} className={tool === item ? "selected" : ""} onClick={() => setTool(item)} aria-label={`${item} stamp`}>{drawToolIcon(item)}</button>)}</div>
        <div className="stamp-tools sticker-tools" role="group" aria-label="Large stickers">{(["rainbow","teddy","apple"] as DrawTool[]).map((item) => <button key={item} className={tool === item ? "selected" : ""} onClick={() => setTool(item)} aria-label={`${item} sticker`}>{drawToolIcon(item)}</button>)}</div>
      </div>
      {mode === "path" && <div className="growth-filter-tabs guide-tabs" role="group" aria-label="Path shape">{(["line","curve","circle"] as GuidePath[]).map((item) => <button key={item} className={guide === item ? "active" : ""} onClick={() => setGuide(item)}>{item === "line" ? "Straight" : item === "curve" ? "Curve" : "Round"}</button>)}</div>}
      <div className="canvas-wrap guided-canvas">{mode === "mirror" && <div className="mirror-guide" aria-hidden="true" />}{mode === "path" && <div className={`drawing-path-guide guide-${guide}`} aria-hidden="true"><span>START</span></div>}<canvas ref={canvasRef} width={1100} height={610} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} aria-label={mode === "mirror" ? "Symmetry drawing canvas" : mode === "path" ? `${guide} guided drawing canvas` : "Drawing canvas"} /></div>
    </ActivityShell>
  );
}

function stamp(ctx: CanvasRenderingContext2D, x: number, y: number, tool: DrawTool, color: string) {
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.font = `${["rainbow","teddy","apple"].includes(tool) ? 138 : 96}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(drawToolIcon(tool), x, y); ctx.restore();
}

function drawSegment(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) { ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke(); ctx.closePath(); }
function drawToolIcon(tool: DrawTool) { return tool === "star" ? "★" : tool === "heart" ? "♥" : tool === "flower" ? "✿" : tool === "smile" ? "☺" : tool === "rainbow" ? "🌈" : tool === "teddy" ? "🧸" : tool === "apple" ? "🍎" : "•"; }

const pianoNotes = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];

export function MusicActivity({ runtime }: Props) {
  const [mode, setMode] = useState<"piano" | "drums" | "animals" | "xylo" | "rhythm">("piano");
  const play = (frequency: number, type: OscillatorType = "sine", duration = .42) => { if (runtime.settings.soundOn) tone(frequency, runtime.settings.volume, duration, type); };
  return (
    <ActivityShell title="Music Garden" subtitle="Tap gently and make a tune" icon="🎵" onHome={runtime.onHome}>
      <ModeTabs value={mode} options={[{ value: "piano", label: "Piano", icon: "🎹" }, { value: "drums", label: "Drums", icon: "🥁" }, { value: "animals", label: "Animal Band", icon: "🐮" }, { value: "xylo", label: "Xylophone", icon: "🎶" }, { value: "rhythm", label: "Copy Rhythm", icon: "👏" }]} onChange={setMode} />
      {mode === "piano" && <div className="piano">{pianoNotes.map((note, index) => <button key={note} style={{ "--key-index": index } as React.CSSProperties} onClick={() => play(note)} aria-label={`Piano key ${index + 1}`}><span>{["Do","Re","Mi","Fa","Sol","La","Ti","Do"][index]}</span></button>)}</div>}
      {mode === "drums" && <div className="drum-kit"><button onClick={() => play(90, "sine", .28)}><span>🥁</span><b>BOOM</b></button><button onClick={() => play(170, "triangle", .18)}><span>🪘</span><b>TAP</b></button><button onClick={() => play(310, "square", .12)}><span>✨</span><b>TING</b></button></div>}
      {mode === "animals" && <div className="animal-band">{animals.slice(0, 6).map((item, index) => <button key={item.id} onClick={() => { play(pianoNotes[index], "triangle"); runtime.say(item.name); }}><span>{item.icon}</span><b>{item.name}</b></button>)}</div>}
      {mode === "xylo" && <div className="xylophone">{pianoNotes.map((note, index) => <button key={note} style={{ width: `${100 - index * 5}%`, "--bar-index": index } as React.CSSProperties} onClick={() => play(note * 1.5, "sine", .55)} aria-label={`Xylophone bar ${index + 1}`} />)}</div>}
      {mode === "rhythm" && <RhythmCopyPlay runtime={runtime} playTone={(index) => play([261.63, 349.23, 440][index], "triangle", .3)} />}
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
    if (/^[A-Z]$/.test(pressed) || /^\d$/.test(pressed)) { setKey(pressed); const letter = alphabet.find((entry) => entry.name === pressed); runtime.say(letter ? pressed : pressed === "0" ? "Zero" : pressed); if (letter) runtime.trackItem("letters", letter.id); }
  }, [runtime]);
  useEffect(() => { window.addEventListener("keydown", handleKey, { passive: false }); return () => window.removeEventListener("keydown", handleKey); }, [handleKey]);
  return (
    <ActivityShell title="Keyboard Fun" subtitle="Press any letter or number" icon="⌨️" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(key === "0" ? "Zero" : key)} />}>
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
    else { setWiggle(item.id); window.setTimeout(() => setWiggle(null), 450); }
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
  const solving = useRef(false);
  const question = `${["nose", "mouth", "head", "hair"].includes(target.id) ? "Where is" : "Where are"} the ${target.name}?`;
  useEffect(() => { if (mode === "find") runtime.say(question); }, [mode, target.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (id: string) => {
    if (mode === "find" && solving.current) return;
    const item = bodyParts.find((part) => part.id === id)!; setSelected(item);
    if (mode === "explore") runtime.say(item.name);
    else if (id === target.id) { solving.current = true; runtime.reward(`Yes! ${item.name}!`); window.setTimeout(() => { solving.current = false; setTarget(sample(bodyParts.filter((part) => part.id !== target.id))); }, 950); }
  };
  return (
    <ActivityShell title="My Body" subtitle="Tap the friendly picture" icon="🙋" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "find" ? question : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "👆" }, { value: "find", label: "Where is it?", icon: "🔎" }]} onChange={(next) => { solving.current = false; setMode(next); }} />
      {mode === "find" && <BigPrompt>Where {target.id === "nose" || target.id === "mouth" || target.id === "head" || target.id === "hair" ? "is" : "are"} the <strong>{target.name}</strong>?</BigPrompt>}
      <div className="body-playground"><div className="body-figure" aria-label="Friendly child body diagram"><div className="figure-hair" /><div className="figure-head"><button className="hotspot head" onClick={() => choose("head")} aria-label="Head" /><button className="hotspot hair" onClick={() => choose("hair")} aria-label="Hair" /><button className="hotspot eye left" onClick={() => choose("eyes")} aria-label="Eyes">•</button><button className="hotspot eye right" onClick={() => choose("eyes")} aria-label="Eyes">•</button><button className="hotspot ear left" onClick={() => choose("ears")} aria-label="Ears" /><button className="hotspot ear right" onClick={() => choose("ears")} aria-label="Ears" /><button className="hotspot nose" onClick={() => choose("nose")} aria-label="Nose">●</button><button className="hotspot mouth" onClick={() => choose("mouth")} aria-label="Mouth">⌣</button></div><div className="figure-body" /><button className="figure-arm left" onClick={() => choose("hands")} aria-label="Left hand">✋</button><button className="figure-arm right" onClick={() => choose("fingers")} aria-label="Right fingers">🤚</button><div className="figure-leg left"><button onClick={() => choose("feet")} aria-label="Left foot">🦶</button></div><div className="figure-leg right"><button onClick={() => choose("feet")} aria-label="Right foot">🦶</button></div></div><div className="body-label"><span>{selected.icon}</span><h2>{selected.name}</h2><p>{bodyPhrase(selected.id)}</p></div></div>
    </ActivityShell>
  );
}

function bodyPhrase(id: string) { return ({ eyes: "Eyes help us see.", ears: "Ears help us hear.", nose: "Our nose helps us smell.", mouth: "Our mouth helps us talk and eat.", hands: "Hands help us hold things.", fingers: "Fingers help us touch and point.", feet: "Feet help us walk.", head: "Our head is up top.", hair: "Hair grows on our head." } as Record<string,string>)[id]; }

type SurpriseChallenge = { prompt: string; target: string; kind: "tap" | "key"; activity: ActivityId; options?: LearningItem[] };
const surpriseChallenges: SurpriseChallenge[] = [
  { prompt: "Pop the star!", target: "star", kind: "tap", activity: "shapes", options: [shapes[0], shapes[4], shapes[5]] },
  { prompt: "Find the lion!", target: "lion", kind: "tap", activity: "animals", options: [animals[0], animals[6], animals[2]] },
  { prompt: "Can you find blue?", target: "blue", kind: "tap", activity: "colors", options: [colors[0], colors[1], colors[3]] },
  { prompt: "Press the letter B!", target: "B", kind: "key", activity: "alphabet" },
  { prompt: "Find the circle!", target: "circle", kind: "tap", activity: "shapes", options: [shapes[2], shapes[0], shapes[1]] },
];

function nextSurpriseIndex(current: number, activityCounts: ActivityRuntime["activityCounts"]): number {
  const candidates = surpriseChallenges.map((challenge, index) => ({ index, count: activityCounts[challenge.activity] ?? 0 })).filter((item) => item.index !== current);
  const lowest = Math.min(...candidates.map((item) => item.count));
  return sample(candidates.filter((item) => item.count === lowest)).index;
}

export function SurpriseActivity({ runtime }: Props) {
  const [index, setIndex] = useState(() => nextSurpriseIndex(-1, runtime.activityCounts));
  const solving = useRef(false);
  const current = surpriseChallenges[index];
  const next = useCallback(() => { solving.current = false; setIndex((value) => nextSurpriseIndex(value, runtime.activityCounts)); }, [runtime.activityCounts]);
  useEffect(() => { runtime.say(current.prompt); }, [current.prompt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (current.kind !== "key") return;
    const listener = (event: KeyboardEvent) => { if (!solving.current && event.key.toUpperCase() === current.target) { solving.current = true; runtime.reward("That is B!"); window.setTimeout(next, 900); } };
    window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener);
  }, [current, next, runtime]);
  const tap = (item: LearningItem) => { if (!solving.current && item.id === current.target) { solving.current = true; runtime.reward("Surprise! You found it!"); window.setTimeout(next, 900); } };
  return (
    <ActivityShell title="Surprise Me!" subtitle="A new tiny adventure every time" icon="🎁" onHome={runtime.onHome} actions={<button className="activity-tool-button" onClick={next}>🎲 Another</button>}>
      <div className="surprise-box"><div className="box-lid" aria-hidden="true">🎁</div><BigPrompt>{current.prompt}</BigPrompt>{current.kind === "key" ? <div className="press-key-stage"><span>B</span><p>Find B on the keyboard</p></div> : <div className="surprise-options">{current.options?.map((item) => { const isColor = colors.some((color) => color.id === item.id); return <button key={item.id} onClick={() => tap(item)} style={item.color ? { "--surprise-color": item.color } as React.CSSProperties : undefined}><span className={isColor ? "surprise-color-dot" : ""} aria-hidden="true">{isColor ? "" : item.icon}</span><b>{item.name}</b></button>; })}</div>}</div>
    </ActivityShell>
  );
}
