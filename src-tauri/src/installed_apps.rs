use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
#[cfg(windows)]
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ};
#[cfg(windows)]
use winreg::RegKey;

#[derive(Debug, Serialize, Clone)]
pub struct InstalledApp {
    pub id: String,
    pub name: String,
    pub launch_path: String,
    pub location: Option<String>,
    pub source: String,
}

#[cfg(windows)]
pub fn list_installed_apps() -> Vec<InstalledApp> {
    let mut apps = Vec::new();
    for (root, source) in start_menu_roots() {
        collect_apps_from_start_menu(&root, source, &mut apps);
    }
    collect_apps_from_registry_uninstall(HKEY_CURRENT_USER, "registry-uninstall-user", &mut apps);
    collect_apps_from_registry_uninstall(HKEY_LOCAL_MACHINE, "registry-uninstall-system", &mut apps);
    collect_apps_from_registry_uninstall(
        HKEY_LOCAL_MACHINE,
        "registry-uninstall-system-wow6432",
        &mut apps,
    );
    collect_apps_from_registry_app_paths(HKEY_CURRENT_USER, "registry-app-paths-user", &mut apps);
    collect_apps_from_registry_app_paths(HKEY_LOCAL_MACHINE, "registry-app-paths-system", &mut apps);

    let mut seen_paths = HashSet::new();
    apps.retain(|app| seen_paths.insert(app.launch_path.to_ascii_lowercase()));
    let mut seen_names = HashSet::new();
    apps.retain(|app| seen_names.insert(app.name.to_ascii_lowercase()));
    apps.sort_by_key(|app| app.name.to_ascii_lowercase());
    apps
}

#[cfg(not(windows))]
pub fn list_installed_apps() -> Vec<InstalledApp> {
    Vec::new()
}

#[cfg(windows)]
fn start_menu_roots() -> Vec<(PathBuf, &'static str)> {
    let mut roots = Vec::new();

    if let Some(program_data) = std::env::var_os("ProgramData") {
        roots.push((
            PathBuf::from(program_data).join("Microsoft\\Windows\\Start Menu\\Programs"),
            "system",
        ));
    }

    if let Some(app_data) = std::env::var_os("APPDATA") {
        roots.push((
            PathBuf::from(app_data).join("Microsoft\\Windows\\Start Menu\\Programs"),
            "user",
        ));
    }

    roots
}

#[cfg(windows)]
fn collect_apps_from_start_menu(root: &Path, source: &str, out: &mut Vec<InstalledApp>) {
    if !root.exists() {
        return;
    }

    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let entries = match fs::read_dir(&dir) {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let file_type = match entry.file_type() {
                Ok(kind) => kind,
                Err(_) => continue,
            };

            if file_type.is_dir() {
                stack.push(path);
                continue;
            }

            if !file_type.is_file() || !is_launchable_shortcut(&path) {
                continue;
            }

            let name = match path.file_stem().and_then(|s| s.to_str()) {
                Some(raw) => raw.trim(),
                None => continue,
            };
            if name.is_empty() || is_noise_entry(name) {
                continue;
            }

            let launch_path = path.to_string_lossy().to_string();
            let location = path.strip_prefix(root).ok().and_then(|relative| {
                relative.parent().and_then(|parent| {
                    if parent.as_os_str().is_empty() {
                        None
                    } else {
                        Some(parent.to_string_lossy().replace('\\', " / "))
                    }
                })
            });

            out.push(InstalledApp {
                id: format!("app::{}", launch_path.to_ascii_lowercase()),
                name: name.to_string(),
                launch_path,
                location,
                source: source.to_string(),
            });
        }
    }
}

#[cfg(windows)]
fn is_launchable_shortcut(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|s| s.to_str())
            .map(|s| s.to_ascii_lowercase())
            .as_deref(),
        Some("lnk") | Some("url") | Some("appref-ms") | Some("exe")
    )
}

#[cfg(windows)]
fn is_noise_entry(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    let blocked_tokens = [
        "uninstall",
        "remove",
        "help",
        "readme",
        "documentation",
        "license",
        "updater",
        "update",
    ];
    blocked_tokens.iter().any(|token| lower.contains(token))
}

