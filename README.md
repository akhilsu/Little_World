# Avyaan's Little World

A private, local-first learning playground made for a curious 2–3 year old. It includes 17 genuinely interactive activities for colors, shapes, ABC, numbers, animals, food, vehicles, matching, memory, drawing, music, keyboard practice, bubbles, visual search, feelings, body parts, and tiny surprise games.

Nothing is sent anywhere. There are no accounts, ads, analytics, external links, cameras, microphones, or network-loaded learning assets. Progress and preferences stay in this browser's local storage.

## Install and run

Install dependencies once:

```bash
npm install
```

Start the local playground:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server selects port 3000 for this project (rather than Vite's usual 5173).

Create and preview a production build:

```bash
npm run build
npm run preview
```

Run all checks:

```bash
npm test
npm run lint
```

The site uses browser Speech Synthesis for spoken feedback and the Web Audio API for generated music and effects. It prefers the warm local “Samantha” voice on macOS, then tries a short list of friendly local female English voices on other systems. Voice availability varies by browser and operating system; speech stays silent rather than falling back to a known male or online voice.

## Parent Area

Press and hold the small gear for about three seconds. The Parent Area can:

- change the child's name;
- mute speech or generated sound independently;
- set volume and animation intensity;
- select Day or Calm mode;
- choose a 2-pair or 3-pair memory game;
- show, hide, and favorite activities;
- change or disable the gentle break reminder;
- reset today's lightweight progress;
- enter fullscreen.

These settings are stored only in local storage on the laptop.

## Common changes

### Change the child's default name

The easiest method is Parent Area → **Child's name**. To change the code default, edit `DEFAULT_CHILD_NAME` in `src/config.ts`. The title is composed from that value, so there is no repeated name to hunt down.

### Add an animal

Add one row to `animals` in `src/data/learningContent.ts` using:

```ts
["goat", "Goat", "🐐", "Farm", "Maa"]
```

The animal explorer and its sound-finding game both use that shared data automatically.

### Add a color

Add a `LearningItem` to `colors` in `src/data/learningContent.ts` with an id, display name, local icon, CSS color, and a familiar association.

### Add or change alphabet content

Edit the `alphabet` rows in `src/data/learningContent.ts`. Each row contains the letter, example word, and locally rendered icon.

### Add audio files

Place openly licensed recordings beneath `public/audio/animals`, `public/audio/effects`, or `public/audio/music`, document each file in `ASSET_LICENSES.md`, and play it from a shared helper in `src/utils/sound.ts`. The current version intentionally generates effects and music instead of shipping recordings.

### Change the session reminder

Use Parent Area → **Break reminder**. Change the code default through `reminderMinutes` in `src/config.ts`.

### Reset progress

Use **Reset today's progress** in Parent Area. To clear everything, including preferences, use the browser's local site-data controls for localhost.

### Add another language

1. Add a new language object beside `uiText.en` in `src/data/learningContent.ts`.
2. Add translated learning arrays in the same data layer; do not translate inside activity components.
3. Add a `language` setting and a Parent Area language selector.
4. Pass the selected content object to activities. Components already keep presentation separate from the shared learning data.

Use a reviewed human translation, especially for Malayalam pronunciation and toddler vocabulary.

## Offline and installable use

The production version registers `public/sw.js`, which caches same-origin files after first use. `public/manifest.webmanifest` enables an installable standalone experience in supporting browsers. Install dependencies and load the production preview once before disconnecting from the internet. Runtime learning content itself has no external dependency.

## Project map

- `app/` — page shell, metadata, and responsive visual system
- `src/App.tsx` — startup, navigation, settings, progress, rewards, and session reminders
- `src/activities/` — all 17 activity implementations
- `src/components/` — reusable activity shell, celebration, error recovery, and Parent Area
- `src/data/learningContent.ts` — English learning data and UI copy architecture
- `src/utils/` — local speech, generated sound, storage, and randomization
- `public/audio/` — organized space for any future local recordings
- `tests/` — rendered-output, activity coverage, and utility tests

## Privacy and safety

The app does not contain tracking code, ad code, external child-facing links, payments, accounts, social functions, uploads, or permission requests. Emoji and CSS provide the illustrations; fonts use local system fonts. See `ASSET_LICENSES.md` for the complete asset statement.
