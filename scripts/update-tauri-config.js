#!/usr/bin/env node

/**
 * Update tauri.conf.json with user preferences from saved preferences
 * This script reads the saved blur radius and updates the config before build
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to tauri.conf.json
const configPath = path.join(__dirname, '../src-tauri/tauri.conf.json');

// Try to read blur radius from Tauri app data preferences file
// The path varies by OS:
// - Windows: %APPDATA%\com.ohmycommandbar.app\preferences.json
// - macOS: ~/Library/Application Support/com.ohmycommandbar.app/preferences.json
// - Linux: ~/.config/com.ohmycommandbar.app/preferences.json

function getPrefsPath() {
  const appIdentifier = 'com.ohmycommandbar.app';
  const platform = os.platform();
  
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', appIdentifier, 'preferences.json');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appIdentifier, 'preferences.json');
  } else {
    return path.join(os.homedir(), '.config', appIdentifier, 'preferences.json');
  }
}

const prefsPath = getPrefsPath();
let blurRadius = 8.0; // Default value

try {
  if (fs.existsSync(prefsPath)) {
    const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    if (prefs.blur_radius !== undefined && prefs.blur_radius !== null) {
      blurRadius = parseFloat(prefs.blur_radius);
      console.log(`📝 Using saved blur radius: ${blurRadius}`);
    } else {
      console.log(`ℹ️  No blur radius in preferences, using default: ${blurRadius}`);
    }
  } else {
    console.log(`ℹ️  No preferences file found, using default blur radius: ${blurRadius}`);
  }
} catch (error) {
  console.log(`⚠️  Could not read preferences (${error.message}), using default blur radius: ${blurRadius}`);
}

// Read and update tauri.conf.json
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Update window effects
  if (config.app && config.app.windows && config.app.windows[0]) {
    if (!config.app.windows[0].windowEffects) {
      config.app.windows[0].windowEffects = {};
    }
    
    config.app.windows[0].windowEffects = {
      effects: ["blur"],
      state: "active",
      radius: blurRadius
    };
    
    // Ensure tabbingIdentifier is set
    if (!config.app.windows[0].tabbingIdentifier) {
      config.app.windows[0].tabbingIdentifier = "main";
    }
    
    // Write back
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Updated tauri.conf.json with blur radius: ${blurRadius}`);
  }
} catch (error) {
  console.error(`❌ Error updating tauri.conf.json:`, error.message);
  process.exit(1);
}
