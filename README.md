# Bedrock Hub — Add-ons & Maps for Minecraft Bedrock

A mobile-first web app for browsing Minecraft **Bedrock Edition** add-ons and maps and
downloading them straight to your phone. Tap a file and your phone hands it off to
Minecraft to import automatically — the same way downloading from CurseForge or MCPEDL
in your phone's browser already works today.

Install it to your home screen (Safari/Chrome "Add to Home Screen") and it behaves like
a real app — it's a Progressive Web App (PWA), so there's no app store review to wait on.

**Live:** [bedrock-hub-livid.vercel.app](https://bedrock-hub-livid.vercel.app) (client, on
Vercel) → [bedrock-hub-server.onrender.com](https://bedrock-hub-server.onrender.com) (API
proxy, on Render's free tier — the first request after it's been idle a while can take
~30s to wake up).

## Why CurseForge, and not Modrinth / Planet Minecraft / MCPEDL / ModBay / MCPE Addons?

- **Modrinth** has a great public API, but it is Java Edition only — there is no
  `bedrock` loader or project type on the platform at all. Anything it returned for a
  "Bedrock" search would actually be Java mods, which Bedrock can't run. Using it here
  would be actively misleading, so it's intentionally left out.
- **Planet Minecraft** has real Bedrock/PE content but no public API at all.
- **MCPEDL** has an internal API that powers its own site, but it isn't a published
  developer program, and its Terms of Use explicitly prohibit exactly this kind of use:
  redistributing site content, or "sidestep[ping] the regular interfaces" to its data.
- **ModBay** has no API, and its Terms of Use directly ban using the site "to build a
  similar or competitive website."
- **MCPE Addons** exposes WordPress's default `/wp-json/` endpoint, but that's not an
  intentional developer API either, and its Terms of Use ban all automated/bot access
  and republishing content elsewhere.

None of the above are things this app works around — CurseForge is the only one of
these sites with an actual self-serve developer program and a Terms of Service that
allows it, which is exactly why the whole app is built around it. The others appear
only as "search on their site" link-outs (see `ExternalSourceLinks.tsx`), which just
sends users there rather than reusing their content.

## Get a CurseForge API key (free, ~2 minutes)

1. Go to [console.curseforge.com](https://console.curseforge.com/) and sign up.
2. Create an API key under "API Keys".
3. Paste it into the app itself: tap the ⚙ icon in the header (or the "Add your key"
   prompt on first launch), paste the key, and hit Save. The app checks it against
   CurseForge immediately and tells you right away if it's wrong.

The key is saved only in your browser's local storage and sent straight to this app's
own server proxy on each request — it's never written to a file, committed, or shared
anywhere else. Because of that, one deployment works for anyone who opens it and adds
their own key, with no redeploying or environment variables to touch.

Running the server with `CURSEFORGE_API_KEY` set in `server/.env` still works too (handy
for local development) — a key saved in the browser always takes priority over it, so
you can mix both without conflict.

## Running locally

```bash
# Terminal 1 — API proxy (talks to CurseForge, keeps your key server-side)
cd server
npm install
npm run dev        # http://localhost:8787

# Terminal 2 — the app itself
cd client
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173` on your phone (same Wi-Fi, use your computer's LAN IP, or
run `npm run dev -- --host`) or in a desktop browser.

## How "download straight to your phone" works

Bedrock registers itself as the handler for `.mcaddon`, `.mcpack`, `.mcworld`, and
`.mctemplate` files on both Android and iOS. Every download button here is a plain link
straight to the file's official CurseForge CDN URL (never re-hosted or proxied through
this app). Tapping it on a phone:

- **Android** — downloads the file, then the "download complete" notification (or the
  browser's own download banner) offers "Open with Minecraft".
- **iOS Safari** — shows a download banner; tapping it offers "Open in Minecraft"
  directly, since Minecraft registers those file types as documents it can open.

If a mod author has disabled third-party distribution for a file (some do, and
CurseForge's API respects that), the button instead links to that file's page on
curseforge.com so you can grab it from there, per CurseForge's terms.

## Project layout

```
server/   Express proxy — hides your CurseForge API key from the browser, resolves the
          "Bedrock Add-Ons" / "Bedrock Maps" category IDs dynamically (CurseForge
          doesn't document stable numeric IDs for them), and forwards search/detail
          requests.
client/   Vite + React + TypeScript PWA — tabs for Add-ons/Maps, search, card grid,
          detail page with gallery/description/file list, installable to a phone's
          home screen via vite-plugin-pwa.
```

## Deploying

**client/ → Vercel** (recommended; free tier, no public/private repo restriction, works
straight from a private GitHub repo, unlike GitHub Pages):

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repo.
2. Set **Root Directory** to `client`. Vercel auto-detects the Vite build command and
   `dist` output — no extra config needed (a `client/vercel.json` is included for the
   SPA rewrite so refreshing a deep link like `/addons/123` doesn't 404).
3. Add an environment variable `VITE_API_BASE` pointing at wherever you deploy the
   server (below). You can leave it unset for now and redeploy once the server is up.
4. Deploy. Vercel gives you a `https://<project>.vercel.app` URL — open that on your
   phone and "Add to Home Screen."

Netlify works the same way (import repo, base directory `client`, build command
`npm run build`, publish directory `dist`) if you'd rather use that instead.

**server/**: any Node host works (Render, Railway, Fly.io, a small VPS...). Set
`CURSEFORGE_API_KEY` and `CLIENT_ORIGIN` (your Vercel client URL) as environment
variables. Node 18+ required (uses the built-in `fetch`).

## Known limitations

- No CurseForge key is bundled — see above, this is by design (API keys are personal
  and rate-limited per account).
- Planet Minecraft is a link-out only; there is no official way to browse or download
  its content in-app.
- The dev-time `esbuild`/`vite` toolchain currently carries a moderate advisory
  ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)) about the
  local dev server accepting cross-origin requests. It only affects `npm run dev`, not
  production builds, and is fixed by upgrading to Vite 6+ when you're ready to take
  that (currently breaking) change.
