use chrono::Local;
use uuid::Uuid;

use super::injector::get_clipboard_text;

/// Replace dynamic placeholders in a snippet body.
///
/// Supported placeholders:
/// - `{date}`      → e.g. "12 Feb 2026"
/// - `{time}`      → e.g. "3:05 PM"
/// - `{datetime}`  → e.g. "12 Feb 2026 3:05 PM"
/// - `{day}`       → e.g. "Thursday"
/// - `{clipboard}` → current clipboard content
/// - `{uuid}`      → unique UUID v4 per occurrence
pub fn resolve(body: &str) -> String {
    let now = Local::now();
    let date_str = now.format("%-d %b %Y").to_string();
    let time_str = now.format("%-I:%M %p").to_string();
    let datetime_str = format!("{} {}", date_str, time_str);
    let day_str = now.format("%A").to_string();

    let mut result = body.to_string();

    result = result.replace("{date}", &date_str);
    result = result.replace("{time}", &time_str);
    result = result.replace("{datetime}", &datetime_str);
    result = result.replace("{day}", &day_str);

    // {clipboard} → current clipboard content
    if result.contains("{clipboard}") {
        let clip = get_clipboard_text().unwrap_or_default();
        result = result.replace("{clipboard}", &clip);
    }

    // {uuid} → unique UUID v4 per occurrence (each gets its own UUID)
    while result.contains("{uuid}") {
        let id = Uuid::new_v4().to_string();
        result = result.replacen("{uuid}", &id, 1);
    }

    result
}
