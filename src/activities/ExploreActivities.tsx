"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityRuntime } from "../App";
import { ActivityShell, BigPrompt, ListenButton, ModeTabs } from "../components/Shared";
import { alphabet, animals, colors, feelings, foods, shapes, vehicles } from "../data/learningContent";
import type { LearningItem } from "../types";
import { optionsAround, sample } from "../utils/random";
import { CategorySort, ColorMixPlay, FeelingComforts, FoodPlatePlay, LetterMatchPlay, NumberComparePlay, NumberFeedPlay, ShapeBuilder, type SortCategory, type SortObject } from "./ActivityExtensions";

type Props = { runtime: ActivityRuntime };

const colorHomes: SortCategory[] = [{ id: "red", name: "Red", icon: "🔴" }, { id: "yellow", name: "Yellow", icon: "🟡" }, { id: "green", name: "Green", icon: "🟢" }];
const colorObjects: SortObject[] = [
  { id: "red-apple", name: "Apple", icon: "🍎", target: "red" }, { id: "strawberry", name: "Strawberry", icon: "🍓", target: "red" },
  { id: "banana", name: "Banana", icon: "🍌", target: "yellow" }, { id: "lemon", name: "Lemon", icon: "🍋", target: "yellow" },
  { id: "leaf", name: "Leaf", icon: "🍃", target: "green" }, { id: "broccoli", name: "Broccoli", icon: "🥦", target: "green" },
];

const animalHomes: SortCategory[] = [{ id: "Farm", name: "Farm", icon: "🏡" }, { id: "Wild", name: "Wild", icon: "🌿" }, { id: "Birds", name: "Birds", icon: "🌤️" }, { id: "Sea", name: "Sea", icon: "🌊" }];
const animalSortObjects: SortObject[] = animals.filter((item) => ["cow", "dog", "lion", "tiger", "parrot", "owl", "fish", "whale"].includes(item.id)).map((item) => ({ id: item.id, name: item.name, icon: item.icon, target: item.group! }));
const foodHomes: SortCategory[] = [{ id: "Fruits", name: "Fruits", icon: "🍓" }, { id: "Veggies", name: "Veggies", icon: "🥕" }];
const foodSortObjects: SortObject[] = foods.filter((item) => ["apple", "banana", "mango", "carrot", "tomato", "broccoli"].includes(item.id)).map((item) => ({ id: item.id, name: item.name, icon: item.icon, target: item.group! }));
const vehicleHomes: SortCategory[] = [{ id: "road", name: "Road", icon: "🛣️" }, { id: "water", name: "Water", icon: "🌊" }, { id: "rail", name: "Rail", icon: "🛤️" }, { id: "sky", name: "Sky", icon: "☁️" }];
const vehicleSortObjects: SortObject[] = [
  { id: "car", name: "Car", icon: "🚗", target: "road" }, { id: "bus", name: "Bus", icon: "🚌", target: "road" },
  { id: "boat", name: "Boat", icon: "⛵", target: "water" }, { id: "ship", name: "Ship", icon: "🚢", target: "water" },
  { id: "train", name: "Train", icon: "🚂", target: "rail" }, { id: "tram", name: "Tram", icon: "🚋", target: "rail" },
  { id: "airplane", name: "Airplane", icon: "✈️", target: "sky" }, { id: "helicopter", name: "Helicopter", icon: "🚁", target: "sky" },
];

