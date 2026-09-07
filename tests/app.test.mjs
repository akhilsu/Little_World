import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the private learning playground shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Avyaan(?:&#x27;|')s Little World/);
  assert.match(html, /Ready to play/);
  assert.match(html, /Let(?:&#x27;|')s Play/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Google Analytics/i);
});

test("routes every promised activity to a working component", async () => {
  const router = await readFile(new URL("../src/activities/ActivitiesRouter.tsx", import.meta.url), "utf8");
  const ids = ["colors","shapes","alphabet","numbers","animals","foods","vehicles","matching","memory","draw","music","keyboard","bubbles","find","feelings","body","surprise"];
  for (const id of ids) assert.match(router, new RegExp(`case ["']${id}["']`));
  assert.doesNotMatch(router, /coming soon|placeholder/i);
});

test("random helpers keep targets and do not mutate source arrays", async () => {
  const source = await readFile(new URL("../src/utils/random.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  const helpers = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const input = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  const before = JSON.stringify(input);
  const shuffled = helpers.shuffle(input);
  assert.equal(shuffled.length, input.length);
  assert.equal(JSON.stringify(input), before);
  const options = helpers.optionsAround(input[0], input, 3);
  assert.equal(options.length, 3);
  assert.ok(options.some((item) => item.id === "a"));
});

test("speech prefers a local friendly female voice and avoids a male-only fallback", async () => {
  const source = await readFile(new URL("../src/utils/speech.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  const speech = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const voice = (name, lang = "en-US", localService = true) => ({ name, lang, localService, default: false, voiceURI: name });

  assert.equal(speech.selectPreferredFemaleVoice([voice("Daniel", "en-GB"), voice("Samantha")]).name, "Samantha");
  assert.equal(speech.selectPreferredFemaleVoice([voice("Google US English Female", "en-US", false), voice("Tessa", "en-ZA")]).name, "Tessa");
  assert.equal(speech.selectPreferredFemaleVoice([voice("Daniel", "en-GB")]), null);
  assert.equal(speech.selectPreferredFemaleVoice([voice("Google US English Female", "en-US", false)]), null);

  const spoken = [];
  let cancelled = 0;
  class MockUtterance {
    constructor(text) { this.text = text; }
  }
  globalThis.SpeechSynthesisUtterance = MockUtterance;
  globalThis.window = {
    speechSynthesis: {
      cancel() { cancelled += 1; },
      getVoices() { return [voice("Daniel", "en-GB"), voice("Samantha")]; },
      speak(utterance) { spoken.push(utterance); },
    },
  };

  try {
    speech.speak("Lovely work!", { enabled: true, volume: 2 });
    assert.equal(spoken.length, 1);
    assert.equal(spoken[0].voice.name, "Samantha");
    assert.equal(spoken[0].lang, "en-US");
    assert.equal(spoken[0].volume, 1);
    assert.equal(spoken[0].rate, 0.86);
    assert.equal(spoken[0].pitch, 1.14);
    speech.speak("Muted", { enabled: false, volume: 1 });
    assert.equal(spoken.length, 1);
    assert.equal(cancelled, 2);
  } finally {
    delete globalThis.window;
    delete globalThis.SpeechSynthesisUtterance;
  }
});

test("learning taps speak names only and correct answers use applause", async () => {
  const [app, explore, games, sounds] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/activities/ExploreActivities.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/activities/GameActivities.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/utils/sound.ts", import.meta.url), "utf8"),
  ]);

  assert.match(app, /clapSound\(settings\.volume\)/);
  assert.doesNotMatch(app, /happySound|say\(nextPhrase\)/);
  assert.match(app, /say\(`Hello \$\{settings\.childName/);
  assert.match(sounds, /export function clapSound/);
  assert.match(sounds, /burstOffsets = \[0, \.08, \.16, \.27, \.39, \.52\]/);

  assert.doesNotMatch(explore, /runtime\.say\([^\n]*(?:association|\.speech|vehicleSound)/);
  assert.doesNotMatch(games, /runtime\.say\([^\n]*(?:association|\.speech)/);
  assert.doesNotMatch(`${explore}\n${games}`, /runtime\.say\("Try /);
  assert.doesNotMatch(`${explore}\n${games}`, /popSound/);
  assert.match(explore, /runtime\.say\(item\.name\)/);
  assert.match(explore, /runtime\.say\("How are you feeling today\?"\)/);
  assert.match(games, /runtime\.reward\(next\.length === runtime\.settings\.memoryPairs/);
});

test("offline metadata and local-only asset policy are present", async () => {
  const [manifest, licenses, layout, serviceWorker] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../ASSET_LICENSES.md", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(licenses, /No runtime asset is loaded from a CDN or external URL/);
  assert.match(serviceWorker, /event\.request\.mode === "navigate"/);
  assert.match(serviceWorker, /fetch\(event\.request\)/);
});

test("production build emits a secure static Cloudflare Pages artifact", async () => {
  const [html, headers] = await Promise.all([
    readFile(new URL("../dist/client/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/_headers", import.meta.url), "utf8"),
  ]);
  assert.match(html, /Ready to play/);
  assert.match(html, /Avyaan(?:&#x27;|')s Little World/);
  assert.match(html, /https:\/\/avyaans-little-world\.pages\.dev\/og\.png/);
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /Permissions-Policy: camera=\(\), microphone=\(\)/);
  assert.match(headers, /X-Frame-Options: DENY/);
});

test("keeps the toddler usability safeguards wired in", async () => {
  const [games, styles, app] = await Promise.all([
    readFile(new URL("../src/activities/GameActivities.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(games, /find-shape-symbol/);
  assert.match(games, /surprise-color-dot/);
  assert.match(games, /bubble-reveal/);
  assert.match(styles, /position:\s*sticky/);
  assert.match(styles, /@keyframes vehicle-run/);
  assert.match(app, /window\.scrollTo/);
});
