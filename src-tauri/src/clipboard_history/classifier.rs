use super::entry::ContentType;
use regex::Regex;
use std::sync::LazyLock;

static RE_URL: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^https?://\S+$").unwrap());

static RE_EMAIL: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$").unwrap());

static RE_PHONE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^\+?[\d\s\-().]{7,20}$").unwrap());

static RE_PATH: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^([a-z]:\\|/|\\\\|~/)[^\x00]*$").unwrap());

static RE_COLOR: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$").unwrap());

static RE_NUMBER: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^-?\d[\d,]*\.?\d*$").unwrap());

/// Classify the content type of a clipboard text string.
pub fn classify(text: &str) -> ContentType {
    let trimmed = text.trim();

    // Single-line checks (no newlines)
    if !trimmed.contains('\n') {
        if RE_URL.is_match(trimmed) {
            return ContentType::Link;
        }
        if RE_EMAIL.is_match(trimmed) {
            return ContentType::Email;
        }
        if RE_PHONE.is_match(trimmed) {
            return ContentType::Phone;
        }
        if RE_COLOR.is_match(trimmed) {
            return ContentType::Color;
        }
        if RE_NUMBER.is_match(trimmed) {
            return ContentType::Number;
        }
        if RE_PATH.is_match(trimmed) {
            return ContentType::Path;
        }
    }

    // JSON check (multi-line okay)
    if (trimmed.starts_with('{') && trimmed.ends_with('}'))
        || (trimmed.starts_with('[') && trimmed.ends_with(']'))
    {
        if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
            return ContentType::Json;
        }
    }

    // Code heuristics: look for common programming patterns
    if looks_like_code(trimmed) {
        return ContentType::Code;
    }

    ContentType::Text
}

fn looks_like_code(text: &str) -> bool {
    let indicators = [
        "fn ", "pub ", "let ", "const ", "var ", "function ", "class ",
        "import ", "export ", "return ", "if (", "for (", "while (",
        "def ", "async ", "await ", "=>", "->", "::", "&&", "||",
        "println!", "console.log", "System.out", "fmt.",
        "struct ", "enum ", "interface ", "type ", "impl ",
        "#include", "#define", "using namespace",
    ];
    let count = indicators.iter().filter(|&&ind| text.contains(ind)).count();
    // If 2+ indicators or has semicolons at line ends and braces
    if count >= 2 {
        return true;
    }
    let has_braces = text.contains('{') && text.contains('}');
    let has_semicolons = text.lines().filter(|l| l.trim_end().ends_with(';')).count() >= 2;
    has_braces && has_semicolons
}
