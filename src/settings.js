const STORAGE_KEY = 'climbingTimerSettings';

export const DEFAULTS = {
  climbSeconds: 240,
  transitionSeconds: 60,
  rounds: 5,
  warnPercent: 10,
  criticalPercent: 5,
  soundEnabled: true,
  endSoundEnabled: true,
  fontSize: 18,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  bgColor: '#000000',
  timerColor: '#ffffff',
  warnColor: '#ffb300',
  criticalColor: '#ff3b3b',
};

export const PRESETS = {
  bouldern: { label: 'Bouldern', climbSeconds: 240, transitionSeconds: 60 },
  boulderLang: { label: 'Bouldern lang', climbSeconds: 300, transitionSeconds: 60 },
  lead: { label: 'Lead', climbSeconds: 360, transitionSeconds: 90 },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch (err) {
    console.warn('Konnte Einstellungen nicht laden, verwende Standardwerte.', err);
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Konnte Einstellungen nicht speichern.', err);
  }
}

export function resetSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Konnte Einstellungen nicht zuruecksetzen.', err);
  }
  return { ...DEFAULTS };
}

// Akzeptiert "mm:ss" oder reine Sekundenangaben ("90").
export function parseTimeToSeconds(input) {
  if (typeof input === 'number') return Math.max(0, Math.round(input));
  const value = String(input).trim();
  if (!value) return 0;
  if (value.includes(':')) {
    const parts = value.split(':').map((p) => parseInt(p, 10) || 0);
    const [m, s] = parts.length === 2 ? parts : [0, parts[0]];
    return Math.max(0, m * 60 + s);
  }
  const asNumber = parseFloat(value.replace(',', '.'));
  return Number.isFinite(asNumber) ? Math.max(0, Math.round(asNumber)) : 0;
}

export function formatSecondsAsClock(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatSecondsAsMinSec(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
