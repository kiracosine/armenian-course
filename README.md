# Հայերեն — learn Eastern Armenian

Ten levels, 52 lessons, from the 39-letter alphabet to household conversation.

## Run it locally

```
npm install
npm run dev
```

## Put it online (free)

Any of these work. The build output is a plain folder of static files —
there is no server, no database, and nothing to pay for.

**Netlify or Cloudflare Pages (easiest)**
1. Push this folder to a GitHub repository.
2. On netlify.com or pages.cloudflare.com, choose "import from Git".
3. Build command `npm run build`, publish directory `dist`.

**Vercel** — same, it detects Vite automatically.

**GitHub Pages**
```
npm run build
npx gh-pages -d dist
```
Then in the repo: Settings → Pages → Branch `gh-pages`.

**Drag and drop** — run `npm run build` and drag the `dist` folder onto
app.netlify.com/drop. No account needed to try it.

## How progress is saved

In the browser's localStorage under `armenian:course:progress`. That means
progress stays on the device it was made on. There are no accounts and no
server, so nothing is collected and nothing is sent anywhere.
