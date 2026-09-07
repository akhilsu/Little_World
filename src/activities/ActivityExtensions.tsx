"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { ActivityRuntime } from "../App";
import type { LearningItem } from "../types";
import { colors, foods } from "../data/learningContent";
import { BigPrompt, ListenButton } from "../components/Shared";
import { shuffle } from "../utils/random";

export type SortCategory = { id: string; name: string; icon: string };
export type SortObject = { id: string; name: string; icon: string; target: string };

export function CategorySort({ runtime, prompt, categories, items, onPlaced }: {
  runtime: ActivityRuntime;
  prompt: string;
  categories: readonly SortCategory[];
  items: readonly SortObject[];
  onPlaced?: (item: SortObject) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const placedRef = useRef<string[]>([]);
  const [selected, setSelected] = useState("");
  const [tryTarget, setTryTarget] = useState("");
  useEffect(() => { runtime.say(prompt); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { placedRef.current = []; setPlaced([]); setSelected(""); setTryTarget(""); };
  const place = (itemId: string, targetId: string) => {
    if (!itemId || placedRef.current.includes(itemId)) return;
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    if (item.target === targetId) {
      const next = [...placedRef.current, itemId];
      placedRef.current = next;
      setPlaced(next);
      setSelected("");
      onPlaced?.(item);
      runtime.reward(next.length === items.length ? "All sorted!" : `${item.name}!`);
    } else {
      setTryTarget(targetId);
      window.setTimeout(() => setTryTarget(""), 420);
    }
  };
  const drag = (event: DragEvent<HTMLButtonElement>, itemId: string) => {
    event.dataTransfer.setData("text/plain", itemId);
    setSelected(itemId);
  };

  return (
    <div className="extension-play">
      <BigPrompt>{placed.length === items.length ? "Everything has a home!" : prompt}</BigPrompt>
      <div className="inline-listen"><ListenButton onClick={() => runtime.say(prompt)} /></div>
      <p className="tap-hint" id="category-sort-hint">Tap a picture, then tap its home. You can drag it too.</p>
      <div className="sort-items extension-sort-items" aria-describedby="category-sort-hint">
        {items.map((item) => <button key={item.id} draggable={!placed.includes(item.id)} disabled={placed.includes(item.id)} onDragStart={(event) => drag(event, item.id)} className={`${selected === item.id ? "selected" : ""} ${placed.includes(item.id) ? "placed" : ""}`} onClick={() => { setSelected(item.id); runtime.say(item.name); }}><span aria-hidden="true">{placed.includes(item.id) ? "✓" : item.icon}</span><b>{item.name}</b></button>)}
      </div>
      <div className={`sort-baskets extension-sort-baskets homes-${categories.length}`}>
        {categories.map((category) => <button key={category.id} className={tryTarget === category.id ? "try-wiggle" : ""} onClick={() => selected ? place(selected, category.id) : runtime.say(category.name)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), category.id); }} aria-label={`${category.name} home`}><span aria-hidden="true">{category.icon}</span><b>{category.name}</b><small>{placed.filter((id) => items.find((item) => item.id === id)?.target === category.id).length} inside</small></button>)}
      </div>
      {placed.length === items.length && <button className="play-again" onClick={reset}>Sort again ↻</button>}
    </div>
  );
}

const mixRounds = [
  { ids: ["red", "yellow"], result: "Orange", color: "#ed8a35" },
  { ids: ["blue", "yellow"], result: "Green", color: "#55a85a" },
  { ids: ["red", "blue"], result: "Purple", color: "#8d62bd" },
] as const;

