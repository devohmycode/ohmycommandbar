pub mod buffer;
pub mod injector;
pub mod listener;
pub mod placeholder;

use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// Shared mapping from trigger string -> snippet content.
pub struct TriggerMap(pub Arc<RwLock<HashMap<String, String>>>);
