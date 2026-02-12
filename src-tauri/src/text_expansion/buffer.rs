/// A fixed-capacity ring buffer that accumulates the most recent keystrokes.
pub struct KeyBuffer {
    buf: Vec<char>,
    capacity: usize,
}

impl KeyBuffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            buf: Vec::with_capacity(capacity),
            capacity,
        }
    }

    pub fn push(&mut self, ch: char) {
        if self.buf.len() >= self.capacity {
            self.buf.remove(0);
        }
        self.buf.push(ch);
    }

    pub fn ends_with(&self, trigger: &str) -> bool {
        let trigger_chars: Vec<char> = trigger.chars().collect();
        if trigger_chars.len() > self.buf.len() {
            return false;
        }
        let start = self.buf.len() - trigger_chars.len();
        self.buf[start..] == trigger_chars[..]
    }

    pub fn clear(&mut self) {
        self.buf.clear();
    }

    pub fn backspace(&mut self) {
        self.buf.pop();
    }
}
