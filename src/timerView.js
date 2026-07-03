import { formatSecondsAsClock } from './settings.js';

const $ = (id) => document.getElementById(id);

const STATUS_LABELS = {
  ready: 'Bereit',
  starting: 'Start…',
  paused: 'Pausiert',
  finished: 'Fertig',
};

function statusLabel(state) {
  if (state.status === 'climbing') return `Klettern — Durchlauf ${state.round} / ${state.totalRounds}`;
  if (state.status === 'transition' && state.climbEndOverlay) return `Zeit abgelaufen — Durchlauf ${state.round} / ${state.totalRounds}`;
  if (state.status === 'transition') return `Räumzeit — Durchlauf ${state.round} / ${state.totalRounds}`;
  return STATUS_LABELS[state.status] || '';
}

const EDGE_PX = 90;
const HIDE_DELAY_MS = 3000;

export function initTimerView(callbacks) {
  const display = $('timer-display');
  const clockEl = $('timer-clock');
  const statusEl = $('timer-status');
  const menu = $('control-menu');
  const pauseBtn = menu.querySelector('[data-action="pause"]');
  const resumeBtn = menu.querySelector('[data-action="resume"]');

  let hideTimer = null;

  function showMenu() {
    menu.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => menu.classList.remove('visible'), HIDE_DELAY_MS);
  }

  function handlePointer(y) {
    if (window.innerHeight - y <= EDGE_PX) showMenu();
  }

  document.addEventListener('mousemove', (e) => handlePointer(e.clientY));
  document.addEventListener('touchstart', (e) => handlePointer(e.touches[0].clientY), { passive: true });
  document.addEventListener('touchmove', (e) => handlePointer(e.touches[0].clientY), { passive: true });

  menu.querySelectorAll('.control-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showMenu();
      const action = btn.dataset.action;
      if (action === 'start') callbacks.onStart();
      else if (action === 'pause') callbacks.onPause();
      else if (action === 'resume') callbacks.onResume();
      else if (action === 'reset') callbacks.onReset();
      else if (action === 'fullscreen') toggleFullscreen();
      else if (action === 'settings') callbacks.onBackToSettings();
    });
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function applyStyle(settings) {
    display.style.setProperty('--timer-bg', settings.bgColor);
    display.style.setProperty('--timer-color', settings.timerColor);
    display.style.setProperty('--timer-warn-color', settings.warnColor);
    display.style.setProperty('--timer-critical-color', settings.criticalColor);
    display.style.setProperty('--timer-font-size', `${settings.fontSize}vh`);
    display.style.setProperty('--timer-font-family', settings.fontFamily);
  }

  function renderState(state) {
    if (state.climbEndOverlay) {
      clockEl.textContent = formatSecondsAsClock(0);
      clockEl.style.opacity = String(state.climbEndOverlay.opacity);
    } else {
      const totalSeconds = Math.round(state.phaseRemainingMs / 1000);
      clockEl.textContent = formatSecondsAsClock(totalSeconds);
      clockEl.style.opacity = '';
    }
    statusEl.textContent = statusLabel(state);
    display.classList.toggle('warn', state.warnLevel === 'warn');
    display.classList.toggle('critical', state.warnLevel === 'critical');
    display.classList.toggle('hold-critical', Boolean(state.climbEndOverlay));
    display.classList.toggle('transition', state.status === 'transition' && !state.climbEndOverlay);
    pauseBtn.classList.toggle('hidden', state.status === 'paused');
    resumeBtn.classList.toggle('hidden', state.status !== 'paused');
  }

  return {
    applyStyle,
    renderState,
    showMenu,
    requestFullscreen: () => document.documentElement.requestFullscreen().catch(() => {}),
  };
}
