use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// Inject a snippet to replace the trigger text the user just typed.
pub fn inject_snippet(trigger_len: usize, content: &str) {
    thread::sleep(Duration::from_millis(30));

    let mut enigo = match Enigo::new(&Settings::default()) {
        Ok(e) => e,
        Err(err) => {
            log::error!("Failed to create Enigo instance: {}", err);
            return;
        }
    };

    // Step 1: Save current clipboard
    let saved_clipboard = get_clipboard_text();

    // Step 2: Erase the trigger with backspaces
    for _ in 0..trigger_len {
        if let Err(e) = enigo.key(Key::Backspace, Direction::Click) {
            log::error!("Backspace failed: {}", e);
            return;
        }
        thread::sleep(Duration::from_millis(5));
    }

    // Step 3: Copy snippet content to clipboard
    set_clipboard_text(content);
    thread::sleep(Duration::from_millis(50));

    // Step 4: Paste via Ctrl+V
    if let Err(e) = enigo.key(Key::Control, Direction::Press) {
        log::error!("Ctrl press failed: {}", e);
        return;
    }
    if let Err(e) = enigo.key(Key::Unicode('v'), Direction::Click) {
        log::error!("V click failed: {}", e);
    }
    if let Err(e) = enigo.key(Key::Control, Direction::Release) {
        log::error!("Ctrl release failed: {}", e);
    }

    // Step 5: Restore original clipboard after a delay
    thread::sleep(Duration::from_millis(150));
    if let Some(ref original) = saved_clipboard {
        set_clipboard_text(original);
    }
}

// ---------------------------------------------------------------------------
// Clipboard helpers – Windows
// ---------------------------------------------------------------------------

#[cfg(target_os = "windows")]
pub fn get_clipboard_text() -> Option<String> {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    unsafe {
        if OpenClipboard(std::ptr::null_mut()) == 0 {
            return None;
        }
        let handle = GetClipboardData(CF_UNICODETEXT);
        if handle.is_null() {
            CloseClipboard();
            return None;
        }
        let ptr = GlobalLock(handle) as *const u16;
        if ptr.is_null() {
            CloseClipboard();
            return None;
        }
        let mut len = 0;
        while *ptr.add(len) != 0 {
            len += 1;
        }
        let slice = std::slice::from_raw_parts(ptr, len);
        let text = OsString::from_wide(slice).to_string_lossy().into_owned();
        GlobalUnlock(handle);
        CloseClipboard();
        Some(text)
    }
}

#[cfg(target_os = "windows")]
fn set_clipboard_text(text: &str) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let wide: Vec<u16> = OsStr::new(text)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        if OpenClipboard(std::ptr::null_mut()) == 0 {
            return;
        }
        EmptyClipboard();
        let size = wide.len() * std::mem::size_of::<u16>();
        let hmem = GlobalAlloc(GMEM_MOVEABLE, size);
        if hmem.is_null() {
            CloseClipboard();
            return;
        }
        let dst = GlobalLock(hmem) as *mut u16;
        if dst.is_null() {
            GlobalFree(hmem);
            CloseClipboard();
            return;
        }
        std::ptr::copy_nonoverlapping(wide.as_ptr(), dst, wide.len());
        GlobalUnlock(hmem);
        SetClipboardData(CF_UNICODETEXT, hmem);
        CloseClipboard();
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_clipboard_text() -> Option<String> {
    None
}

#[cfg(not(target_os = "windows"))]
fn set_clipboard_text(_text: &str) {}

// ---------------------------------------------------------------------------
// Win32 FFI bindings
// ---------------------------------------------------------------------------
#[cfg(target_os = "windows")]
const CF_UNICODETEXT: u32 = 13;
#[cfg(target_os = "windows")]
const GMEM_MOVEABLE: u32 = 0x0002;

#[cfg(target_os = "windows")]
extern "system" {
    fn OpenClipboard(hwnd: *mut std::ffi::c_void) -> i32;
    fn CloseClipboard() -> i32;
    fn EmptyClipboard() -> i32;
    fn GetClipboardData(format: u32) -> *mut std::ffi::c_void;
    fn SetClipboardData(format: u32, hmem: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
    fn GlobalAlloc(flags: u32, bytes: usize) -> *mut std::ffi::c_void;
    fn GlobalLock(hmem: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
    fn GlobalUnlock(hmem: *mut std::ffi::c_void) -> i32;
    fn GlobalFree(hmem: *mut std::ffi::c_void) -> *mut std::ffi::c_void;
}