export function ColorsActivity({ runtime }: Props) {
  const [mode, setMode] = useState<"explore" | "find" | "sort" | "mix">("explore");
  const [selected, setSelected] = useState(colors[0]);
  const [target, setTarget] = useState(() => sample(colors));
  const options = useMemo(() => optionsAround(target, colors, 4), [target]);

  const choose = (item: LearningItem) => {
    setSelected(item);
    if (mode === "explore") {
      runtime.say(item.name);
      runtime.trackItem("colors", item.id);
    } else if (mode === "find" && item.id === target.id) {
      runtime.trackItem("colors", item.id);
      runtime.reward(`Great! ${item.name}!`);
      window.setTimeout(() => setTarget(sample(colors.filter((color) => color.id !== target.id))), 700);
    }
  };

  return (
    <ActivityShell title="Rainbow Colors" subtitle="Tap every color in the rainbow" icon="🎨" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "find" ? `Can you find ${target.name}?` : mode === "sort" ? "Put each picture with its color." : mode === "mix" ? "Mix the two colors." : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "👆" }, { value: "find", label: "Find", icon: "🔎" }, { value: "sort", label: "Sort", icon: "🧺" }, { value: "mix", label: "Mix", icon: "🥣" }]} onChange={(next) => { setMode(next); if (next === "find") runtime.say(`Can you find ${target.name}?`); }} />
      {mode === "sort" && <CategorySort runtime={runtime} prompt="Put each picture with its color." categories={colorHomes} items={colorObjects} />}
      {mode === "mix" && <ColorMixPlay runtime={runtime} />}
      {mode === "explore" && <div className="feature-stage color-stage" style={{ "--selected-color": selected.color } as React.CSSProperties}><div className="featured-orb" aria-hidden="true">{selected.icon}</div><div><span className="feature-kicker">{selected.name}</span><h2>{selected.association}</h2><p>A {selected.name.toLowerCase()} {selected.association?.toLowerCase()}</p></div></div>}
      {mode === "find" && <BigPrompt>Can you find <strong style={{ color: target.color }}>{target.name}</strong>?</BigPrompt>}
      {(mode === "explore" || mode === "find") && <div className={`learning-grid color-grid ${mode === "find" ? "four-options" : ""}`}>{(mode === "find" ? options : colors).map((item) => <button key={item.id} className={`color-tile ${selected.id === item.id && mode === "explore" ? "chosen" : ""} ${item.id === "white" ? "light-tile" : ""}`} style={{ "--item-color": item.color } as React.CSSProperties} onClick={() => choose(item)} aria-label={item.name}><span className="color-swatch" /><b>{item.name}</b></button>)}</div>}
    </ActivityShell>
  );
}

export function ShapesActivity({ runtime }: Props) {
  const [mode, setMode] = useState<"explore" | "find" | "build">("explore");
  const [selected, setSelected] = useState(shapes[0]);
  const [target, setTarget] = useState(() => sample(shapes));
  const options = useMemo(() => optionsAround(target, shapes, 4), [target]);
  const choose = (item: LearningItem) => {
    setSelected(item);
    if (mode === "explore") runtime.say(item.name);
    else if (mode === "find" && item.id === target.id) { runtime.reward(`Yes! ${item.name}!`); window.setTimeout(() => setTarget(sample(shapes.filter((shape) => shape.id !== target.id))), 700); }
  };
  return (
    <ActivityShell title="Shape Garden" subtitle="Round, pointy, tall, and wide" icon="🔷" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "find" ? `Can you find the ${target.name}?` : mode === "build" ? "Build with shapes." : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "👆" }, { value: "find", label: "Find", icon: "🔎" }, { value: "build", label: "Build", icon: "🏠" }]} onChange={(next) => { setMode(next); if (next === "find") runtime.say(`Can you find the ${target.name}?`); }} />
      {mode === "build" && <ShapeBuilder runtime={runtime} />}
      {mode === "find" && <BigPrompt>Can you find the <strong>{target.name}</strong>?</BigPrompt>}
      {mode === "explore" && <div className="shape-feature"><span className={`css-shape shape-${selected.id}`} style={{ "--shape-color": selected.color } as React.CSSProperties}>{["star","heart"].includes(selected.id) ? selected.icon : ""}</span><div><p className="feature-kicker">{selected.name}</p><h2>{selected.association}</h2><p>A {selected.association?.toLowerCase()} can look like a {selected.name.toLowerCase()}.</p></div></div>}
      {(mode === "explore" || mode === "find") && <div className={`learning-grid shape-grid ${mode === "find" ? "four-options" : ""}`}>{(mode === "find" ? options : shapes).map((item) => <button key={item.id} className="shape-tile" onClick={() => choose(item)}><span className={`css-shape small shape-${item.id}`} style={{ "--shape-color": item.color } as React.CSSProperties}>{["star","heart"].includes(item.id) ? item.icon : ""}</span><b>{item.name}</b></button>)}</div>}
    </ActivityShell>
  );
}

