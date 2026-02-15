/// Get the name of the foreground application (Windows only).
#[cfg(target_os = "windows")]
pub fn get_foreground_app_name() -> String {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return "Unknown".into();
        }

        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut process_id);
        if process_id == 0 {
            return "Unknown".into();
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, process_id);
        if handle.is_null() {
            return "Unknown".into();
        }

        let mut buf = [0u16; 260];
        let mut size = buf.len() as u32;
        let ok = QueryFullProcessImageNameW(handle, 0, buf.as_mut_ptr(), &mut size);
        CloseHandle(handle);

        if ok == 0 {
            return "Unknown".into();
        }

        let path = String::from_utf16_lossy(&buf[..size as usize]);
        // Extract just the filename without extension
        path.rsplit('\\')
            .next()
            .unwrap_or("Unknown")
            .trim_end_matches(".exe")
            .trim_end_matches(".EXE")
            .to_string()
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_foreground_app_name() -> String {
    "Unknown".into()
}

// Win32 FFI bindings
#[cfg(target_os = "windows")]
const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;

#[cfg(target_os = "windows")]
extern "system" {
    fn GetForegroundWindow() -> *mut std::ffi::c_void;
    fn GetWindowThreadProcessId(hwnd: *mut std::ffi::c_void, process_id: *mut u32) -> u32;
    fn OpenProcess(access: u32, inherit: i32, pid: u32) -> *mut std::ffi::c_void;
    fn QueryFullProcessImageNameW(
        handle: *mut std::ffi::c_void,
        flags: u32,
        name: *mut u16,
        size: *mut u32,
    ) -> i32;
    fn CloseHandle(handle: *mut std::ffi::c_void) -> i32;
}
