import { rm } from "node:fs/promises";

// Vinext's Worker build writes a temporary Wrangler redirect. Pages must use
// the repository's static Pages configuration instead.
await rm(new URL("../.wrangler/deploy/config.json", import.meta.url), { force: true });
