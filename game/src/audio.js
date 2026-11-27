// WebAudio procedural sound synthesis (no external audio files).
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (muted) return null;
    if (!ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freqStart, freqEnd, duration, type = 'sine', gainVal = 0.14, delay = 0) {
    const ac = ensureContext();
    if (!ac) return;
    const now = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    playJump() {
      tone(240, 540, 0.14, 'triangle', 0.14);
    },
    playGobble() {
      // Quick warbling turkey gobble on corn collect
      tone(520, 680, 0.07, 'triangle', 0.13, 0);
      tone(660, 480, 0.07, 'triangle', 0.13, 0.06);
      tone(540, 760, 0.09, 'triangle', 0.12, 0.12);
    },
    playWhoosh() {
      tone(420, 140, 0.16, 'sawtooth', 0.06);
    },
    playFlame() {
      tone(140, 75, 0.28, 'sawtooth', 0.11);
    },
    playHit() {
      tone(210, 68, 0.24, 'square', 0.15);
    },
    playWin() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => tone(n, n * 1.02, 0.18, 'triangle', 0.14, idx * 0.11));
    },
    playLose() {
      // Sad trombone-ish descending slide
      tone(311, 293, 0.22, 'sawtooth', 0.12, 0);
      tone(277, 261, 0.22, 'sawtooth', 0.12, 0.24);
      tone(246, 175, 0.45, 'sawtooth', 0.13, 0.48);
    },
  };
}
