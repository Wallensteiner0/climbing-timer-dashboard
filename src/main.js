import { loadSettings, saveSettings, resetSettings, PRESETS } from './settings.js';
import { SoundEngine } from './audio.js';
import { TimerEngine } from './timerEngine.js';
import { initSetupView } from './ui.js';
import { initTimerView } from './timerView.js';

let settings = loadSettings();
const soundEngine = new SoundEngine();

let timerView;
let setupView;

function playSound(type) {
  if (type === 'end') {
    if (settings.soundEnabled && settings.endSoundEnabled) soundEngine.playEnd();
    return;
  }
  if (!settings.soundEnabled) return;
  if (type === 'start') soundEngine.playStart();
  else if (type === 'countdownStart') soundEngine.playCountdownStart();
  else if (type === 'phaseChange') soundEngine.playPhaseChange();
  else if (type === 'warnMark') { if (settings.warnSoundEnabled) soundEngine.playWarnMark(); }
  else if (type === 'criticalMark') { if (settings.criticalSoundEnabled) soundEngine.playCriticalMark(); }
  else if (type === 'tick') { if (settings.criticalSoundEnabled) soundEngine.playTick(); }
}

const engine = new TimerEngine(settings, {
  onTick: (state) => timerView && timerView.renderState(state),
  onSound: (type) => playSound(type),
});

function updateSettings(patch) {
  const merged = { ...settings, ...patch };
  if ('soundEnabled' in patch) {
    merged.warnSoundEnabled = patch.soundEnabled;
    merged.criticalSoundEnabled = patch.soundEnabled;
    merged.endSoundEnabled = patch.soundEnabled;
  }
  settings = merged;
  saveSettings(settings);
  engine.setSettings(settings);
  setupView.render(settings);
  timerView.applyStyle(settings);
}

setupView = initSetupView(settings, {
  getSettings: () => settings,
  onChange: (patch) => updateSettings(patch),
  onPresetSelect: (key) => {
    const preset = PRESETS[key];
    if (!preset) return;
    updateSettings({ climbSeconds: preset.climbSeconds, transitionSeconds: preset.transitionSeconds });
  },
  onReset: () => {
    settings = resetSettings();
    engine.setSettings(settings);
    setupView.render(settings);
    timerView.applyStyle(settings);
  },
  onFullscreen: () => {
    switchToTimerView();
    timerView.requestFullscreen();
  },
  onOpenTimer: () => switchToTimerView(),
});

timerView = initTimerView({
  onStart: () => {
    soundEngine.unlock().then(() => engine.start());
  },
  onPause: () => engine.pause(),
  onResume: () => engine.resume(),
  onReset: () => engine.reset(),
  onBackToSettings: () => switchToSetupView(),
});

function switchToTimerView() {
  document.getElementById('view-setup').classList.remove('active');
  document.getElementById('view-timer').classList.add('active');
  timerView.applyStyle(settings);
  timerView.renderState(engine.getState());
  timerView.showMenu();
}

function switchToSetupView() {
  document.getElementById('view-timer').classList.remove('active');
  document.getElementById('view-setup').classList.add('active');
  setupView.render(settings);
}

timerView.applyStyle(settings);
timerView.renderState(engine.getState());
