// Makes a spoken audio clip for every Armenian word, phrase and letter name in
// the lessons, using Azure's Armenian voice (always Anahit, so the whole course
// sounds the same). Clips already made are skipped, so only new phrases are
// sent to Azure.
//
// Run by the deploy workflow. Needs the AZURE_SPEECH_KEY secret; without it,
// no new clips are made and the site still builds.
//
// Clips go in public/audio/. public/audio/manifest.json lists which phrase
// each file says. To replace a clip with your own recording, find the phrase
// in manifest.json and save your mp3 over the file it names.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const VOICE = "hy-AM-AnahitNeural";
const RATE = "-10%";                            // a little slower than normal speech, for learners
const REGION = process.env.AZURE_SPEECH_REGION || "eastus";
const KEY = process.env.AZURE_SPEECH_KEY || "";
const OUT = path.join("public", "audio");
const SAVE_EVERY = Number(process.env.AUDIO_SAVE_EVERY || 0);   // in the workflow: push clips to GitHub every N

// Same file name for the same phrase every time (FNV-1a hash of the text).
function fileFor(text) {
  let h = 0x811c9dc5;
  for (const b of Buffer.from(text.normalize("NFC"), "utf8")) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0") + ".mp3";
}

// Every lesson word and phrase (written with it(...) or w(...) in App.jsx),
// plus the name of every letter (the third value of l, wide and aside).
function lessonPhrases(src) {
  const words = [...src.matchAll(/\b(?:it|w)\("([^"]+)"/g)].map((m) => m[1]);
  const names = [...src.matchAll(/\b(?:l|wide|aside)\("[^"]*", "[^"]*", "([^"]+)"/g)].map((m) => m[1]);
  return [...words, ...names];
}

function writeManifest(phrases) {
  const manifest = {};
  for (const p of phrases) if (fs.existsSync(path.join(OUT, fileFor(p)))) manifest[p] = fileFor(p);
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
  return Object.keys(manifest).length;
}

// Save the clips made so far to GitHub, so a long run that gets cut off keeps its work.
function saveProgress(phrases, made) {
  writeManifest(phrases);
  try {
    execSync(`git add ${OUT} && git commit -q -m "Add audio for new phrases (${made} so far)" && git pull -q --rebase && git push -q`, { stdio: "inherit" });
    console.log(`  saved ${made} clips to the repository`);
  } catch (e) {
    console.log("  could not save progress to the repository; continuing");
  }
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
const phrases = [...new Set(lessonPhrases(src))];
fs.mkdirSync(OUT, { recursive: true });

const missing = phrases.filter((p) => !fs.existsSync(path.join(OUT, fileFor(p))));
console.log(`${phrases.length} phrases, ${missing.length} without audio yet.`);

if (missing.length && !KEY) {
  console.log("No AZURE_SPEECH_KEY secret, so no new audio was made.");
} else {
  let made = 0;
  for (const p of missing) {
    fs.writeFileSync(path.join(OUT, fileFor(p)), await speak(p));
    made++;
    console.log(`  made ${fileFor(p)}  ${p}  (${made} of ${missing.length})`);
    if (SAVE_EVERY && made % SAVE_EVERY === 0 && made < missing.length) saveProgress(phrases, made);
    await sleep(3500);   // stay well inside the free tier's rate limit
  }
}

console.log(`manifest.json lists ${writeManifest(phrases)} clips.`);
