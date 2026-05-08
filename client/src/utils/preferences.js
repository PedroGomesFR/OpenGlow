export const SETTINGS_STORAGE_KEY = 'openglow_settings';
export const SETTINGS_EVENT = 'openglow:settings-changed';

export const DEFAULT_SETTINGS = {
  theme: 'classic',
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  compactMode: false,
};

export const THEMES = {
  classic: {
    label: 'Classic',
    palette: {
      '--primary': '#1d1d1f',
      '--primary-hover': '#333333',
      '--primary-light': 'rgba(29, 29, 31, 0.08)',
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f5f5f7',
      '--bg-tertiary': '#e5e5ea',
      '--text-primary': '#000000',
      '--text-secondary': 'rgba(60, 60, 67, 0.6)',
      '--text-tertiary': 'rgba(60, 60, 67, 0.3)',
    },
  },
  ocean: {
    label: 'Ocean',
    palette: {
      '--primary': '#1a5c6b',
      '--primary-hover': '#14495c',
      '--primary-light': 'rgba(26, 92, 107, 0.1)',
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f5f5f7',
      '--bg-tertiary': '#e5e5ea',
      '--text-primary': '#111111',
      '--text-secondary': 'rgba(60, 60, 67, 0.72)',
      '--text-tertiary': 'rgba(60, 60, 67, 0.4)',
    },
  },
  rose: {
    label: 'Rose',
    palette: {
      '--primary': '#b4546c',
      '--primary-hover': '#963b53',
      '--primary-light': 'rgba(180, 84, 108, 0.12)',
      '--bg-primary': '#fffafc',
      '--bg-secondary': '#fdf1f5',
      '--bg-tertiary': '#f4d9e2',
      '--text-primary': '#2b1f24',
      '--text-secondary': 'rgba(76, 49, 58, 0.76)',
      '--text-tertiary': 'rgba(76, 49, 58, 0.42)',
    },
  },
  dark: {
    label: 'Sombre',
    palette: {
      '--primary': '#f5f5f7',
      '--primary-hover': '#e0e0e5',
      '--primary-light': 'rgba(245, 245, 247, 0.12)',
      '--bg-primary': '#1c1c1e',
      '--bg-secondary': '#111111',
      '--bg-tertiary': '#2c2c2e',
      '--text-primary': '#f5f5f7',
      '--text-secondary': 'rgba(235, 235, 245, 0.65)',
      '--text-tertiary': 'rgba(235, 235, 245, 0.3)',
    },
  },
};

export function getStoredSettings() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!rawSettings) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsedSettings = JSON.parse(rawSettings);
    return {
      ...DEFAULT_SETTINGS,
      ...parsedSettings,
      theme: THEMES[parsedSettings?.theme] ? parsedSettings.theme : DEFAULT_SETTINGS.theme,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveStoredSettings(nextSettings) {
  if (typeof window === 'undefined') {
    return nextSettings;
  }

  const mergedSettings = {
    ...DEFAULT_SETTINGS,
    ...nextSettings,
    theme: THEMES[nextSettings?.theme] ? nextSettings.theme : DEFAULT_SETTINGS.theme,
  };

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(mergedSettings));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: mergedSettings }));
  return mergedSettings;
}

export function applyTheme(themeName) {
  if (typeof document === 'undefined') {
    return;
  }

  const activeTheme = THEMES[themeName] ? themeName : DEFAULT_SETTINGS.theme;
  const palette = THEMES[activeTheme].palette;
  const root = document.documentElement;

  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });

  root.setAttribute('data-theme', activeTheme);
}