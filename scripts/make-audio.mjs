// Makes a spoken audio clip for every Armenian word and phrase in the chosen
// levels, using Azure's Armenian voice. Clips already made are skipped, so
// only new phrases are sent to Azure.
//
// Run by the deploy workflow. Needs the AZURE_SPEECH_KEY secret; without it,
// no new clips are made and the site still builds.
//
// Clips go in public/audio/. public/audio/manifest.json lists which phrase
// each file says. To replace a clip with your own recording, find the phrase
// in manifest.json and save your mp3 over the file it names.

import fs from "node:fs";
import path from "node:path";

const LEVELS_WITH_AUDIO = [10];                 // add level numbers here to voice more levels
const VOICE = process.env.AZURE_SPEECH_VOICE || "hy-AM-AnahitNeural";
const RATE = "-10%";                            // a little slower than normal speech, for learners
const REGION = process.env.AZURE_SPEECH_REGION || "eastus";
const KEY = process.env.AZURE_SPEECH_KEY || "";
const OUT = path.join("public", "audio");

// Same file name for the same phrase every time (FNV-1a hash of the text).
function fileFor(text) {
  let h = 0x811c9dc5;
  for (const b of Buffer.from(text.normalize("NFC"), "utf8")) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0") + ".mp3";
}

function phrasesFor(src, n) {
  const start = src.indexOf(`{ n: ${n}, name:`);
  if (start < 0) throw new Error(`Level ${n} not found in src/App.jsx`);
  const next = src.indexOf("{ n: ", start + 5);
  const close = src.indexOf("\n];", start);
  const end = next > 0 && next < close ? next : close;
  return [...src.slice(start, end).matchAll(/\bit\("([^"]+)"/g)].map((m) => m[1]);
}

const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function speak(text) {
  const ssml = `<speak version="1.0" xml:lang="hy-AM"><voice name="${VOICE}"><prosody rate="${RATE}">${xml(text)}</prosody></voice></speak>`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "hayeren-course",
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 || res.status >= 500) { await sleep(5000 * attempt); continue; }
    throw new Error(`Azure answered ${res.status}: ${await res.text()}`);
  }
  throw new Error("Azure kept refusing; try again later.");
}

const src = fs.readFileSync(path.join("src", "App.jsx"), "utf8");
const phrases = [...new Set(LEVELS_WITH_AUDIO.flatMap((n) => phrasesFor(src, n)))];
fs.mkdirSync(OUT, { recursive: true });

const missing = phrases.filter((p) => !fs.existsSync(path.join(OUT, fileFor(p))));
console.log(`${phrases.length} phrases, ${missing.length} without audio yet.`);

if (missing.length && !KEY) {
  console.log("No AZURE_SPEECH_KEY secret, so no new audio was made.");
} else {
  for (const p of missing) {
    fs.writeFileSync(path.join(OUT, fileFor(p)), await speak(p));
    console.log(`  made ${fileFor(p)}  ${p}`);
    await sleep(3500);   // stay well inside the free tier's rate limit
  }
}

const manifest = {};
for (const p of phrases) if (fs.existsSync(path.join(OUT, fileFor(p)))) manifest[p] = fileFor(p);
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
console.log(`manifest.json lists ${Object.keys(manifest).length} clips.`);
