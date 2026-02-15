pub mod classifier;
pub mod entry;
pub mod monitor;
pub mod source_app;
pub mod storage;

use entry::ClipboardEntry;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, RwLock};

/// Shared clipboard history state accessible from Tauri commands.
pub struct ClipboardHistoryState(pub Arc<RwLock<Vec<ClipboardEntry>>>);

/// When `true`, the clipboard monitor ignores the next clipboard change.
/// Used by the text expansion injector to suppress self-monitoring.
pub static SUPPRESS_CLIPBOARD_MONITOR: AtomicBool = AtomicBool::new(false);
