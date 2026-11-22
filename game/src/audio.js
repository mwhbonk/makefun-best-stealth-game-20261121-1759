// Shadowlight Heist — sound. One clear job: every noise the game makes, synthesised with
// WebAudio and nothing else. No audio files, no network: footsteps are short filtered thumps,
// a shard is a bright blip, an alarm is a low sting. Guard footsteps are panned left and
// right by where the guard stands relative to the thief, and quieter the further away they
// are — that is how the player hears a patrol coming. The context only starts after a real
// key press or click, so staged screenshots stay silent.

export function makeAudio() {
  return {
    ctx: null,
    master: null,
    enabled: false,
  };
}

export function ensureAudio(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);
    audio.enabled = true;
  } catch {
    audio.enabled = false;
  }
}

function thump(audio, freq, dur, vol, pan) {
  if (!audio.enabled || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  const panner = audio.ctx.createStereoPanner();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.5), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  osc.connect(gain);
  gain.connect(panner);
  panner.connect(audio.master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function blip(audio, freqs, dur, vol) {
  if (!audio.enabled || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  freqs.forEach((freq, i) => {
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(vol, t + i * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t + i * 0.07);
    osc.stop(t + i * 0.07 + dur + 0.02);
  });
}

// Pan is -1 (far left) to 1 (far right) from the thief's point of view; volume falls with distance.
export function playStep(audio, pan, distance, heavy) {
  const vol = Math.max(0.02, 0.22 - distance * 0.022);
  thump(audio, heavy ? 95 : 150, 0.09, vol, pan);
}

export function playShard(audio) {
  blip(audio, [660, 990], 0.16, 0.16);
}

export function playAlarm(audio) {
  blip(audio, [220, 174, 220], 0.3, 0.2);
}

export function playPebble(audio, pan) {
  thump(audio, 420, 0.06, 0.12, pan);
}

export function playClear(audio) {
  blip(audio, [523, 659, 784, 1046], 0.22, 0.15);
}

export function playCaught(audio) {
  blip(audio, [330, 262, 196], 0.25, 0.18);
}
