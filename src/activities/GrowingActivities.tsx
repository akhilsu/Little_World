"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import type { ActivityRuntime } from "../App";
import type { LearningItem } from "../types";
import { optionsAround, sample, shuffle } from "../utils/random";
import { ActivityShell, BigPrompt, ListenButton, ModeTabs } from "../components/Shared";

type EverydayGroup = "Home" | "Toys" | "Clothes" | "Bathroom";

const everydayThings: LearningItem[] = [
  ["chair", "Chair", "🪑", "Home"], ["bed", "Bed", "🛏️", "Home"], ["lamp", "Lamp", "💡", "Home"], ["cup", "Cup", "🥤", "Home"], ["spoon", "Spoon", "🥄", "Home"],
  ["ball", "Ball", "⚽", "Toys"], ["teddy", "Teddy", "🧸", "Toys"], ["blocks", "Blocks", "🧱", "Toys"], ["drum", "Drum", "🥁", "Toys"], ["book", "Book", "📖", "Toys"],
  ["shirt", "Shirt", "👕", "Clothes"], ["shoes", "Shoes", "👟", "Clothes"], ["hat", "Hat", "🧢", "Clothes"], ["socks", "Socks", "🧦", "Clothes"], ["jacket", "Jacket", "🧥", "Clothes"],
  ["toothbrush", "Toothbrush", "🪥", "Bathroom"], ["soap", "Soap", "🧼", "Bathroom"], ["bath", "Bath", "🛁", "Bathroom"], ["mirror", "Mirror", "🪞", "Bathroom"], ["toilet", "Toilet", "🚽", "Bathroom"],
].map(([id, name, icon, group]) => ({ id, name, icon, group }));

const everydayGroups: EverydayGroup[] = ["Home", "Toys", "Clothes", "Bathroom"];

