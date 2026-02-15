use super::entry::{ClipboardEntry, ContentType};
use super::{classifier, source_app, storage, SUPPRESS_CLIPBOARD_MONITOR};
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::sync::{Arc, RwLock};
use std::time::Instant;
use tauri::{AppHandle, Emitter};

/// Start the clipboard monitor on a background thread.
/// Creates a hidden message-only window and listens for WM_CLIPBOARDUPDATE.
pub fn start_monitor(
    app_handle: AppHandle,
    entries: Arc<RwLock<Vec<ClipboardEntry>>>,
    app_data_dir: PathBuf,
) {
    std::thread::spawn(move || {
        run_monitor_loop(app_handle, entries, app_data_dir);
    });
}

#[cfg(target_os = "windows")]
fn run_monitor_loop(
    app_handle: AppHandle,
    entries: Arc<RwLock<Vec<ClipboardEntry>>>,
    app_data_dir: PathBuf,
) {
    use std::ffi::c_void;

    const WM_CLIPBOARDUPDATE: u32 = 0x031D;
    const WS_EX_NOACTIVATE: u32 = 0x08000000;
    const HWND_MESSAGE: isize = -3;

    #[repr(C)]
    struct WndClassExW {
        cb_size: u32,
        style: u32,
        lpfn_wnd_proc: unsafe extern "system" fn(*mut c_void, u32, usize, isize) -> isize,
        cb_cls_extra: i32,
        cb_wnd_extra: i32,
        h_instance: *mut c_void,
        h_icon: *mut c_void,
        h_cursor: *mut c_void,
        hbr_background: *mut c_void,
        lpsz_menu_name: *const u16,
        lpsz_class_name: *const u16,
        h_icon_sm: *mut c_void,
    }

    #[repr(C)]
    struct Msg {
        hwnd: *mut c_void,
        message: u32,
        w_param: usize,
        l_param: isize,
        time: u32,
        pt_x: i32,
        pt_y: i32,
    }

    extern "system" {
        fn RegisterClassExW(wc: *const WndClassExW) -> u16;
        fn CreateWindowExW(
            ex_style: u32,
            class_name: *const u16,
            window_name: *const u16,
            style: u32,
            x: i32,
            y: i32,
            w: i32,
            h: i32,
            parent: isize,
            menu: *mut c_void,
            instance: *mut c_void,
            param: *mut c_void,
        ) -> *mut c_void;
        fn AddClipboardFormatListener(hwnd: *mut c_void) -> i32;
        fn GetMessageW(msg: *mut Msg, hwnd: *mut c_void, min: u32, max: u32) -> i32;
        fn TranslateMessage(msg: *const Msg) -> i32;
        fn DispatchMessageW(msg: *const Msg) -> isize;
        fn DefWindowProcW(hwnd: *mut c_void, msg: u32, w: usize, l: isize) -> isize;
        fn GetModuleHandleW(name: *const u16) -> *mut c_void;
    }

    // We store context in a thread-local so our wndproc can access it.
    thread_local! {
        static MONITOR_CTX: std::cell::RefCell<Option<MonitorContext>> = const { std::cell::RefCell::new(None) };
    }

    struct MonitorContext {
        app_handle: AppHandle,
        entries: Arc<RwLock<Vec<ClipboardEntry>>>,
        app_data_dir: PathBuf,
        last_hash: u64,
        last_time: Instant,
    }

    unsafe extern "system" fn wnd_proc(
        hwnd: *mut c_void,
        msg: u32,
        w_param: usize,
        l_param: isize,
    ) -> isize {
        if msg == WM_CLIPBOARDUPDATE {
            MONITOR_CTX.with(|ctx| {
                if let Some(ctx) = ctx.borrow_mut().as_mut() {
                    handle_clipboard_update(ctx);
                }
            });
            return 0;
        }
        DefWindowProcW(hwnd, msg, w_param, l_param)
    }

    fn handle_clipboard_update(ctx: &mut MonitorContext) {
        // Check suppression flag (set by text expansion injector)
        if SUPPRESS_CLIPBOARD_MONITOR.load(Ordering::SeqCst) {
            return;
        }

        // Debounce: skip if last change was < 100ms ago
        let now = Instant::now();
        if now.duration_since(ctx.last_time).as_millis() < 100 {
            return;
        }
        ctx.last_time = now;

        // Read clipboard text
        let text = match crate::text_expansion::injector::get_clipboard_text() {
            Some(t) if !t.is_empty() => t,
            _ => return,
        };

        // Skip entries > 1MB
        if text.len() > 1_000_000 {
            return;
        }

        // Dedup: skip if content matches last entry
        let hash = ClipboardEntry::hash_content(&text);
        if hash == ctx.last_hash {
            return;
        }
        ctx.last_hash = hash;

        // Classify content
        let content_type = classifier::classify(&text);

        // Skip image type for now (text-only MVP)
        if content_type == ContentType::Image {
            return;
        }

        // Detect source application
        let source_app = source_app::get_foreground_app_name();

        // Build entry
        let entry = ClipboardEntry::new(text, content_type, source_app);

        // Add to state
        if let Ok(mut entries) = ctx.entries.write() {
            entries.insert(0, entry.clone());

            // Persist
            storage::save(&ctx.app_data_dir, &entries);
        }

        // Emit event to frontend
        let _ = ctx.app_handle.emit("clipboard-changed", &entry);
    }

    // Register window class
    unsafe {
        let class_name: Vec<u16> = "OhMyClipboardMonitor\0"
            .encode_utf16()
            .collect();

        let h_instance = GetModuleHandleW(std::ptr::null());

        let wc = WndClassExW {
            cb_size: std::mem::size_of::<WndClassExW>() as u32,
            style: 0,
            lpfn_wnd_proc: wnd_proc,
            cb_cls_extra: 0,
            cb_wnd_extra: 0,
            h_instance,
            h_icon: std::ptr::null_mut(),
            h_cursor: std::ptr::null_mut(),
            hbr_background: std::ptr::null_mut(),
            lpsz_menu_name: std::ptr::null(),
            lpsz_class_name: class_name.as_ptr(),
            h_icon_sm: std::ptr::null_mut(),
        };

        let atom = RegisterClassExW(&wc);
        if atom == 0 {
            log::error!("Failed to register clipboard monitor window class");
            return;
        }

        let window_name: Vec<u16> = "ClipboardMonitor\0".encode_utf16().collect();
        let hwnd = CreateWindowExW(
            WS_EX_NOACTIVATE,
            class_name.as_ptr(),
            window_name.as_ptr(),
            0,
            0, 0, 0, 0,
            HWND_MESSAGE,
            std::ptr::null_mut(),
            h_instance,
            std::ptr::null_mut(),
        );

        if hwnd.is_null() {
            log::error!("Failed to create clipboard monitor window");
            return;
        }

        if AddClipboardFormatListener(hwnd) == 0 {
            log::error!("Failed to add clipboard format listener");
            return;
        }

        log::info!("Clipboard monitor started");

        // Set context for the wndproc
        MONITOR_CTX.with(|ctx| {
            *ctx.borrow_mut() = Some(MonitorContext {
                app_handle,
                entries,
                app_data_dir,
                last_hash: 0,
                last_time: Instant::now(),
            });
        });

        // Message pump
        let mut msg: Msg = std::mem::zeroed();
        while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn run_monitor_loop(
    _app_handle: AppHandle,
    _entries: Arc<RwLock<Vec<ClipboardEntry>>>,
    _app_data_dir: PathBuf,
) {
    log::warn!("Clipboard monitoring is only supported on Windows");
}
