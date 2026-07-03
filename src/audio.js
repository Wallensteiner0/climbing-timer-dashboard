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
      this.ctx.resume().catch(() => {});
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
    const ctx = this._ensureContext();
    return ctx.state === 'running' ? Promise.resolve() : ctx.resume().catch(() => {});
  }

  playStart() {
    this._beep(880, 150, 0);
    this._beep(1320, 200, 180);
  }

  playCountdownStart() {
    this._beep(1568, 1000, 0);
  }

  playPhaseChange() {
    this._beep(660, 220, 0);
  }

  playEnd() {
    this._beep(880, 150, 0);
    this._beep(1046, 150, 180);
    this._beep(1318, 150, 360);
  }

  playWarnMark() {
    this._beep(740, 200, 0);
  }

  playCriticalMark() {
    this._beep(880, 150, 0);
    this._beep(880, 150, 220);
  }

  playTick() {
    this._beep(1000, 60, 0, 'square', 0.15);
  }
}
