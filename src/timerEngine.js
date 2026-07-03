const START_DELAY_MS = 1000;
const CLIMB_END_HOLD_MS = 5000;
const CLIMB_END_FADE_MS = 3000;

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
    this._clearStartDelay();
    this.climbEndElapsedMs = null;
    this.schedule = this._buildSchedule();
    this.index = -1;
    this.status = 'ready';
    const first = this.schedule[0];
    this.phaseDurationMs = first ? first.duration * 1000 : 0;
    this.phaseRemainingMs = this.phaseDurationMs;
    this.round = 1;
    this.lastWarnLevel = 'normal';
    this.lastWholeSecond = null;
    this._emitTick();
  }

  start() {
    if (this.status === 'finished') this.reset();
    if (this.status !== 'ready') return;
    this.index = 0;
    this._beginClimbingWithDelay(this.index);
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

  _beginClimbingWithDelay(index) {
    this._clearTimer();
    this.climbEndElapsedMs = null;
    this.status = 'starting';
    this.callbacks.onSound?.('start');
    this._emitTick();
    this.startDelayHandle = setTimeout(() => {
      this.startDelayHandle = null;
      this.callbacks.onSound?.('countdownStart');
      this._enterPhase(index);
    }, START_DELAY_MS);
  }

  _clearStartDelay() {
    if (this.startDelayHandle) {
      clearTimeout(this.startDelayHandle);
      this.startDelayHandle = null;
    }
  }

  _effectiveStatus() {
    return this.status === 'paused' ? this.statusBeforePause : this.status;
  }

  _getClimbEndOverlay() {
    if (this.climbEndElapsedMs == null || this._effectiveStatus() !== 'transition') return null;
    const elapsed = this.climbEndElapsedMs;
    if (elapsed >= CLIMB_END_HOLD_MS + CLIMB_END_FADE_MS) return null;
    if (elapsed < CLIMB_END_HOLD_MS) return { opacity: 1 };
    const fadeElapsed = elapsed - CLIMB_END_HOLD_MS;
    return { opacity: Math.max(0, 1 - fadeElapsed / CLIMB_END_FADE_MS) };
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
    this.lastWarnLevel = 'normal';
    this.lastWholeSecond = null;
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
    if (this.climbEndElapsedMs != null) {
      this.climbEndElapsedMs += delta;
    }
    if (this.phaseRemainingMs <= 0) {
      this._advance();
    } else {
      this._checkSoundMarks();
      this._emitTick();
    }
  }

  _checkSoundMarks() {
    if (this.status !== 'climbing') return;
    const remainingSeconds = this.phaseRemainingMs / 1000;
    const level = this._computeWarnLevel(remainingSeconds);
    if (level !== this.lastWarnLevel) {
      if (level === 'warn') this.callbacks.onSound?.('warnMark');
      if (level === 'critical') this.callbacks.onSound?.('criticalMark');
      this.lastWarnLevel = level;
    }
    const wholeSecond = Math.ceil(remainingSeconds);
    if (wholeSecond >= 1 && wholeSecond <= 5 && wholeSecond !== this.lastWholeSecond) {
      this.callbacks.onSound?.('tick');
    }
    this.lastWholeSecond = wholeSecond;
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
      this.climbEndElapsedMs = 0;
    }
    if (finishedPhase.type === 'transition' && nextPhase.type === 'climbing') {
      this._beginClimbingWithDelay(this.index);
      return;
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

  _computeWarnLevel(remainingSeconds) {
    if (this._effectiveStatus() !== 'climbing') return 'normal';
    if (remainingSeconds <= this.settings.criticalSeconds) return 'critical';
    if (remainingSeconds <= this.settings.warnSeconds) return 'warn';
    return 'normal';
  }

  getWarnLevel() {
    return this._computeWarnLevel(this.phaseRemainingMs / 1000);
  }

  getState() {
    return {
      status: this.status,
      round: this.round,
      totalRounds: Math.max(1, this.settings.rounds || 1),
      phaseRemainingMs: this.phaseRemainingMs,
      phaseDurationMs: this.phaseDurationMs,
      warnLevel: this.getWarnLevel(),
      climbEndOverlay: this._getClimbEndOverlay(),
    };
  }

  _emitTick() {
    this.callbacks.onTick?.(this.getState());
  }
}
