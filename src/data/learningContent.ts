import type { ActivityDefinition, LearningItem } from "../types";

export const uiText = {
  en: {
    tagline: "Play • Learn • Discover",
    pickSomething: "Pick something fun",
    tryAnother: "Try another one!",
    foundIt: "You found it!",
    home: "Home",
    listen: "Listen",
    explore: "Explore",
    find: "Find it",
  },
} as const;

export const activities: ActivityDefinition[] = [
  { id: "colors", name: "Colors", shortName: "Colors", icon: "🎨", color: "#ff806e", description: "A rainbow to tap" },
  { id: "shapes", name: "Shapes", shortName: "Shapes", icon: "🔷", color: "#ffb74d", description: "Round, pointy, and more" },
  { id: "alphabet", name: "ABC Playground", shortName: "ABC", icon: "Aa", color: "#63bddd", description: "Letters and little words" },
  { id: "numbers", name: "Numbers", shortName: "Numbers", icon: "123", color: "#7fc77d", description: "Count happy dots" },
  { id: "animals", name: "Animal Friends", shortName: "Animals", icon: "🦁", color: "#f4b34e", description: "Meet and hear animals" },
  { id: "foods", name: "Fruits & Veggies", shortName: "Yummy Food", icon: "🍎", color: "#ef777b", description: "Colorful food friends" },
  { id: "vehicles", name: "Things That Go", shortName: "Vehicles", icon: "🚗", color: "#73a9eb", description: "Roll, sail, and fly" },
  { id: "matching", name: "Match It", shortName: "Match It", icon: "🧩", color: "#b091df", description: "Find the perfect pair" },
  { id: "memory", name: "Peek-a-Pair", shortName: "Memory", icon: "🃏", color: "#e887bc", description: "Where is its friend?" },
  { id: "draw", name: "Draw & Paint", shortName: "Draw", icon: "🖍️", color: "#9c84d9", description: "Make a masterpiece" },
  { id: "music", name: "Music Garden", shortName: "Music", icon: "🎵", color: "#ed8fac", description: "Tap, tinkle, and drum" },
  { id: "keyboard", name: "Keyboard Fun", shortName: "Keyboard", icon: "⌨️", color: "#6ebeb1", description: "Press any letter or number" },
  { id: "bubbles", name: "Bubble Pop", shortName: "Bubbles", icon: "🫧", color: "#68bdda", description: "Pop slow, floaty bubbles" },
  { id: "find", name: "Find It", shortName: "Find It", icon: "🔎", color: "#e7a14f", description: "Look closely and discover" },
  { id: "feelings", name: "Friendly Feelings", shortName: "Feelings", icon: "😊", color: "#f59a79", description: "Faces and feelings" },
  { id: "body", name: "My Body", shortName: "My Body", icon: "🙋", color: "#7cc3a4", description: "Eyes, ears, nose, and toes" },
  { id: "surprise", name: "Surprise Me!", shortName: "Surprise Me", icon: "🎁", color: "#8b7bd3", description: "A tiny mystery game" },
];

export const colors: LearningItem[] = [
  { id: "red", name: "Red", icon: "🍎", color: "#ef514c", association: "Apple" },
  { id: "blue", name: "Blue", icon: "☁️", color: "#438bd4", association: "Sky" },
  { id: "green", name: "Green", icon: "🍃", color: "#55a85a", association: "Leaf" },
  { id: "yellow", name: "Yellow", icon: "🍌", color: "#f5cf45", association: "Banana" },
  { id: "orange", name: "Orange", icon: "🍊", color: "#ed8a35", association: "Orange" },
  { id: "purple", name: "Purple", icon: "🍇", color: "#8d62bd", association: "Grapes" },
  { id: "pink", name: "Pink", icon: "🌸", color: "#ec8cb0", association: "Flower" },
  { id: "black", name: "Black", icon: "🐈‍⬛", color: "#353745", association: "Cat" },
  { id: "white", name: "White", icon: "☁️", color: "#fffdf7", association: "Cloud" },
  { id: "brown", name: "Brown", icon: "🧸", color: "#956448", association: "Teddy" },
];

export const shapes: LearningItem[] = [
  { id: "circle", name: "Circle", icon: "●", color: "#ef6f64", association: "Ball" },
  { id: "square", name: "Square", icon: "■", color: "#5e9ed6", association: "Block" },
  { id: "triangle", name: "Triangle", icon: "▲", color: "#f0b44b", association: "Roof" },
  { id: "rectangle", name: "Rectangle", icon: "▬", color: "#6db986", association: "Door" },
  { id: "star", name: "Star", icon: "★", color: "#f2cb48", association: "Star" },
  { id: "heart", name: "Heart", icon: "♥", color: "#e87993", association: "Love" },
  { id: "oval", name: "Oval", icon: "⬭", color: "#9a79ca", association: "Egg" },
];

