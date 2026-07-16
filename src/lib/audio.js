// Tone is loaded globally via CDN in index.html
const Tone = window.Tone;

class AudioEngine {
  constructor() {
    this.isInitialized = false;
    // C Major scale for a brighter, more resolving sound
    this.notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
    this.lastNoteTime = 0;
  }

  async init() {
    if (this.isInitialized) return;

    await Tone.start();

    // Global Effects
    this.reverb = new Tone.Reverb({
      decay: 4,
      preDelay: 0.1,
      wet: 0.6
    }).toDestination();

    this.delay = new Tone.PingPongDelay({
      delayTime: "8n",
      feedback: 0.3,
      wet: 0.2
    }).connect(this.reverb);

    // 1. Drawing Synth (Warm, soft FM synthesis for drawing strokes)
    // Route it through a lowpass filter to remove sharp/harsh high frequencies
    this.drawingFilter = new Tone.Filter(1000, "lowpass").connect(this.delay);

    this.drawingSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 2,
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.5, // Slower attack for a smoother fade-in
        decay: 0.3,
        sustain: 0.2,
        release: 2.5, // Longer release for a smoother fade-out
      },
      modulation: { type: "sine" }, // Sine modulation is much smoother than square
      modulationEnvelope: {
        attack: 0.2,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      },
      volume: -22
    }).connect(this.drawingFilter);

    this.isInitialized = true;
  }

  playDrawingSound(velocity = 0, strokeType = "rect") {
    if (!this.isInitialized) return;

    const now = Tone.now();
    // Throttle drawing sounds to avoid overwhelming the audio engine
    if (now - this.lastNoteTime < 0.1) return;

    // Tweak synth slightly based on stroke type (keep modulation lower for smoothness)
    let modIndex = 2;
    let harm = 3;
    if (strokeType === "ellipse") {
      modIndex = 3; // Brighter, rounder tone
      harm = 2;
    } else if (strokeType === "line") {
      modIndex = 1.5; // Softer, thinner tone
      harm = 4;
    } else if (strokeType.startsWith("stamp_")) {
      modIndex = 5; // More complex for stamps, but not too metallic
      harm = 1.5;
    }
    this.drawingSynth.set({
      modulationIndex: modIndex,
      harmonicity: harm
    });

    // Pick a random note from the major scale
    const note = this.notes[Math.floor(Math.random() * this.notes.length)];

    // Adjust velocity heavily based on drawing speed to follow the brush
    // Faster drawing = louder, slower = softer
    const vel = Math.min(Math.max(velocity * 0.05, 0.05), 0.9);

    this.drawingSynth.triggerAttackRelease(note, "8n", now, vel);
    this.lastNoteTime = now;
  }

  playShakeSound(shakeNum = 1) {
    if (!this.isInitialized) return;
    const now = Tone.now();

    // As you shake more (up to 5), the sound becomes lower and more clustered
    let chord;
    if (shakeNum <= 1) chord = ["C4", "E4", "F4", "B4"];
    else if (shakeNum === 2) chord = ["C4", "Eb4", "Gb4", "B4"];
    else if (shakeNum === 3) chord = ["C3", "E3", "G3", "B3"];
    else if (shakeNum === 4) chord = ["C3", "Db3", "Eb3", "G3"];
    else chord = ["C2", "Db2", "D2", "Eb2"]; // Most chaotic, low rumble

    // Temporarily reset drawing synth to standard parameters for a consistent shatter tone
    this.drawingSynth.set({ modulationIndex: 3.5, harmonicity: 3 });

    // Volume gets slightly louder with more shakes
    const vol = Math.min(0.4 + (shakeNum * 0.05), 0.9);

    this.drawingSynth.triggerAttackRelease(chord, "8n", now, vol);
  }

  playBloomSound() {
    if (!this.isInitialized) return;
    // Play a resolving CMaj9 chord using the drawing sound
    const now = Tone.now();
    this.drawingSynth.triggerAttackRelease(["C3", "E3", "G3", "B3", "D4"], "1m", now, 0.4);
  }
}

export const audioEngine = new AudioEngine();