export function AlphabetActivity({ runtime }: Props) {
  const groups = [alphabet.slice(0, 6), alphabet.slice(6, 12), alphabet.slice(12, 18), alphabet.slice(18, 24), alphabet.slice(24)];
  const [group, setGroup] = useState(0);
  const [selected, setSelected] = useState(alphabet[0]);
  const [mode, setMode] = useState<"explore" | "match">("explore");
  const choose = (item: LearningItem) => { setSelected(item); runtime.say(item.name); runtime.trackItem("letters", item.id); };
  return (
    <ActivityShell title="ABC Playground" subtitle="Big letters and little words" icon="Aa" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "match" ? "Match the letter to its picture." : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "Aa" }, { value: "match", label: "Match 3", icon: "🧩" }]} onChange={setMode} />
      {mode === "match" ? <LetterMatchPlay runtime={runtime} letters={alphabet} /> : <><div className="alphabet-stage"><div className="giant-letter"><span>{selected.name}</span><small>{selected.name.toLowerCase()}</small></div><div className="alphabet-object"><span aria-hidden="true">{selected.icon}</span><h2>{selected.association}</h2><p>{selected.name} is for {selected.association}</p></div></div><div className="page-dots" role="group" aria-label="Letter groups">{groups.map((_, index) => <button key={index} className={group === index ? "active" : ""} onClick={() => setGroup(index)} aria-label={`Letter group ${index + 1}`} />)}</div><div className="letter-grid">{groups[group].map((item) => <button key={item.id} className={selected.id === item.id ? "selected" : ""} onClick={() => choose(item)}><b>{item.name}</b><span>{item.name.toLowerCase()}</span></button>)}</div><div className="pager"><button disabled={group === 0} onClick={() => setGroup((value) => value - 1)}>← More letters</button><span>{groups[group][0].name} – {groups[group].at(-1)?.name}</span><button disabled={group === groups.length - 1} onClick={() => setGroup((value) => value + 1)}>More letters →</button></div></>}
    </ActivityShell>
  );
}

export function NumbersActivity({ runtime }: Props) {
  const [range, setRange] = useState<"little" | "more">("little");
  const [selected, setSelected] = useState(3);
  const [mode, setMode] = useState<"explore" | "count" | "compare" | "feed">("explore");
  const [target, setTarget] = useState(3);
  const numbers = range === "little" ? Array.from({ length: 10 }, (_, index) => index + 1) : Array.from({ length: 10 }, (_, index) => index + 11);
  const choose = (number: number) => {
    setSelected(number);
    if (mode === "explore") runtime.say(numberName(number));
    else if (mode === "count" && number === target) { runtime.reward(`${numberName(number)}!`); setTarget(sample([1, 2, 3, 4, 5])); }
  };
  return (
    <ActivityShell title="Happy Numbers" subtitle="Tap and count together" icon="123" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "count" ? "How many apples?" : mode === "compare" ? "Which side has more or less?" : mode === "feed" ? "Feed the bunny." : numberName(selected))} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Numbers", icon: "123" }, { value: "count", label: "Count", icon: "🍎" }, { value: "compare", label: "More or Less", icon: "⚖️" }, { value: "feed", label: "Feed", icon: "🐰" }]} onChange={(next) => { setMode(next); if (next === "count") runtime.say("How many apples?"); }} />
      {mode === "explore" && <><div className="number-controls"><ModeTabs value={range} options={[{ value: "little", label: "1 to 10" }, { value: "more", label: "11 to 20" }]} onChange={setRange} /></div><div className="number-stage"><div className="giant-number">{selected}</div><div className="number-dots" aria-label={`${selected} dots`}>{Array.from({ length: selected }, (_, index) => <span key={index} />)}</div></div><div className="number-grid">{numbers.map((number) => <button key={number} className={selected === number ? "selected" : ""} onClick={() => choose(number)}>{number}</button>)}</div></>}
      {mode === "count" && <div className="count-stage"><BigPrompt>How many apples?</BigPrompt><div className="count-objects">{Array.from({ length: target }, (_, index) => <span key={index}>🍎</span>)}</div><div className="count-options">{[1,2,3,4,5].map((number) => <button key={number} onClick={() => choose(number)}>{number}</button>)}</div></div>}
      {mode === "compare" && <NumberComparePlay runtime={runtime} />}
      {mode === "feed" && <NumberFeedPlay runtime={runtime} />}
    </ActivityShell>
  );
}

