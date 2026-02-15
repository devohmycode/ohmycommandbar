/**
 * Save user preferences to a file in the user's home directory
 * This allows the preferences to persist and be read by the build script
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface AppPreferences {
  blurRadius?: number;
  glassOpacity?: number;
  alwaysOnTop?: boolean;
  shortcut?: {
    modifiers: string[];
    key: string;
  };
}

const PREFS_DIR = join(homedir(), '.ohmycommandbar');
const PREFS_FILE = join(PREFS_DIR, 'preferences.json');

export function savePreferences(prefs: AppPreferences): void {
  try {
    // Ensure directory exists
    if (!existsSync(PREFS_DIR)) {
      mkdirSync(PREFS_DIR, { recursive: true });
    }

    // Read existing preferences
    let existing: AppPreferences = {};
    try {
      if (existsSync(PREFS_FILE)) {
        const content = require('fs').readFileSync(PREFS_FILE, 'utf8');
        existing = JSON.parse(content);
      }
    } catch (e) {
      // Ignore read errors
    }

    // Merge with new preferences
    const updated = { ...existing, ...prefs };

    // Write to file
    writeFileSync(PREFS_FILE, JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

export function loadPreferences(): AppPreferences {
  try {
    if (existsSync(PREFS_FILE)) {
      const content = require('fs').readFileSync(PREFS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
  return {};
}
