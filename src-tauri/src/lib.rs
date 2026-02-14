mod text_expansion;

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tauri::{tray::TrayIconBuilder, Emitter, LogicalSize, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use text_expansion::TriggerMap;

struct CurrentShortcut(Arc<RwLock<Shortcut>>);

fn toggle_window(handle: &tauri::AppHandle) {
    if let Some(window) = handle.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.set_size(LogicalSize::new(760u32, 510u32));
            let _ = window.emit("window-expanded", ());
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

fn parse_modifiers(mods: &[String]) -> Option<Modifiers> {
    let mut result: Option<Modifiers> = None;
    for m in mods {
        let modifier = match m.to_lowercase().as_str() {
            "control" | "ctrl" => Modifiers::CONTROL,
            "alt" => Modifiers::ALT,
            "shift" => Modifiers::SHIFT,
            "meta" | "super" => Modifiers::SUPER,
            _ => continue,
        };
        result = Some(match result {
            Some(existing) => existing | modifier,
            None => modifier,
        });
    }
    result
}

fn parse_key(key: &str) -> Option<Code> {
    Some(match key.to_uppercase().as_str() {
        "A" => Code::KeyA, "B" => Code::KeyB, "C" => Code::KeyC, "D" => Code::KeyD,
        "E" => Code::KeyE, "F" => Code::KeyF, "G" => Code::KeyG, "H" => Code::KeyH,
        "I" => Code::KeyI, "J" => Code::KeyJ, "K" => Code::KeyK, "L" => Code::KeyL,
        "M" => Code::KeyM, "N" => Code::KeyN, "O" => Code::KeyO, "P" => Code::KeyP,
        "Q" => Code::KeyQ, "R" => Code::KeyR, "S" => Code::KeyS, "T" => Code::KeyT,
        "U" => Code::KeyU, "V" => Code::KeyV, "W" => Code::KeyW, "X" => Code::KeyX,
        "Y" => Code::KeyY, "Z" => Code::KeyZ,
        "0" => Code::Digit0, "1" => Code::Digit1, "2" => Code::Digit2,
        "3" => Code::Digit3, "4" => Code::Digit4, "5" => Code::Digit5,
        "6" => Code::Digit6, "7" => Code::Digit7, "8" => Code::Digit8,
        "9" => Code::Digit9,
        _ => return None,
    })
}

#[tauri::command]
fn paste_snippet(app_handle: tauri::AppHandle, body: String) -> Result<(), String> {
    // Hide the window first
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.hide();
    }

    // Resolve placeholders and inject in a background thread
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(150));
        let resolved = text_expansion::placeholder::resolve(&body);
        text_expansion::injector::inject_snippet(0, &resolved);
    });

    Ok(())
}

#[tauri::command]
fn open_link(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.hide();
    }
    open::that(&url).map_err(|e| e.to_string())
}

#[tauri::command]
fn sync_triggers(
    trigger_map: tauri::State<'_, TriggerMap>,
    triggers: HashMap<String, String>,
) -> Result<(), String> {
    let mut map = trigger_map.0.write().map_err(|e| e.to_string())?;
    map.clear();
    map.extend(triggers);
    log::info!("Trigger map synced – {} entries", map.len());
    Ok(())
}

#[tauri::command]
fn change_shortcut(
    app_handle: tauri::AppHandle,
    current_shortcut: tauri::State<'_, CurrentShortcut>,
    modifiers: Vec<String>,
    key: String,
) -> Result<(), String> {
    let old = *current_shortcut.0.read().map_err(|e| e.to_string())?;
    app_handle
        .global_shortcut()
        .unregister(old)
        .map_err(|e| e.to_string())?;

    let mods = parse_modifiers(&modifiers);
    let code = parse_key(&key).ok_or_else(|| format!("Unsupported key: {key}"))?;
    let new_shortcut = Shortcut::new(mods, code);

    app_handle
        .global_shortcut()
        .register(new_shortcut)
        .map_err(|e| e.to_string())?;

    *current_shortcut.0.write().map_err(|e| e.to_string())? = new_shortcut;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![sync_triggers, change_shortcut, paste_snippet, open_link])
        .setup(move |app| {
            // Tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("OhMyCommandBar")
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let window = tray.app_handle().get_webview_window("main").unwrap();
                        let _ = window.set_size(LogicalSize::new(760u32, 510u32));
                        let _ = window.emit("window-expanded", ());
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                })
                .build(app)?;

            // Global shortcut
            let handle = app.handle().clone();
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |_app, _shortcut, event| {
                        if event.state == ShortcutState::Pressed {
                            toggle_window(&handle);
                        }
                    })
                    .build(),
            )?;

            let default_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyK);
            app.global_shortcut().register(default_shortcut)?;
            app.manage(CurrentShortcut(Arc::new(RwLock::new(default_shortcut))));

            // Trigger map
            let trigger_arc = Arc::new(RwLock::new(HashMap::<String, String>::new()));
            app.manage(TriggerMap(Arc::clone(&trigger_arc)));

            // Text expansion listener
            text_expansion::listener::start_listener(Arc::clone(&trigger_arc));

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
