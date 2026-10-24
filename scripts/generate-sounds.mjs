// Original sound effects and a seamless instrumental loop, as 16-bit mono WAV files.
// Run with `npm run sounds`; output goes to assets/sounds/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

const silence = (seconds) => new Array(Math.round(seconds * RATE)).fill(0);

// Seeded noise so the files are reproducible.
let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

/** Dice clatter: a few short, decaying, low-passed noise clicks. */
function roll() {
  const samples = silence(0.55);
  const hits = [0.0, 0.07, 0.16, 0.23, 0.31, 0.38];
  hits.forEach((t, k) => {
    const start = Math.round(t * RATE);
    let low = 0;
    for (let i = 0; i < 0.05 * RATE; i++) {
      low += 0.35 * (noise() - low);
      samples[start + i] += low * Math.exp(-i / (0.008 * RATE)) * (0.9 - k * 0.1);
    }
  });

  return samples;
}

/** Two-note chime for writing a score. */
function score() {
  const samples = silence(0.45);
  [
    [659.25, 0],
    [987.77, 0.09],
  ].forEach(([freq, t]) => {
    const start = Math.round(t * RATE);
    for (let i = 0; start + i < samples.length; i++) {
      const env = Math.exp(-i / (0.12 * RATE));
      samples[start + i] += 0.35 * env * Math.sin((2 * Math.PI * freq * i) / RATE);
    }
  });

  return samples;
}

/** Soft blip when someone joins. */
function joined() {
  const samples = silence(0.2);
  for (let i = 0; i < samples.length; i++) {
    const freq = 520 + 380 * (i / samples.length);
    samples[i] = 0.3 * Math.exp(-i / (0.06 * RATE)) * Math.sin((2 * Math.PI * freq * i) / RATE);
  }

  return samples;
}

const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** A soft wooden/plucked tone. Wrap tails for the music's seamless loop. */
function tone(samples, midi, at, duration, gain, wrap = false) {
  const start = Math.round(at * RATE);
  const length = Math.round(duration * RATE);
  const freq = frequency(midi);
  for (let i = 0; i < length; i++) {
    const index = wrap ? (start + i) % samples.length : start + i;
    if (index >= samples.length) break;
    const time = i / RATE;
    const attack = Math.min(1, time / 0.006);
    const release = Math.min(1, (length - 1 - i) / (RATE * 0.035));
    const envelope = attack * release * Math.exp((-4 * time) / duration);
    const phase = 2 * Math.PI * freq * time;
    samples[index] +=
      gain * envelope * (Math.sin(phase) + 0.22 * Math.sin(2 * phase) + 0.06 * Math.sin(3 * phase));
  }
}

function chime(notes, spacing = 0.1, duration = 0.3, gain = 0.24) {
  const samples = silence((notes.length - 1) * spacing + duration);
  notes.forEach((note, i) => tone(samples, note, i * spacing, duration, gain));

  return samples;
}

/** Eight relaxed bars in C major. Every note and its tail belongs to the loop. */
function music() {
  const beat = 60 / 88;
  const samples = silence(32 * beat);
  const chords = [
    [48, 60, 64, 67, 71],
    [45, 60, 64, 67, 69],
    [41, 60, 64, 65, 69],
    [43, 59, 62, 67, 69],
    [48, 60, 64, 67, 71],
    [45, 60, 64, 67, 69],
    [41, 60, 64, 65, 69],
    [43, 59, 62, 65, 69],
  ];
  const melody = [
    [76, 79, 83, 79],
    [81, 79, 76, 72],
    [77, 81, 79, 76],
    [74, 79, 81, 79],
    [76, 79, 84, 83],
    [81, 76, 79, 72],
    [77, 76, 74, 72],
    [74, 71, 74, 79],
  ];
  chords.forEach(([bass, ...chord], bar) => {
    const at = bar * 4 * beat;
    tone(samples, bass, at, beat * 1.8, 0.18, true);
    tone(samples, bass + 7, at + 2 * beat, beat * 1.6, 0.12, true);
    chord.forEach((note, i) => {
      tone(samples, note, at + (0.55 + i * 0.025) * beat, beat * 2.1, 0.055, true);
      tone(samples, note, at + (2.55 + i * 0.025) * beat, beat * 1.8, 0.045, true);
    });
    melody[bar].forEach((note, i) =>
      tone(samples, note, at + (i + (i % 2 ? 0.08 : 0)) * beat, beat * 1.4, 0.095, true),
    );
  });

  return samples;
}

mkdirSync(out, { recursive: true });
for (const [name, make] of Object.entries({
  roll,
  score,
  join: joined,
  tap: () => chime([79], 0, 0.07, 0.12),
  hold: () => chime([67, 74], 0.035, 0.12, 0.18),
  release: () => chime([74, 67], 0.035, 0.12, 0.14),
  turn: () => chime([72, 79, 84], 0.12, 0.35, 0.2),
  countdown: () => chime([72], 0, 0.12, 0.2),
  start: () => chime([72, 76, 79, 84], 0.07, 0.4),
  strike: () => chime([64, 60], 0.08, 0.2, 0.15),
  yatzy: () => chime([72, 76, 79, 84, 88, 91], 0.08, 0.55),
  finish: () => chime([72, 76, 79, 84, 79, 88, 84], 0.14, 0.7),
  music,
})) {
  writeFileSync(join(out, `${name}.wav`), wav(make()));
  console.log(`assets/sounds/${name}.wav`);
}
