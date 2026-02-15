use serde::{Deserialize, Serialize};

/// The type of content detected in a clipboard entry.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ContentType {
    Text,
    Link,
    Email,
    Phone,
    Code,
    Path,
    Number,
    Json,
    Color,
    Image,
}

/// A single clipboard history entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardEntry {
    pub id: String,
    pub content: String,
    pub content_type: ContentType,
    pub source_app: String,
    pub word_count: usize,
    pub char_count: usize,
    pub timestamp: i64,
    pub pinned: bool,
    /// Preview text (truncated to 200 chars).
    pub preview: String,
    /// Hash of content for dedup (used by monitor, not serialized).
    #[serde(skip)]
    #[allow(dead_code)]
    pub content_hash: u64,
}

impl ClipboardEntry {
    pub fn new(content: String, content_type: ContentType, source_app: String) -> Self {
        let preview = if content.len() > 200 {
            format!("{}...", &content[..content.chars().take(200).map(|c| c.len_utf8()).sum()])
        } else {
            content.clone()
        };

        let word_count = content.split_whitespace().count();
        let char_count = content.chars().count();

        let content_hash = Self::hash_content(&content);

        Self {
            id: uuid::Uuid::new_v4().to_string(),
            content,
            content_type,
            source_app,
            word_count,
            char_count,
            timestamp: chrono::Local::now().timestamp_millis(),
            pinned: false,
            preview,
            content_hash,
        }
    }

    pub fn hash_content(content: &str) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut hasher = DefaultHasher::new();
        content.hash(&mut hasher);
        hasher.finish()
    }
}