export function ColorMixPlay({ runtime }: { runtime: ActivityRuntime }) {
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const chosenRef = useRef<string[]>([]);
  const [tryId, setTryId] = useState("");
  const current = mixRounds[round % mixRounds.length];
  const palette = colors.filter((item) => ["red", "blue", "yellow"].includes(item.id));
  const prompt = `Mix ${current.ids[0]} and ${current.ids[1]}.`;
  useEffect(() => { runtime.say(prompt); }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (item: LearningItem) => {
    if (chosenRef.current.length === 2 || chosenRef.current.includes(item.id)) return;
    if (!current.ids.some((id) => id === item.id)) {
      setTryId(item.id);
      window.setTimeout(() => setTryId(""), 420);
      return;
    }
    const next = [...chosenRef.current, item.id];
    chosenRef.current = next;
    setChosen(next);
    runtime.say(item.name);
    runtime.trackItem("colors", item.id);
    if (next.length === 2) runtime.reward(`${current.result}!`);
  };
  const nextMix = () => { chosenRef.current = []; setRound((value) => value + 1); setChosen([]); setTryId(""); };

  return (
    <div className="extension-play">
      <BigPrompt>{chosen.length === 2 ? `${current.ids[0]} + ${current.ids[1]} = ${current.result}` : prompt}</BigPrompt>
      <div className="color-mixing-stage">
        <div className="mixing-bowl" style={{ "--mix-result": chosen.length === 2 ? current.color : "#f0edf5" } as React.CSSProperties}><span aria-hidden="true">{chosen.length === 2 ? "✨" : "🥣"}</span><b>{chosen.length === 2 ? current.result : "Mix"}</b></div>
        <div className="mix-color-options">{palette.map((item) => <button key={item.id} className={`${chosen.includes(item.id) ? "chosen" : ""} ${tryId === item.id ? "try-wiggle" : ""}`} style={{ "--mix-color": item.color } as React.CSSProperties} onClick={() => choose(item)} disabled={chosen.length === 2}><span aria-hidden="true" /><b>{item.name}</b></button>)}</div>
      </div>
      {chosen.length === 2 && <button className="play-again" onClick={nextMix}>Mix again ↻</button>}
    </div>
  );
}

type BuildPart = { id: string; name: string; icon: string; color: string; slot: number };
const shapeBuilds: { name: string; pieces: BuildPart[] }[] = [
  { name: "house", pieces: [{ id: "roof", name: "Triangle", icon: "▲", color: "#ef777b", slot: 0 }, { id: "home", name: "Square", icon: "■", color: "#73a9eb", slot: 1 }, { id: "door", name: "Rectangle", icon: "▬", color: "#a87955", slot: 2 }] },
  { name: "rocket", pieces: [{ id: "nose", name: "Triangle", icon: "▲", color: "#ef777b", slot: 0 }, { id: "body", name: "Rectangle", icon: "▬", color: "#b091df", slot: 1 }, { id: "window", name: "Circle", icon: "●", color: "#63bddd", slot: 2 }] },
  { name: "face", pieces: [{ id: "face", name: "Circle", icon: "●", color: "#f4c95f", slot: 0 }, { id: "eyes", name: "Oval", icon: "⬭", color: "#63bddd", slot: 1 }, { id: "smile", name: "Heart", icon: "♥", color: "#e87993", slot: 2 }] },
];

export function ShapeBuilder({ runtime }: { runtime: ActivityRuntime }) {
  const [buildIndex, setBuildIndex] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const placedRef = useRef<string[]>([]);
  const build = shapeBuilds[buildIndex % shapeBuilds.length];
  const pieces = useMemo(() => shuffle(build.pieces), [build]);
  const prompt = `Build a ${build.name}.`;
  useEffect(() => { runtime.say(prompt); }, [buildIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = (part: BuildPart) => {
    if (placedRef.current.includes(part.id)) return;
    const next = [...placedRef.current, part.id];
    placedRef.current = next;
    setPlaced(next);
    runtime.say(part.name);
    if (next.length === build.pieces.length) runtime.reward(`A ${build.name}!`);
  };
  const nextBuild = () => { placedRef.current = []; setBuildIndex((value) => value + 1); setPlaced([]); };

  return (
    <div className="extension-play">
      <BigPrompt>{placed.length === build.pieces.length ? `You built a ${build.name}!` : prompt}</BigPrompt>
      <div className={`shape-build-canvas build-${build.name}`} aria-label={`${build.name} made from shapes`}>{build.pieces.map((part) => <span key={part.id} className={`build-slot slot-${part.slot} ${placed.includes(part.id) ? "filled" : ""}`} style={{ color: part.color }} aria-hidden="true">{part.icon}</span>)}</div>
      <div className="shape-build-pieces">{pieces.map((part) => <button key={part.id} disabled={placed.includes(part.id)} className={placed.includes(part.id) ? "placed" : ""} style={{ color: part.color }} onClick={() => add(part)}><span aria-hidden="true">{placed.includes(part.id) ? "✓" : part.icon}</span><b>{part.name}</b></button>)}</div>
      {placed.length === build.pieces.length && <button className="play-again" onClick={nextBuild}>Build another ↻</button>}
    </div>
  );
}

export function LetterMatchPlay({ runtime, letters }: { runtime: ActivityRuntime; letters: readonly LearningItem[] }) {
  const [packIndex, setPackIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [tryId, setTryId] = useState("");
  const [solved, setSolved] = useState(false);
  const solvedRef = useRef(false);
  const pack = useMemo(() => {
    const start = (packIndex % Math.ceil(letters.length / 3)) * 3;
    return letters.slice(start, start + 3);
  }, [letters, packIndex]);
  const target = pack[targetIndex % pack.length];
  const choices = useMemo(() => shuffle(pack), [pack]);
  const prompt = `Which letter starts ${target.association}?`;
  useEffect(() => { runtime.say(prompt); }, [target.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const next = () => {
    if (targetIndex + 1 < pack.length) setTargetIndex((value) => value + 1);
    else { setPackIndex((value) => value + 1); setTargetIndex(0); }
    solvedRef.current = false;
    setSolved(false);
    setTryId("");
  };
  const choose = (item: LearningItem) => {
    if (solvedRef.current) return;
    if (item.id === target.id) {
      solvedRef.current = true;
      setSolved(true);
      runtime.trackItem("letters", item.id);
      runtime.reward(`${item.name} is for ${target.association}!`);
      window.setTimeout(next, 1050);
    } else {
      setTryId(item.id);
      window.setTimeout(() => setTryId(""), 420);
    }
  };
  return (
    <div className="extension-play">
      <BigPrompt>{prompt}</BigPrompt>
      <div className="inline-listen"><ListenButton onClick={() => runtime.say(prompt)} /></div>
      <div className="letter-match-object"><span aria-hidden="true">{target.icon}</span><b>{target.association}</b></div>
      <div className="letter-match-options">{choices.map((item) => <button key={`${target.id}-${item.id}`} disabled={solved} className={tryId === item.id ? "try-wiggle" : ""} onClick={() => choose(item)} aria-label={item.name}><b>{item.name}</b><span>{item.name.toLowerCase()}</span></button>)}</div>
    </div>
  );
}

const compareRounds = [
  { left: 2, right: 4, word: "more", answer: "right", icon: "🍎" },
  { left: 5, right: 3, word: "less", answer: "right", icon: "⭐" },
  { left: 1, right: 3, word: "less", answer: "left", icon: "🫐" },
  { left: 4, right: 2, word: "more", answer: "left", icon: "🐟" },
] as const;

export function NumberComparePlay({ runtime }: { runtime: ActivityRuntime }) {
  const [round, setRound] = useState(0);
  const [trySide, setTrySide] = useState("");
  const [solved, setSolved] = useState(false);
  const solvedRef = useRef(false);
  const current = compareRounds[round % compareRounds.length];
  const prompt = `Which side has ${current.word}?`;
  useEffect(() => { runtime.say(prompt); }, [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (side: "left" | "right") => {
    if (solvedRef.current) return;
    if (side === current.answer) {
      solvedRef.current = true;
      setSolved(true);
      runtime.reward(`${current.word === "more" ? "More" : "Less"}!`);
      window.setTimeout(() => { solvedRef.current = false; setRound((value) => value + 1); setSolved(false); setTrySide(""); }, 1050);
    } else {
      setTrySide(side);
      window.setTimeout(() => setTrySide(""), 420);
    }
  };
  return (
    <div className="extension-play">
      <BigPrompt>{prompt}</BigPrompt>
      <div className="compare-choices">{(["left", "right"] as const).map((side) => { const count = current[side]; return <button key={`${round}-${side}`} disabled={solved} className={trySide === side ? "try-wiggle" : ""} onClick={() => choose(side)} aria-label={`${count} objects`}><span aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index}>{current.icon}</i>)}</span><b>{count}</b></button>; })}</div>
    </div>
  );
}

const littleFeedTargets = [2, 4, 1, 3, 5];
export function NumberFeedPlay({ runtime }: { runtime: ActivityRuntime }) {
  const [round, setRound] = useState(0);
  const [fed, setFed] = useState(0);
  const fedRef = useRef(0);
  const target = littleFeedTargets[round % littleFeedTargets.length];
  const prompt = `Give the bunny ${target} apples.`;
  useEffect(() => { runtime.say(prompt); }, [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const feed = () => {
    if (fedRef.current >= target) return;
    const next = fedRef.current + 1;
    fedRef.current = next;
    setFed(next);
    runtime.say(["zero", "one", "two", "three", "four", "five"][next]);
    if (next === target) {
      runtime.reward(`All ${target}!`);
      window.setTimeout(() => { fedRef.current = 0; setRound((value) => value + 1); setFed(0); }, 1150);
    }
  };
  return (
    <div className="extension-play">
      <BigPrompt>{prompt}</BigPrompt>
      <div className="number-feed-mini"><span className="mini-bunny" aria-label="Bunny">🐰</span><button onClick={feed} disabled={fed >= target} aria-label="Feed one apple"><span aria-hidden="true">🍎</span><b>Feed</b></button></div>
      <div className="mini-feed-count" aria-live="polite">{Array.from({ length: target }, (_, index) => <span key={index} aria-hidden="true">{index < fed ? "🍎" : "○"}</span>)}</div>
    </div>
  );
}

export function FoodPlatePlay({ runtime }: { runtime: ActivityRuntime }) {
  const [onPlate, setOnPlate] = useState<string[]>([]);
  const onPlateRef = useRef<string[]>([]);
  const celebratedRef = useRef(false);
  const choices = foods.slice(0, 8);
  const add = (item: LearningItem) => {
    runtime.say(item.name);
    if (onPlateRef.current.includes(item.id) || onPlateRef.current.length >= 5) return;
    const next = [...onPlateRef.current, item.id];
    onPlateRef.current = next;
    setOnPlate(next);
    if (next.length === 3 && !celebratedRef.current) { celebratedRef.current = true; runtime.reward("A colorful plate!"); }
  };
  const clear = () => { onPlateRef.current = []; celebratedRef.current = false; setOnPlate([]); };
  return (
    <div className="extension-play">
      <BigPrompt>Make a colorful plate!</BigPrompt>
      <div className="food-plate" aria-label={`${onPlate.length} foods on the plate`}>{onPlate.length ? onPlate.map((id) => <span key={id} aria-hidden="true">{foods.find((item) => item.id === id)?.icon}</span>) : <small>Tap food to add it</small>}</div>
      <div className="plate-food-options">{choices.map((item) => <button key={item.id} className={onPlate.includes(item.id) ? "chosen" : ""} disabled={onPlate.length >= 5 && !onPlate.includes(item.id)} onClick={() => add(item)}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div>
      {onPlate.length > 0 && <button className="play-again" onClick={clear}>Clear plate ↻</button>}
    </div>
  );
}

const rhythmPatterns = [[0], [1, 0], [0, 2], [0, 1, 0], [2, 1, 0]];
export function RhythmCopyPlay({ runtime, playTone }: { runtime: ActivityRuntime; playTone: (index: number) => void }) {
  const [round, setRound] = useState(0);
  const [input, setInput] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState<number | null>(null);
  const [tryPad, setTryPad] = useState<number | null>(null);
  const inputRef = useRef<number[]>([]);
  const playingRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const pattern = rhythmPatterns[round % rhythmPatterns.length];

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };
  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };
  const demonstrate = () => {
    if (playingRef.current) return;
    clearTimers();
    playingRef.current = true;
    setPlaying(true);
    inputRef.current = [];
    setInput([]);
    runtime.say("Listen, then copy the rhythm.");
    pattern.forEach((pad, index) => later(() => { setLit(pad); playTone(pad); later(() => setLit(null), 300); }, 850 + index * 650));
    later(() => { playingRef.current = false; setPlaying(false); }, 1050 + pattern.length * 650);
  };
  useEffect(() => {
    const timer = window.setTimeout(demonstrate, 0);
    return () => { window.clearTimeout(timer); clearTimers(); playingRef.current = false; };
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (pad: number) => {
    if (playingRef.current) return;
    playTone(pad);
    const expected = pattern[inputRef.current.length];
    if (pad !== expected) {
      setTryPad(pad);
      inputRef.current = [];
      setInput([]);
      later(() => setTryPad(null), 420);
      return;
    }
    const next = [...inputRef.current, pad];
    inputRef.current = next;
    setInput(next);
    if (next.length === pattern.length) {
      playingRef.current = true;
      setPlaying(true);
      runtime.reward("Lovely rhythm!");
      later(() => { inputRef.current = []; setRound((value) => value + 1); setInput([]); }, 1100);
    }
  };
  return (
    <div className="extension-play">
      <BigPrompt>{playing ? "Listen…" : input.length ? "Keep going!" : "Now copy it!"}</BigPrompt>
      <div className="rhythm-progress" aria-label={`${input.length} of ${pattern.length} beats copied`}>{pattern.map((_, index) => <span key={index} className={index < input.length ? "active" : ""} />)}</div>
      <div className="rhythm-pads">{[0, 1, 2].map((pad) => <button key={pad} disabled={playing} className={`${lit === pad ? "lit" : ""} ${tryPad === pad ? "try-wiggle" : ""}`} style={{ "--rhythm-color": ["#ef777b", "#63bddd", "#f4c95f"][pad] } as React.CSSProperties} onClick={() => tap(pad)} aria-label={`Music pad ${pad + 1}`}><span aria-hidden="true">{["●", "▲", "★"][pad]}</span></button>)}</div>
      <button className="play-again" disabled={playing} onClick={demonstrate}>🔊 Hear rhythm</button>
    </div>
  );
}

const comfortChoices: Record<string, { name: string; icon: string; text: string }[]> = {
  happy: [{ name: "Smile", icon: "😊", text: "Share a warm smile." }, { name: "Cuddle", icon: "🤗", text: "A happy cuddle." }],
  sad: [{ name: "Cuddle", icon: "🤗", text: "A cozy cuddle can help." }, { name: "Rest", icon: "🛏️", text: "A quiet little rest." }],
  angry: [{ name: "Breathe", icon: "🌿", text: "One slow, gentle breath." }, { name: "Cuddle", icon: "🤗", text: "A cuddle when ready." }],
  sleepy: [{ name: "Rest", icon: "🛏️", text: "Time for a cozy rest." }, { name: "Cuddle", icon: "🤗", text: "Snuggle up softly." }],
  excited: [{ name: "Breathe", icon: "🌿", text: "A slow breath together." }, { name: "Smile", icon: "😊", text: "Enjoy the happy feeling." }],
  surprised: [{ name: "Cuddle", icon: "🤗", text: "Stay close and cozy." }, { name: "Breathe", icon: "🌿", text: "A gentle breath." }],
};

export function FeelingComforts({ runtime, feelingId }: { runtime: ActivityRuntime; feelingId: string }) {
  const [selected, setSelected] = useState("");
  const choices = comfortChoices[feelingId] ?? comfortChoices.happy;
  return (
    <div className="comfort-row" aria-label="Gentle things that may help">{choices.map((choice) => <button key={choice.name} className={selected === choice.name ? "selected" : ""} onClick={() => { setSelected(choice.name); runtime.say(choice.name); }}><span aria-hidden="true">{choice.icon}</span><b>{choice.name}</b><small>{choice.text}</small></button>)}</div>
  );
}
