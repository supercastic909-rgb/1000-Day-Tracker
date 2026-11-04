import { HabitState } from '../types/habit';
import { createDefaultState, sanitizeParsedState, STORAGE_KEY } from './habitLogic';

export function saveToIndexedDB(serialized: string): void {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const req = window.indexedDB.open('HabitTracker1000DB', 1);
    req.onupgradeneeded = ev => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
    };
    req.onsuccess = ev => {
      try {
        const db = (ev.target as IDBOpenDBRequest).result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(serialized, STORAGE_KEY);
      } catch {}
    };
  } catch {}
}

export function loadFromIndexedDB(callback: (raw: string) => void): void {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    const req = window.indexedDB.open('HabitTracker1000DB', 1);
    req.onupgradeneeded = ev => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
    };
    req.onsuccess = ev => {
      try {
        const db = (ev.target as IDBOpenDBRequest).result;
        const tx = db.transaction('kv', 'readonly');
        const getReq = tx.objectStore('kv').get(STORAGE_KEY);
        getReq.onsuccess = () => {
          if (getReq.result && typeof getReq.result === 'string') {
            callback(getReq.result);
          }
        };
      } catch {}
    };
  } catch {}
}

export function loadInitialState(): HabitState {
  if (typeof window === 'undefined') return createDefaultState();
  let raw: string | null = null;

  // Layer 1: Embedded JSON inside standalone saved HTML file
  try {
    const embeddedEl = document.getElementById('embedded-app-state');
    if (embeddedEl && embeddedEl.textContent && embeddedEl.textContent.trim().length > 2) {
      raw = embeddedEl.textContent.trim();
    }
  } catch {}

  // Layer 2: Browser localStorage (overrides embedded if newer)
  try {
    const lsRaw = localStorage.getItem(STORAGE_KEY);
    if (lsRaw) raw = lsRaw;
  } catch {}

  // Layer 3: window.name fallback
  if (!raw) {
    try {
      if (window.name && window.name.startsWith('HT1000:')) {
        raw = window.name.slice(7);
      }
    } catch {}
  }

  // Layer 4: URL Hash fallback
  if (!raw) {
    try {
      if (window.location.hash && window.location.hash.startsWith('#ht1000=')) {
        raw = decodeURIComponent(window.location.hash.slice(8));
      }
    } catch {}
  }

  // Layer 5: sessionStorage fallback
  if (!raw) {
    try {
      const ssRaw = sessionStorage.getItem(STORAGE_KEY);
      if (ssRaw) raw = ssRaw;
    } catch {}
  }

  if (raw) {
    try {
      return sanitizeParsedState(JSON.parse(raw));
    } catch {}
  }

  return createDefaultState();
}

export function persistStateEverywhere(state: HabitState): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(state);

  // 1. Embedded DOM tag
  try {
    const embeddedEl = document.getElementById('embedded-app-state');
    if (embeddedEl) embeddedEl.textContent = serialized;
  } catch {}

  // 2. localStorage
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {}

  // 3. sessionStorage
  try {
    sessionStorage.setItem(STORAGE_KEY, serialized);
  } catch {}

  // 4. IndexedDB
  saveToIndexedDB(serialized);

  // 5. window.name
  try {
    window.name = 'HT1000:' + serialized;
  } catch {}

  // 6. URL hash
  try {
    if (serialized.length < 32000) {
      window.history.replaceState(null, '', '#ht1000=' + encodeURIComponent(serialized));
    }
  } catch {}
}

export async function downloadStandaloneHtmlSnapshot(
  state: HabitState,
  customFilename = '1000-Day-Habit-Tracker-Desktop.html'
): Promise<void> {
  persistStateEverywhere(state);
  let templateHtml = '';
  try {
    const res = await fetch('/assets/aistudio/Paste_November_03__2026_-_11_17PM_a86ebd00');
    if (res.ok) {
      templateHtml = await res.text();
    }
  } catch {}

  const serialized = JSON.stringify(state);
  let finalHtml = '';

  if (templateHtml && templateHtml.includes('id="embedded-app-state"')) {
    finalHtml = templateHtml.replace(
      /<script id="embedded-app-state" type="application\/json">[\s\S]*?<\/script>/,
      `<script id="embedded-app-state" type="application/json">${serialized}</script>`
    );
  } else {
    const doctype = '<!DOCTYPE html>\n';
    finalHtml = doctype + document.documentElement.outerHTML;
  }

  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = customFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadDesktopWindowLauncher(state: HabitState, platform: 'windows' | 'mac'): void {
  persistStateEverywhere(state);
  const appUrl = window.location.origin + window.location.pathname;

  if (platform === 'windows') {
    const batContent = [
      '@echo off',
      'title 1000-Day Habit Tracker Desktop Launcher',
      'if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (',
      `  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="${appUrl}"`,
      '  exit',
      ')',
      'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (',
      `  start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="${appUrl}"`,
      '  exit',
      ')',
      'if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (',
      `  start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="${appUrl}"`,
      '  exit',
      ')',
      `start "" "${appUrl}"`
    ].join('\r\n');

    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Open-1000-Day-Habit-Tracker-Desktop.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    const shContent = [
      '#!/bin/bash',
      `APP_URL="${appUrl}"`,
      'if [ -d "/Applications/Google Chrome.app" ]; then',
      '  open -n -a "Google Chrome" --args --app="$APP_URL"',
      'elif [ -d "/Applications/Brave Browser.app" ]; then',
      '  open -n -a "Brave Browser" --args --app="$APP_URL"',
      'elif [ -d "/Applications/Microsoft Edge.app" ]; then',
      '  open -n -a "Microsoft Edge" --args --app="$APP_URL"',
      'else',
      '  open "$APP_URL"',
      'fi'
    ].join('\n');

    const blob = new Blob([shContent], { type: 'application/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Open-1000-Day-Habit-Tracker-Desktop.command';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