export const alphabet: LearningItem[] = [
  ["A","Apple","🍎"],["B","Ball","⚽"],["C","Cat","🐱"],["D","Dog","🐶"],["E","Elephant","🐘"],["F","Fish","🐟"],
  ["G","Grapes","🍇"],["H","House","🏠"],["I","Ice Cream","🍦"],["J","Juice","🧃"],["K","Kite","🪁"],["L","Lion","🦁"],
  ["M","Mango","🥭"],["N","Nest","🪺"],["O","Orange","🍊"],["P","Parrot","🦜"],["Q","Queen","👑"],["R","Rabbit","🐰"],
  ["S","Sun","☀️"],["T","Tiger","🐯"],["U","Umbrella","☂️"],["V","Van","🚐"],["W","Watermelon","🍉"],["X","Xylophone","🎼"],
  ["Y","Yak","🐂"],["Z","Zebra","🦓"],
].map(([letter, word, icon]) => ({ id: letter.toLowerCase(), name: letter, association: word, icon }));

export const animals: LearningItem[] = [
  ["cow","Cow","🐄","Farm","Moo"],["dog","Dog","🐶","Farm","Woof"],["cat","Cat","🐱","Farm","Meow"],["sheep","Sheep","🐑","Farm","Baa"],["horse","Horse","🐴","Farm","Neigh"],["duck","Duck","🦆","Farm","Quack"],
  ["lion","Lion","🦁","Wild","Roar"],["tiger","Tiger","🐯","Wild","Roar"],["elephant","Elephant","🐘","Wild","Trumpet"],["monkey","Monkey","🐵","Wild","Ooh ooh"],["zebra","Zebra","🦓","Wild","Neigh"],["giraffe","Giraffe","🦒","Wild","Hum"],
  ["parrot","Parrot","🦜","Birds","Squawk"],["owl","Owl","🦉","Birds","Hoot"],["crow","Crow","🐦‍⬛","Birds","Caw"],["peacock","Peacock","🦚","Birds","Call"],
  ["fish","Fish","🐟","Sea","Blub blub"],["whale","Whale","🐋","Sea","Whoosh"],["dolphin","Dolphin","🐬","Sea","Click click"],["turtle","Turtle","🐢","Sea","Hello"],
].map(([id,name,icon,group,speech]) => ({ id, name, icon, group, speech }));

export const foods: LearningItem[] = [
  ["apple","Apple","🍎","Fruits"],["banana","Banana","🍌","Fruits"],["mango","Mango","🥭","Fruits"],["orange","Orange","🍊","Fruits"],["grapes","Grapes","🍇","Fruits"],["watermelon","Watermelon","🍉","Fruits"],["strawberry","Strawberry","🍓","Fruits"],["pineapple","Pineapple","🍍","Fruits"],
  ["carrot","Carrot","🥕","Veggies"],["tomato","Tomato","🍅","Veggies"],["potato","Potato","🥔","Veggies"],["onion","Onion","🧅","Veggies"],["cucumber","Cucumber","🥒","Veggies"],["broccoli","Broccoli","🥦","Veggies"],
].map(([id,name,icon,group]) => ({ id, name, icon, group }));

export const vehicles: LearningItem[] = [
  ["car","Car","🚗"],["bus","Bus","🚌"],["train","Train","🚂"],["airplane","Airplane","✈️"],["bicycle","Bicycle","🚲"],
  ["motorcycle","Motorcycle","🏍️"],["boat","Boat","⛵"],["truck","Truck","🚚"],["firetruck","Fire Truck","🚒"],["ambulance","Ambulance","🚑"],
].map(([id,name,icon]) => ({ id, name, icon }));

export const feelings: LearningItem[] = [
  ["happy","Happy","😊"],["sad","Sad","😢"],["angry","Angry","😠"],["sleepy","Sleepy","😴"],["excited","Excited","🤩"],["surprised","Surprised","😮"],
].map(([id,name,icon]) => ({ id, name, icon }));

export const bodyParts: LearningItem[] = [
  ["eyes","Eyes","👀"],["ears","Ears","👂"],["nose","Nose","👃"],["mouth","Mouth","👄"],["hands","Hands","🖐️"],
  ["fingers","Fingers","☝️"],["feet","Feet","🦶"],["head","Head","🙂"],["hair","Hair","〰️"],
].map(([id,name,icon]) => ({ id, name, icon }));

export const encouragingPhrases = ["Great job!", "Wonderful!", "You found it!", "Yay!", "Nice!", "Well done!"];