function numberName(number: number): string {
  return ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen","Twenty"][number];
}

export function AnimalsActivity({ runtime }: Props) {
  const groups = ["Farm", "Wild", "Birds", "Sea"];
  const [group, setGroup] = useState("Farm");
  const [selected, setSelected] = useState(animals[0]);
  const [mode, setMode] = useState<"explore" | "find" | "sort">("explore");
  const [target, setTarget] = useState(() => sample(animals));
  const gameOptions = useMemo(() => optionsAround(target, animals, 3), [target]);
  const choose = (item: LearningItem) => {
    setSelected(item);
    if (mode === "explore") { runtime.say(item.name); runtime.trackItem("animals", item.id); }
    else if (mode === "find" && item.id === target.id) { runtime.trackItem("animals", item.id); runtime.reward(`${item.name}!`); window.setTimeout(() => setTarget(sample(animals.filter((animal) => animal.id !== target.id))), 800); }
  };
  return (
    <ActivityShell title="Animal Friends" subtitle="Tap an animal to hear its name" icon="🦁" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "find" ? `Can you find the ${target.name}?` : mode === "sort" ? "Put each animal in its home." : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "🐾" }, { value: "find", label: "Find", icon: "🔎" }, { value: "sort", label: "Animal Homes", icon: "🏡" }]} onChange={(next) => { setMode(next); if (next === "find") runtime.say(`Can you find the ${target.name}?`); }} />
      {mode === "sort" && <CategorySort runtime={runtime} prompt="Put each animal in its home." categories={animalHomes} items={animalSortObjects} onPlaced={(item) => runtime.trackItem("animals", item.id)} />}
      {mode === "explore" && <><div className="animal-controls"><div className="category-tabs">{groups.map((item) => <button key={item} className={group === item ? "active" : ""} onClick={() => setGroup(item)}>{groupIcon(item)} {item}</button>)}</div></div><div className="animal-feature"><span className="animal-big" aria-hidden="true">{selected.icon}</span><div><span>HELLO, I&apos;M A</span><h2>{selected.name}</h2><button onClick={() => runtime.say(selected.name)}>🔊 {selected.name}</button></div></div></>}
      {mode === "find" && <BigPrompt>Can you find the <strong>{target.name}</strong>?</BigPrompt>}
      {(mode === "explore" || mode === "find") && <div className={`learning-grid animal-grid ${mode === "find" ? "three-options" : ""}`}>{(mode === "find" ? gameOptions : animals.filter((item) => item.group === group)).map((item) => <button key={item.id} onClick={() => choose(item)} className={selected.id === item.id && mode === "explore" ? "chosen" : ""}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b>{mode === "explore" && <small>Tap to hear name</small>}</button>)}</div>}
    </ActivityShell>
  );
}

function groupIcon(group: string) { return group === "Farm" ? "🏡" : group === "Wild" ? "🌿" : group === "Birds" ? "🌤️" : "🌊"; }

export function FoodsActivity({ runtime }: Props) {
  const [group, setGroup] = useState<"Fruits" | "Veggies">("Fruits");
  const [selected, setSelected] = useState(foods[0]);
  const [mode, setMode] = useState<"explore" | "plate" | "sort">("explore");
  const choose = (item: LearningItem) => { setSelected(item); runtime.say(item.name); };
  return (
    <ActivityShell title="Yummy Food" subtitle="Fruits and veggies are full of color" icon="🍎" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "plate" ? "Make a colorful plate." : mode === "sort" ? "Sort fruits and vegetables." : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "🍎" }, { value: "plate", label: "Make a Plate", icon: "🍽️" }, { value: "sort", label: "Sort", icon: "🧺" }]} onChange={setMode} />
      {mode === "plate" && <FoodPlatePlay runtime={runtime} />}
      {mode === "sort" && <CategorySort runtime={runtime} prompt="Sort fruits and vegetables." categories={foodHomes} items={foodSortObjects} />}
      {mode === "explore" && <><ModeTabs value={group} options={[{ value: "Fruits", label: "Fruits", icon: "🍓" }, { value: "Veggies", label: "Veggies", icon: "🥕" }]} onChange={setGroup} /><div className="food-feature"><span aria-hidden="true">{selected.icon}</span><div><p className="feature-kicker">YUM!</p><h2>{selected.name}</h2><p>{foodFact(selected.id)}</p></div></div><div className="learning-grid food-grid">{foods.filter((item) => item.group === group).map((item) => <button key={item.id} className={selected.id === item.id ? "chosen" : ""} onClick={() => choose(item)}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div></>}
    </ActivityShell>
  );
}

