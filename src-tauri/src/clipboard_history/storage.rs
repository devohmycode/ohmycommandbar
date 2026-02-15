use super::entry::ClipboardEntry;
use std::path::PathBuf;

const FILE_NAME: &str = "clipboard_history.json";
const MAX_ENTRIES: usize = 500;

/// Get the storage file path inside the app data directory.
pub fn storage_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join(FILE_NAME)
}

/// Load clipboard history from disk.
pub fn load(app_data_dir: &PathBuf) -> Vec<ClipboardEntry> {
    let path = storage_path(app_data_dir);
    match std::fs::read_to_string(&path) {
        Ok(json) => serde_json::from_str(&json).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

/// Save clipboard history to disk, enforcing the max entry limit.
/// Removes oldest unpinned entries when over the limit.
pub fn save(app_data_dir: &PathBuf, entries: &[ClipboardEntry]) {
    let path = storage_path(app_data_dir);

    // Ensure the directory exists
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    // Enforce max entries: keep all pinned + newest unpinned up to MAX_ENTRIES
    let to_save: Vec<&ClipboardEntry> = if entries.len() > MAX_ENTRIES {
        let pinned: Vec<&ClipboardEntry> = entries.iter().filter(|e| e.pinned).collect();
        let mut unpinned: Vec<&ClipboardEntry> = entries.iter().filter(|e| !e.pinned).collect();
        // Sort unpinned by timestamp descending (newest first)
        unpinned.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        let remaining = MAX_ENTRIES.saturating_sub(pinned.len());
        unpinned.truncate(remaining);
        let mut result = pinned;
        result.extend(unpinned);
        result
    } else {
        entries.iter().collect()
    };

    match serde_json::to_string(&to_save) {
        Ok(json) => {
            if let Err(e) = std::fs::write(&path, json) {
                log::error!("Failed to save clipboard history: {}", e);
            }
        }
        Err(e) => log::error!("Failed to serialize clipboard history: {}", e),
    }
}