#[cfg(windows)]
fn collect_apps_from_registry_uninstall(root: isize, source: &str, out: &mut Vec<InstalledApp>) {
    const HKCU_UNINSTALL: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
    const HKLM_UNINSTALL: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
    const HKLM_UNINSTALL_WOW6432: &str = "Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall";

    let root_key = RegKey::predef(root as _);
    let uninstall_path = match source {
        "registry-uninstall-user" => HKCU_UNINSTALL,
        "registry-uninstall-system" => HKLM_UNINSTALL,
        "registry-uninstall-system-wow6432" => HKLM_UNINSTALL_WOW6432,
        _ => HKLM_UNINSTALL,
    };

    let uninstall_key = match root_key.open_subkey_with_flags(uninstall_path, KEY_READ) {
        Ok(key) => key,
        Err(_) => return,
    };

    for subkey_name in uninstall_key.enum_keys().flatten() {
        let app_key = match uninstall_key.open_subkey_with_flags(&subkey_name, KEY_READ) {
            Ok(key) => key,
            Err(_) => continue,
        };

        let name = match read_reg_string(&app_key, "DisplayName") {
            Some(name) if !name.is_empty() => name,
            _ => continue,
        };
        if is_noise_entry(&name) {
            continue;
        }

        let install_location = read_reg_string(&app_key, "InstallLocation");
        let launch_path = read_reg_string(&app_key, "DisplayIcon")
            .and_then(|raw| extract_path_candidate(&raw))
            .or_else(|| {
                install_location
                    .as_deref()
                    .and_then(|dir| find_executable_in_location(dir, &name))
            });

        let Some(launch_path) = launch_path else {
            continue;
        };

        if !is_launchable_shortcut(Path::new(&launch_path)) {
            continue;
        }

        let location = install_location
            .map(|value| value.replace('\\', " / "))
            .or_else(|| {
                Path::new(&launch_path)
                    .parent()
                    .map(|p| p.to_string_lossy().replace('\\', " / "))
            });

        out.push(InstalledApp {
            id: format!("app::{}", launch_path.to_ascii_lowercase()),
            name,
            launch_path,
            location,
            source: source.to_string(),
        });
    }
}

#[cfg(windows)]
fn collect_apps_from_registry_app_paths(root: isize, source: &str, out: &mut Vec<InstalledApp>) {
    const APP_PATHS: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\App Paths";

    let root_key = RegKey::predef(root as _);
    let app_paths_key = match root_key.open_subkey_with_flags(APP_PATHS, KEY_READ) {
        Ok(key) => key,
        Err(_) => return,
    };

    for subkey_name in app_paths_key.enum_keys().flatten() {
        let app_key = match app_paths_key.open_subkey_with_flags(&subkey_name, KEY_READ) {
            Ok(key) => key,
            Err(_) => continue,
        };

        let launch_path = read_reg_string(&app_key, "")
            .and_then(|raw| extract_path_candidate(&raw))
            .or_else(|| {
                read_reg_string(&app_key, "Path").and_then(|raw| extract_path_candidate(&raw))
            });
        let Some(launch_path) = launch_path else {
            continue;
        };
        if !is_launchable_shortcut(Path::new(&launch_path)) {
            continue;
        }

        let name = read_reg_string(&app_key, "FriendlyAppName")
            .or_else(|| {
                Path::new(&launch_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string())
            })
            .or_else(|| {
                Path::new(&subkey_name)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string())
            });
        let Some(name) = name else {
            continue;
        };
        if name.is_empty() || is_noise_entry(&name) {
            continue;
        }

        let location = Path::new(&launch_path)
            .parent()
            .map(|p| p.to_string_lossy().replace('\\', " / "));

        out.push(InstalledApp {
            id: format!("app::{}", launch_path.to_ascii_lowercase()),
            name,
            launch_path,
            location,
            source: source.to_string(),
        });
    }
}

#[cfg(windows)]
fn read_reg_string(key: &RegKey, name: &str) -> Option<String> {
    let value: String = key.get_value(name).ok()?;
    let cleaned = value.trim().trim_matches('"').trim();
    if cleaned.is_empty() {
        None
    } else {
        Some(cleaned.to_string())
    }
}

#[cfg(windows)]
fn extract_path_candidate(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }

    let value_without_index = trimmed.split(',').next().unwrap_or(trimmed).trim();
    let unquoted = value_without_index.trim_matches('"').trim();
    if unquoted.is_empty() {
        return None;
    }

    let lower = unquoted.to_ascii_lowercase();
    for ext in [".exe", ".lnk", ".url", ".appref-ms"] {
        if let Some(idx) = lower.find(ext) {
            let end = idx + ext.len();
            let candidate = &unquoted[..end];
            if !candidate.is_empty() {
                return Some(candidate.to_string());
            }
        }
    }

    Some(unquoted.to_string())
}

#[cfg(windows)]
fn find_executable_in_location(location: &str, app_name: &str) -> Option<String> {
    let path = Path::new(location.trim().trim_matches('"'));
    if path.is_file() && path.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("exe")) {
        return Some(path.to_string_lossy().to_string());
    }
    if !path.is_dir() {
        return None;
    }

    let normalized_name = app_name.to_ascii_lowercase().replace(' ', "");
    let mut best_match: Option<String> = None;
    let mut fallback: Option<String> = None;

    let entries = fs::read_dir(path).ok()?;
    for entry in entries.flatten() {
        let exe_path = entry.path();
        if !exe_path.is_file() {
            continue;
        }
        if !exe_path
            .extension()
            .and_then(|s| s.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("exe"))
        {
            continue;
        }

        let stem = exe_path
            .file_stem()
            .and_then(|s| s.to_str())
            .map(|s| s.to_ascii_lowercase())
            .unwrap_or_default();
        if stem.contains("uninstall") || stem.contains("update") || stem.contains("updater") {
            continue;
        }

        if fallback.is_none() {
            fallback = Some(exe_path.to_string_lossy().to_string());
        }

        let normalized_stem = stem.replace(' ', "");
        if normalized_stem == normalized_name || normalized_stem.contains(&normalized_name) || normalized_name.contains(&normalized_stem) {
            best_match = Some(exe_path.to_string_lossy().to_string());
            break;
        }
    }

    best_match.or(fallback)
}
