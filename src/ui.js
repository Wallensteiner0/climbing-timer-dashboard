import { PRESETS, parseTimeToSeconds, formatSecondsAsMinSec } from './settings.js';

const $ = (id) => document.getElementById(id);

export function initSetupView(initialSettings, callbacks) {
  const els = {
    climb: $('input-climb'),
    transition: $('input-transition'),
    rounds: $('input-rounds'),
    warn: $('input-warn'),
    critical: $('input-critical'),
    sound: $('input-sound'),
    soundAdvanced: $('input-sound-advanced'),
    endSound: $('input-end-sound'),
    fontSize: $('input-font-size'),
    fontFamily: $('input-font-family'),
    bgColor: $('input-bg-color'),
    timerColor: $('input-timer-color'),
    warnColor: $('input-warn-color'),
    criticalColor: $('input-critical-color'),
    advancedPanel: $('advanced-panel'),
    toggleAdvanced: $('btn-toggle-advanced'),
    resetDefaults: $('btn-reset-defaults'),
    presetButtons: Array.from(document.querySelectorAll('.preset-btn')),
    demoChips: Array.from(document.querySelectorAll('.chip')),
    previewFrame: $('preview-frame'),
    previewClock: $('preview-clock'),
    previewStatus: $('preview-status'),
    btnFullscreen: $('btn-fullscreen'),
    btnOpenTimer: $('btn-open-timer'),
  };

  let demoLevel = 'normal';

  function render(settings) {
    els.climb.value = formatSecondsAsMinSec(settings.climbSeconds);
    els.transition.value = formatSecondsAsMinSec(settings.transitionSeconds);
    els.rounds.value = settings.rounds;
    els.warn.value = settings.warnPercent;
    els.critical.value = settings.criticalPercent;
    els.sound.checked = settings.soundEnabled;
    els.soundAdvanced.checked = settings.soundEnabled;
    els.endSound.checked = settings.endSoundEnabled;
    els.fontSize.value = settings.fontSize;
    els.fontFamily.value = settings.fontFamily;
    els.bgColor.value = settings.bgColor;
    els.timerColor.value = settings.timerColor;
    els.warnColor.value = settings.warnColor;
    els.criticalColor.value = settings.criticalColor;

    els.presetButtons.forEach((btn) => {
      const preset = PRESETS[btn.dataset.preset];
      const matches = preset
        && preset.climbSeconds === settings.climbSeconds
        && preset.transitionSeconds === settings.transitionSeconds;
      btn.classList.toggle('active', Boolean(matches));
    });

    applyPreviewStyle(settings);
    updatePreviewClock(settings);
  }

  function applyPreviewStyle(settings) {
    const frame = els.previewFrame;
    frame.style.setProperty('--timer-bg', settings.bgColor);
    frame.style.setProperty('--timer-color', settings.timerColor);
    frame.style.setProperty('--timer-warn-color', settings.warnColor);
    frame.style.setProperty('--timer-critical-color', settings.criticalColor);
    frame.style.setProperty('--timer-font-size', `${settings.fontSize}vh`);
    frame.style.setProperty('--timer-font-family', settings.fontFamily);
  }

  function updatePreviewClock(settings) {
    els.previewClock.textContent = formatClockFromSeconds(settings.climbSeconds);
    const statusLabels = { normal: 'Bereit', warn: 'Klettern (Warnphase)', critical: 'Klettern (Kritisch)' };
    els.previewStatus.textContent = statusLabels[demoLevel];
    els.previewFrame.classList.toggle('warn', demoLevel === 'warn');
    els.previewFrame.classList.toggle('critical', demoLevel === 'critical');
  }

  function formatClockFromSeconds(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  els.climb.addEventListener('change', () => {
    callbacks.onChange({ climbSeconds: parseTimeToSeconds(els.climb.value) });
  });
  els.transition.addEventListener('change', () => {
    callbacks.onChange({ transitionSeconds: parseTimeToSeconds(els.transition.value) });
  });
  els.rounds.addEventListener('input', () => {
    callbacks.onChange({ rounds: Math.max(1, parseInt(els.rounds.value, 10) || 1) });
  });
  els.warn.addEventListener('input', () => {
    callbacks.onChange({ warnPercent: clampPercent(els.warn.value) });
  });
  els.critical.addEventListener('input', () => {
    callbacks.onChange({ criticalPercent: clampPercent(els.critical.value) });
  });
  els.sound.addEventListener('change', () => {
    callbacks.onChange({ soundEnabled: els.sound.checked });
  });
  els.soundAdvanced.addEventListener('change', () => {
    callbacks.onChange({ soundEnabled: els.soundAdvanced.checked });
  });
  els.endSound.addEventListener('change', () => {
    callbacks.onChange({ endSoundEnabled: els.endSound.checked });
  });
  els.fontSize.addEventListener('input', () => {
    callbacks.onChange({ fontSize: parseInt(els.fontSize.value, 10) });
  });
  els.fontFamily.addEventListener('change', () => {
    callbacks.onChange({ fontFamily: els.fontFamily.value });
  });
  els.bgColor.addEventListener('input', () => {
    callbacks.onChange({ bgColor: els.bgColor.value });
  });
  els.timerColor.addEventListener('input', () => {
    callbacks.onChange({ timerColor: els.timerColor.value });
  });
  els.warnColor.addEventListener('input', () => {
    callbacks.onChange({ warnColor: els.warnColor.value });
  });
  els.criticalColor.addEventListener('input', () => {
    callbacks.onChange({ criticalColor: els.criticalColor.value });
  });

  els.toggleAdvanced.addEventListener('click', () => {
    const isHidden = els.advancedPanel.classList.toggle('hidden');
    els.toggleAdvanced.setAttribute('aria-expanded', String(!isHidden));
  });

  els.resetDefaults.addEventListener('click', () => callbacks.onReset());

  els.presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => callbacks.onPresetSelect(btn.dataset.preset));
  });

  els.demoChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      demoLevel = chip.dataset.demo;
      els.demoChips.forEach((c) => c.classList.toggle('active', c === chip));
      updatePreviewClock(callbacks.getSettings());
    });
  });

  els.btnFullscreen.addEventListener('click', () => callbacks.onFullscreen());
  els.btnOpenTimer.addEventListener('click', () => callbacks.onOpenTimer());

  function clampPercent(value) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return 1;
    return Math.min(100, Math.max(1, n));
  }

  render(initialSettings);

  return { render };
}
