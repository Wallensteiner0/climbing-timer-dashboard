// Erzeugt kurze Signaltöne per Web Audio API, ohne externe Audiodateien.
export class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  _beep(frequency, durationMs, delayMs = 0, type = 'sine', volume = 0.3) {
    const ctx = this._ensureContext();
    const startTime = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + durationMs / 1000 + 0.05);
  }

  // Unlock/Init muss aus einer echten Nutzerinteraktion heraus aufgerufen werden.
  unlock() {
    this._ensureContext();
  }

  playStart() {
    this._beep(880, 150, 0);
    this._beep(1320, 200, 180);
  }

  playPhaseChange() {
    this._beep(660, 220, 0);
  }

  playEnd() {
    this._beep(523, 180, 0);
    this._beep(659, 180, 200);
    this._beep(784, 400, 400);
  }

  playTick() {
    this._beep(1000, 60, 0, 'square', 0.15);
  }
}