export function EverydayActivity({ runtime }: { runtime: ActivityRuntime }) {
  const [mode, setMode] = useState<"explore" | "find">("explore");
  const [group, setGroup] = useState<EverydayGroup>("Home");
  const [selected, setSelected] = useState(everydayThings[0]);
  const [target, setTarget] = useState(() => sample(everydayThings));
  const [solved, setSolved] = useState(false);
  const [tryAgain, setTryAgain] = useState("");
  const groupItems = everydayThings.filter((item) => item.group === group);
  const choices = useMemo(() => optionsAround(target, everydayThings, 3), [target]);
  const question = `Can you find the ${target.name}?`;
  useEffect(() => { if (mode === "find") runtime.say(question); }, [mode, target.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextTarget = () => {
    setTarget(sample(everydayThings.filter((item) => item.id !== target.id)));
    setSolved(false);
    setTryAgain("");
  };

  const choose = (item: LearningItem) => {
    if (solved) return;
    if (item.id === target.id) {
      setSolved(true);
      setSelected(item);
      runtime.reward(`${item.name}!`);
      window.setTimeout(nextTarget, 1050);
    } else {
      setTryAgain(item.id);
      window.setTimeout(() => setTryAgain(""), 420);
    }
  };

  return (
    <ActivityShell title="Everyday Things" subtitle="Name the little things around us" icon="🏡" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "find" ? question : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "👋" }, { value: "find", label: "Find it", icon: "🔎" }]} onChange={(value) => { setMode(value); setTryAgain(""); }} />
      {mode === "explore" ? (
        <>
          <div className="everyday-feature"><span aria-hidden="true">{selected.icon}</span><div><small>{selected.group}</small><h2>{selected.name}</h2></div></div>
          <div className="growth-filter-tabs" role="group" aria-label="Everyday thing group">
            {everydayGroups.map((name) => <button key={name} className={name === group ? "active" : ""} aria-pressed={name === group} onClick={() => { setGroup(name); const first = everydayThings.find((item) => item.group === name) ?? everydayThings[0]; setSelected(first); }}>{name}</button>)}
          </div>
          <div className="learning-grid everyday-grid">{groupItems.map((item) => <button key={item.id} className={selected.id === item.id ? "chosen" : ""} onClick={() => { setSelected(item); runtime.say(item.name); }}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div>
        </>
      ) : (
        <>
          <BigPrompt>{question}</BigPrompt>
          <div className="growth-choice-grid three-choices">{choices.map((item) => <button key={`${target.id}-${item.id}`} className={tryAgain === item.id ? "try-wiggle" : ""} disabled={solved} onClick={() => choose(item)} aria-label={item.name}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div>
        </>
      )}
    </ActivityShell>
  );
}

type SortBasket = { id: string; name: string; icon: string };
type SortItem = LearningItem & { basket: string };
type SortRound = { prompt: string; baskets: [SortBasket, SortBasket]; items: SortItem[] };

const sortRounds: SortRound[] = [
  { prompt: "Food or animal?", baskets: [{ id: "food", name: "Food", icon: "🍽️" }, { id: "animal", name: "Animals", icon: "🐾" }], items: [["apple", "Apple", "🍎", "food"], ["banana", "Banana", "🍌", "food"], ["cat", "Cat", "🐱", "animal"], ["dog", "Dog", "🐶", "animal"]].map(([id, name, icon, basket]) => ({ id, name, icon, basket })) },
  { prompt: "Clothes or toys?", baskets: [{ id: "clothes", name: "Clothes", icon: "👕" }, { id: "toys", name: "Toys", icon: "🧸" }], items: [["hat", "Hat", "🧢", "clothes"], ["shoes", "Shoes", "👟", "clothes"], ["ball", "Ball", "⚽", "toys"], ["blocks", "Blocks", "🧱", "toys"]].map(([id, name, icon, basket]) => ({ id, name, icon, basket })) },
  { prompt: "Land or water?", baskets: [{ id: "land", name: "Land", icon: "🌳" }, { id: "water", name: "Water", icon: "🌊" }], items: [["car", "Car", "🚗", "land"], ["bus", "Bus", "🚌", "land"], ["boat", "Boat", "⛵", "water"], ["fish", "Fish", "🐟", "water"]].map(([id, name, icon, basket]) => ({ id, name, icon, basket })) },
];

export function SortingActivity({ runtime }: { runtime: ActivityRuntime }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tryBasket, setTryBasket] = useState("");
  const current = sortRounds[roundIndex % sortRounds.length];
  useEffect(() => { runtime.say(current.prompt); }, [roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const newMix = () => {
    setRoundIndex((value) => value + 1);
    setPlaced([]);
    setSelectedId("");
    setTryBasket("");
  };

  const place = (itemId: string, basketId: string) => {
    if (!itemId || placed.includes(itemId)) return;
    const item = current.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    if (item.basket === basketId) {
      const next = [...placed, itemId];
      setPlaced(next);
      setSelectedId("");
      runtime.reward(`${item.name}!`);
      if (next.length === current.items.length) window.setTimeout(newMix, 1150);
    } else {
      setTryBasket(basketId);
      window.setTimeout(() => setTryBasket(""), 420);
    }
  };

  const startDrag = (event: DragEvent<HTMLButtonElement>, itemId: string) => {
    event.dataTransfer.setData("text/plain", itemId);
    setSelectedId(itemId);
  };

  return (
    <ActivityShell title="Sort & Group" subtitle="Tap a friend, then tap its basket" icon="🧺" onHome={runtime.onHome} actions={<><ListenButton onClick={() => runtime.say(current.prompt)} /><button className="activity-tool-button" onClick={newMix}>↻ <span>New mix</span></button></>}>
      <BigPrompt>{current.prompt}</BigPrompt>
      <p className="tap-hint" id="sort-hint">Tap a picture, then its matching basket. You can drag it too.</p>
      <div className="sort-items" aria-describedby="sort-hint">{current.items.map((item) => <button key={`${roundIndex}-${item.id}`} draggable={!placed.includes(item.id)} disabled={placed.includes(item.id)} onDragStart={(event) => startDrag(event, item.id)} className={`${selectedId === item.id ? "selected" : ""} ${placed.includes(item.id) ? "placed" : ""}`} onClick={() => { setSelectedId(item.id); runtime.say(item.name); }}><span aria-hidden="true">{placed.includes(item.id) ? "✓" : item.icon}</span><b>{item.name}</b></button>)}</div>
      <div className="sort-baskets">{current.baskets.map((basket) => <button key={basket.id} className={tryBasket === basket.id ? "try-wiggle" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), basket.id); }} onClick={() => selectedId ? place(selectedId, basket.id) : runtime.say(basket.name)} aria-label={`${basket.name} basket`}><span aria-hidden="true">{basket.icon}</span><b>{basket.name}</b><small>{placed.filter((id) => current.items.find((item) => item.id === id)?.basket === basket.id).length} inside</small></button>)}</div>
    </ActivityShell>
  );
}

const feedingRounds = [
  { animal: "🐰", animalName: "Rabbit", food: "🥕", foodName: "carrots" },
  { animal: "🐵", animalName: "Monkey", food: "🍌", foodName: "bananas" },
  { animal: "🐻", animalName: "Bear", food: "🫐", foodName: "berries" },
  { animal: "🦆", animalName: "Duck", food: "🫛", foodName: "peas" },
];
const feedingTargets = [3, 1, 4, 2, 5];
const numberNames = ["zero", "one", "two", "three", "four", "five"];

export function CountFeedActivity({ runtime }: { runtime: ActivityRuntime }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [fed, setFed] = useState(0);
  const [complete, setComplete] = useState(false);
  const round = feedingRounds[roundIndex % feedingRounds.length];
  const target = feedingTargets[roundIndex % feedingTargets.length];
  const prompt = `Feed the ${round.animalName} ${target} ${round.foodName}.`;
  useEffect(() => { runtime.say(prompt); }, [roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const newSnack = () => {
    setRoundIndex((value) => value + 1);
    setFed(0);
    setComplete(false);
  };

  const feedOne = () => {
    if (complete) return;
    const next = fed + 1;
    setFed(next);
    runtime.say(numberNames[next]);
    if (next === target) {
      setComplete(true);
      runtime.reward(`All ${target}!`);
      window.setTimeout(newSnack, 1250);
    }
  };

  return (
    <ActivityShell title="Count & Feed" subtitle="One tasty bite at a time" icon="🥕" onHome={runtime.onHome} actions={<><ListenButton onClick={() => runtime.say(prompt)} /><button className="activity-tool-button" onClick={newSnack}>↻ <span>New snack</span></button></>}>
      <BigPrompt>{prompt}</BigPrompt>
      <div className="feeding-stage">
        <div className="feeding-animal" aria-label={round.animalName}><span aria-hidden="true">{round.animal}</span><b>{round.animalName}</b></div>
        <div className="feeding-arrow" aria-hidden="true">→</div>
        <button className="food-pile" onClick={feedOne} disabled={complete} aria-label={`Feed one of ${target} ${round.foodName}`}><span aria-hidden="true">{round.food}</span><b>Tap to feed</b></button>
      </div>
      <div className="feeding-count" aria-live="polite" aria-label={`${fed} of ${target} fed`}>
        {Array.from({ length: target }, (_, index) => <span key={index} className={index < fed ? "fed" : ""} aria-hidden="true">{index < fed ? round.food : "○"}</span>)}
      </div>
      <p className="count-message">{complete ? "Tummy happy!" : `${fed} of ${target}`}</p>
    </ActivityShell>
  );
}

const sizeRounds = [
  { name: "Ball", icon: "⚽", target: "big" },
  { name: "Star", icon: "⭐", target: "small" },
  { name: "Teddy", icon: "🧸", target: "big" },
  { name: "Boat", icon: "⛵", target: "small" },
  { name: "Apple", icon: "🍎", target: "big" },
] as const;

export function BigSmallActivity({ runtime }: { runtime: ActivityRuntime }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [trySize, setTrySize] = useState("");
  const [solved, setSolved] = useState(false);
  const round = sizeRounds[roundIndex % sizeRounds.length];
  const prompt = `Can you find the ${round.target} ${round.name}?`;
  const sizes = roundIndex % 2 === 0 ? (["small", "big"] as const) : (["big", "small"] as const);
  useEffect(() => { runtime.say(prompt); }, [roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextRound = () => {
    setRoundIndex((value) => value + 1);
    setSolved(false);
    setTrySize("");
  };

  const choose = (size: "big" | "small") => {
    if (solved) return;
    if (size === round.target) {
      setSolved(true);
      runtime.reward(`${size === "big" ? "Big" : "Small"} ${round.name}!`);
      window.setTimeout(nextRound, 1050);
    } else {
      setTrySize(size);
      window.setTimeout(() => setTrySize(""), 420);
    }
  };

  return (
    <ActivityShell title="Big & Small" subtitle="Look at size, then choose" icon="🐘" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(prompt)} />}>
      <BigPrompt>{prompt}</BigPrompt>
      <div className="size-choices">{sizes.map((size) => <button key={`${roundIndex}-${size}`} className={`size-choice size-${size} ${trySize === size ? "try-wiggle" : ""}`} disabled={solved} onClick={() => choose(size)} aria-label={`${size} ${round.name}`}><span aria-hidden="true">{round.icon}</span><b>{size === "big" ? "Big" : "Small"}</b></button>)}</div>
    </ActivityShell>
  );
}

type PatternToken = { id: string; name: string; icon: string; color?: string };
type PatternRound = { pieces: PatternToken[]; answer: PatternToken; options: PatternToken[] };

const patternTokens = {
  sun: { id: "sun", name: "Sun", icon: "☀️" }, cloud: { id: "cloud", name: "Cloud", icon: "☁️" }, star: { id: "star", name: "Star", icon: "⭐" },
  apple: { id: "apple", name: "Apple", icon: "🍎" }, banana: { id: "banana", name: "Banana", icon: "🍌" }, grapes: { id: "grapes", name: "Grapes", icon: "🍇" },
  circle: { id: "circle", name: "Circle", icon: "●", color: "#ef6f64" }, square: { id: "square", name: "Square", icon: "■", color: "#5e9ed6" }, triangle: { id: "triangle", name: "Triangle", icon: "▲", color: "#e9ad45" },
  duck: { id: "duck", name: "Duck", icon: "🦆" }, frog: { id: "frog", name: "Frog", icon: "🐸" }, rabbit: { id: "rabbit", name: "Rabbit", icon: "🐰" },
} satisfies Record<string, PatternToken>;

const patternRounds: PatternRound[] = [
  { pieces: [patternTokens.sun, patternTokens.cloud, patternTokens.sun, patternTokens.cloud], answer: patternTokens.sun, options: [patternTokens.sun, patternTokens.cloud, patternTokens.star] },
  { pieces: [patternTokens.apple, patternTokens.apple, patternTokens.banana, patternTokens.apple, patternTokens.apple, patternTokens.banana], answer: patternTokens.apple, options: [patternTokens.apple, patternTokens.banana, patternTokens.grapes] },
  { pieces: [patternTokens.circle, patternTokens.square, patternTokens.circle, patternTokens.square], answer: patternTokens.circle, options: [patternTokens.circle, patternTokens.square, patternTokens.triangle] },
  { pieces: [patternTokens.duck, patternTokens.frog, patternTokens.duck, patternTokens.frog], answer: patternTokens.duck, options: [patternTokens.duck, patternTokens.frog, patternTokens.rabbit] },
];

export function PatternTrainActivity({ runtime }: { runtime: ActivityRuntime }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [tryId, setTryId] = useState("");
  const [solved, setSolved] = useState(false);
  const round = patternRounds[roundIndex % patternRounds.length];
  const choices = useMemo(() => shuffle(round.options), [round]);
  const prompt = "What comes next?";
  useEffect(() => { runtime.say(prompt); }, [roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextPattern = () => {
    setRoundIndex((value) => value + 1);
    setTryId("");
    setSolved(false);
  };

  const choose = (item: PatternToken) => {
    if (solved) return;
    if (item.id === round.answer.id) {
      setSolved(true);
      runtime.reward("You found the pattern!");
      window.setTimeout(nextPattern, 1100);
    } else {
      setTryId(item.id);
      window.setTimeout(() => setTryId(""), 420);
    }
  };

  return (
    <ActivityShell title="Pattern Train" subtitle="Follow the happy little pattern" icon="🚂" onHome={runtime.onHome} actions={<><ListenButton onClick={() => runtime.say(prompt)} /><button className="activity-tool-button" onClick={nextPattern}>↻ <span>New pattern</span></button></>}>
      <BigPrompt>{prompt}</BigPrompt>
      <div className="pattern-train" aria-label={`Pattern: ${round.pieces.map((piece) => piece.name).join(", ")}, then what?`}>
        <span className="train-engine" aria-hidden="true">🚂</span>
        {round.pieces.map((piece, index) => <span key={`${roundIndex}-${index}`} className="pattern-car" style={piece.color ? { color: piece.color } : undefined} aria-hidden="true">{piece.icon}</span>)}
        <span className="pattern-car question-car" aria-hidden="true">?</span>
      </div>
      <div className="pattern-options">{choices.map((item) => <button key={`${roundIndex}-${item.id}`} className={tryId === item.id ? "try-wiggle" : ""} style={item.color ? { color: item.color } : undefined} disabled={solved} onClick={() => choose(item)} aria-label={item.name}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div>
    </ActivityShell>
  );
}

type PuzzlePiece = { id: string; name: string; icon: string };
type PuzzleRound = { name: string; icon: string; pieces: PuzzlePiece[] };

const puzzleRounds: PuzzleRound[] = [
  { name: "Little Garden", icon: "🌈", pieces: [["sun", "Sun", "☀️"], ["flower", "Flower", "🌼"], ["tree", "Tree", "🌳"]].map(([id, name, icon]) => ({ id, name, icon })) },
  { name: "Cozy Room", icon: "🏠", pieces: [["bed", "Bed", "🛏️"], ["lamp", "Lamp", "💡"], ["teddy", "Teddy", "🧸"]].map(([id, name, icon]) => ({ id, name, icon })) },
  { name: "Happy Picnic", icon: "☀️", pieces: [["basket", "Basket", "🧺"], ["apple", "Apple", "🍎"], ["juice", "Juice", "🧃"]].map(([id, name, icon]) => ({ id, name, icon })) },
];

export function PuzzlesActivity({ runtime }: { runtime: ActivityRuntime }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [filled, setFilled] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [trySlot, setTrySlot] = useState("");
  const round = puzzleRounds[roundIndex % puzzleRounds.length];
  const pieces = useMemo(() => shuffle(round.pieces), [round]);
  const prompt = "Tap a piece, then its matching space.";
  useEffect(() => { runtime.say(prompt); }, [roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextPuzzle = () => {
    setRoundIndex((value) => value + 1);
    setFilled([]);
    setSelectedId("");
    setTrySlot("");
  };

  const place = (pieceId: string, slotId: string) => {
    if (!pieceId || filled.includes(pieceId)) return;
    const piece = round.pieces.find((item) => item.id === pieceId);
    if (!piece) return;
    if (pieceId === slotId) {
      const next = [...filled, pieceId];
      setFilled(next);
      setSelectedId("");
      runtime.reward(`${piece.name}!`);
      if (next.length === round.pieces.length) window.setTimeout(nextPuzzle, 1150);
    } else {
      setTrySlot(slotId);
      window.setTimeout(() => setTrySlot(""), 420);
    }
  };

  return (
    <ActivityShell title="Little Puzzles" subtitle="Finish one tiny picture" icon="🧩" onHome={runtime.onHome} actions={<><ListenButton onClick={() => runtime.say(prompt)} /><button className="activity-tool-button" onClick={nextPuzzle}>↻ <span>New puzzle</span></button></>}>
      <BigPrompt>{round.name}</BigPrompt>
      <p className="tap-hint" id="puzzle-hint">{prompt} You can drag it too.</p>
      <div className="puzzle-board" aria-describedby="puzzle-hint">
        <span className="puzzle-sky-icon" aria-hidden="true">{round.icon}</span>
        {round.pieces.map((slot) => <button key={`${roundIndex}-${slot.id}`} className={`puzzle-slot ${filled.includes(slot.id) ? "filled" : ""} ${trySlot === slot.id ? "try-wiggle" : ""}`} disabled={filled.includes(slot.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), slot.id); }} onClick={() => place(selectedId, slot.id)} aria-label={filled.includes(slot.id) ? `${slot.name} placed` : `${slot.name} space`}><span aria-hidden="true">{slot.icon}</span></button>)}
      </div>
      <div className="puzzle-pieces">{pieces.map((piece) => <button key={`${roundIndex}-${piece.id}`} draggable={!filled.includes(piece.id)} disabled={filled.includes(piece.id)} onDragStart={(event) => { event.dataTransfer.setData("text/plain", piece.id); setSelectedId(piece.id); }} className={`${selectedId === piece.id ? "selected" : ""} ${filled.includes(piece.id) ? "placed" : ""}`} onClick={() => { setSelectedId(piece.id); runtime.say(piece.name); }}><span aria-hidden="true">{filled.includes(piece.id) ? "✓" : piece.icon}</span><b>{piece.name}</b></button>)}</div>
    </ActivityShell>
  );
}