function foodFact(id: string): string {
  const facts: Record<string, string> = { apple: "Apples can be red or green.", banana: "Bananas are yellow.", mango: "Mangoes are sweet.", orange: "Oranges are round.", grapes: "Grapes grow in bunches.", watermelon: "Watermelon is big and juicy.", strawberry: "Strawberries have tiny seeds.", pineapple: "Pineapples wear a spiky crown.", carrot: "Carrots are crunchy.", tomato: "Tomatoes are round.", potato: "Potatoes grow underground.", onion: "Onions have many layers.", cucumber: "Cucumbers are cool and green.", broccoli: "Broccoli looks like a tiny tree." };
  return facts[id] ?? "Yummy and colorful!";
}

export function VehiclesActivity({ runtime }: Props) {
  const [selected, setSelected] = useState(vehicles[0]);
  const [moving, setMoving] = useState(0);
  const [mode, setMode] = useState<"explore" | "places">("explore");
  const choose = (item: LearningItem) => { setSelected(item); setMoving((value) => value + 1); runtime.say(item.name); };
  return (
    <ActivityShell title="Things That Go" subtitle="Roll, sail, and fly" icon="🚗" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(mode === "places" ? "Put each vehicle in the right place." : selected.name)} />}>
      <ModeTabs value={mode} options={[{ value: "explore", label: "Explore", icon: "🚗" }, { value: "places", label: "Where It Goes", icon: "🗺️" }]} onChange={setMode} />
      {mode === "places" ? <CategorySort runtime={runtime} prompt="Put each vehicle in the right place." categories={vehicleHomes} items={vehicleSortObjects} /> : <><div className="vehicle-track"><div key={moving} className={`moving-vehicle vehicle-${selected.id}`} aria-hidden="true">{selected.icon}</div><div className="track-line" /></div><div className="vehicle-name"><h2>{selected.name}</h2><p>{vehiclePhrase(selected.id)}</p></div><div className="learning-grid vehicle-grid">{vehicles.map((item) => <button key={item.id} className={selected.id === item.id ? "chosen" : ""} onClick={() => choose(item)}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div></>}
    </ActivityShell>
  );
}

function vehiclePhrase(id: string) { return (["airplane"].includes(id) ? "Up, up in the sky!" : id === "boat" ? "Sailing on the water!" : id === "train" ? "Chugging down the track!" : "Rolling down the road!"); }

export function FeelingsActivity({ runtime }: Props) {
  const [selected, setSelected] = useState(feelings[0]);
  useEffect(() => { runtime.say("How are you feeling today?"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (item: LearningItem) => { setSelected(item); runtime.say(item.name); };
  return (
    <ActivityShell title="Friendly Feelings" subtitle="Every feeling is okay" icon="😊" onHome={runtime.onHome} actions={<ListenButton onClick={() => runtime.say(selected.name)} />}>
      <div className="feeling-stage"><span aria-hidden="true">{selected.icon}</span><div><p className="feature-kicker">I FEEL</p><h2>{selected.name}</h2><p>{feelingPhrase(selected.id)}</p></div></div>
      <div className="learning-grid feeling-grid">{feelings.map((item) => <button key={item.id} className={selected.id === item.id ? "chosen" : ""} onClick={() => choose(item)}><span aria-hidden="true">{item.icon}</span><b>{item.name}</b></button>)}</div>
      <FeelingComforts key={selected.id} runtime={runtime} feelingId={selected.id} />
    </ActivityShell>
  );
}

function feelingPhrase(id: string) { return ({ happy: "A warm, smiley feeling.", sad: "Sometimes we need a cuddle.", angry: "Take a slow, gentle breath.", sleepy: "Time for a cozy rest.", excited: "Something feels extra fun!", surprised: "Oh! What a surprise!" } as Record<string,string>)[id]; }
