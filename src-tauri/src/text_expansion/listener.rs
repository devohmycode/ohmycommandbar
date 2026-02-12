use super::buffer::KeyBuffer;
use super::injector;
use super::placeholder;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::thread;

/// Spawn a background thread that listens for global key events via `rdev`.
pub fn start_listener(trigger_map: Arc<RwLock<HashMap<String, String>>>) {
    thread::spawn(move || {
        let trigger_map = trigger_map;
        let buffer = std::cell::RefCell::new(KeyBuffer::new(64));

        let callback = move |event: rdev::Event| {
            match event.event_type {
                rdev::EventType::KeyPress(key) => {
                    let mut buf = buffer.borrow_mut();

                    match key {
                        rdev::Key::Backspace => {
                            buf.backspace();
                        }
                        rdev::Key::Return | rdev::Key::Space | rdev::Key::Tab => {
                            if key == rdev::Key::Space {
                                buf.push(' ');
                            }

                            if let Ok(map) = trigger_map.read() {
                                for (trigger, content) in map.iter() {
                                    if buf.ends_with(trigger) {
                                        let tlen = trigger.chars().count();
                                        let snippet = content.clone();
                                        thread::spawn(move || {
                                            let resolved = placeholder::resolve(&snippet);
                                            injector::inject_snippet(tlen, &resolved);
                                        });
                                        buf.clear();
                                        return;
                                    }
                                }
                            }

                            buf.clear();
                        }
                        _ => {
                            if let Some(name) = event.name {
                                for ch in name.chars() {
                                    buf.push(ch);
                                }
                            }

                            if let Ok(map) = trigger_map.read() {
                                for (trigger, content) in map.iter() {
                                    if buf.ends_with(trigger) {
                                        let tlen = trigger.chars().count();
                                        let snippet = content.clone();
                                        thread::spawn(move || {
                                            let resolved = placeholder::resolve(&snippet);
                                            injector::inject_snippet(tlen, &resolved);
                                        });
                                        buf.clear();
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        };

        log::info!("Text expansion listener started");
        if let Err(error) = rdev::listen(callback) {
            log::error!("rdev listen error: {:?}", error);
        }
    });
}
