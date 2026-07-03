// Zustandsautomat: Klettern <-> Räumzeit über N Durchläufe, dann "Fertig".
export class TimerEngine {
  constructor(settings, callbacks = {}) {
    this.callbacks = callbacks;
    this.setSettings(settings);
  }

  setSettings(settings) {
    this.settings = settings;
    if (!this.status || this.status === 'ready') {
      this.reset();
    }
  }

  reset() {
    this._clearTimer();
    this.schedule = this._buildSchedule();
    this.index = -1;
    this.status = 'ready';
    const first = this.schedule[0];
    this.phaseDurationMs = first ? first.duration * 1000 : 0;
    this.phaseRemainingMs = this.phaseDurationMs;
    this.round = 1;
    this._emitTick();
  }

  start() {
    if (this.status === 'finished') this.reset();
    if (this.status !== 'ready') return;
    this.index = 0;
    this.callbacks.onSound?.('start');
    this._enterPhase(this.index);
  }

  pause() {
    if (this.status !== 'climbing' && this.status !== 'transition') return;
    this._clearTimer();
    this.statusBeforePause = this.status;
    this.status = 'paused';
    this._emitTick();
  }

  resume() {
    if (this.status !== 'paused') return;
    this.status = this.statusBeforePause;
    this._startTicking();
    this._emitTick();
  }

  _buildSchedule() {
    const schedule = [];
    const rounds = Math.max(1, this.settings.rounds || 1);
    for (let r = 1; r <= rounds; r += 1) {
      schedule.push({ type: 'climbing', round: r, duration: this.settings.climbSeconds });
      schedule.push({ type: 'transition', round: r, duration: this.settings.transitionSeconds });
    }
    return schedule;
  }

  _enterPhase(index) {
    if (index >= this.schedule.length) {
      this._finish();
      return;
    }
    const phase = this.schedule[index];
    this.status = phase.type;
    this.round = phase.round;
    this.phaseDurationMs = Math.max(0, phase.duration * 1000);
    this.phaseRemainingMs = this.phaseDurationMs;
    this._startTicking();
    this._emitTick();
  }

  _startTicking() {
    this._clearTimer();
    this.lastTickTime = performance.now();
    this.tickHandle = setInterval(() => this._tick(), 100);
  }

  _tick() {
    const now = performance.now();
    const delta = now - this.lastTickTime;
    this.lastTickTime = now;
    this.phaseRemainingMs -= delta;
    if (this.phaseRemainingMs <= 0) {
      this._advance();
    } else {
      this._emitTick();
    }
  }

  _advance() {
    const finishedPhase = this.schedule[this.index];
    this.index += 1;
    if (this.index >= this.schedule.length) {
      this._finish();
      return;
    }
    const nextPhase = this.schedule[this.index];
    if (finishedPhase.type === 'climbing' && nextPhase.type === 'transition') {
      this.callbacks.onSound?.('phaseChange');
    }
    this._enterPhase(this.index);
  }

  _finish() {
    this._clearTimer();
    this.status = 'finished';
    this.phaseRemainingMs = 0;
    this.callbacks.onSound?.('end');
    this._emitTick();
    this.callbacks.onFinish?.();
  }

  _clearTimer() {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  getWarnLevel() {
    if (this.status !== 'climbing' || !this.phaseDurationMs) return 'normal';
    const percentRemaining = (this.phaseRemainingMs / this.phaseDurationMs) * 100;
    if (percentRemaining <= this.settings.criticalPercent) return 'critical';
    if (percentRemaining <= this.settings.warnPercent) return 'warn';
    return 'normal';
  }

  getState() {
    return {
      status: this.status,
      round: this.round,
      totalRounds: Math.max(1, this.settings.rounds || 1),
      phaseRemainingMs: this.phaseRemainingMs,
      phaseDurationMs: this.phaseDurationMs,
      warnLevel: this.getWarnLevel(),
    };
  }

  _emitTick() {
    this.callbacks.onTick?.(this.getState());
  }
}
