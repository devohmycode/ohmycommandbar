![OhMyCB](https://github.com/devohmycode/ohmycommandbar/blob/master/src-tauri/icons/ohmycb.png)

# OhMyCommandBar

A Raycast-inspired productivity launcher for Windows, built with Tauri 2 + Next.js + React 19.

Summon a floating command bar with a global shortcut, search your snippets and quicklinks, and get things done without leaving the keyboard.

## Release notes

-0.1.2 : 
    - Add search support by Everything 
- 0.1.1 : 
    - Add Windows system execution commands
    - Add a URL link saving system
    - Add theme options in settings
- 0.1.0 : Initial commit

## Features

- **Command Bar** — Global shortcut (`Ctrl+K` by default) to summon/dismiss a floating, transparent overlay
- **Snippets** — Save reusable text blocks with keywords, trigger inline text expansion anywhere on your system
- **Quicklinks** — Save URLs, deeplinks, or file paths and open them instantly from the command bar
- **Dynamic Placeholders** — Use `{date}`, `{time}`, `{datetime}`, `{day}`, `{clipboard}`, `{uuid}` in both snippets and quicklinks
- **Text Expansion** — Type a keyword (e.g. `/sig`) anywhere and it auto-expands into your snippet body
- **Pin & Organize** — Pin frequently used items to the top, tag them for filtering
- **Glass UI** — Transparent, borderless window with adjustable opacity
- **Settings** — Configurable global shortcut, opacity, always-on-top

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Toggle command bar (configurable) |
| `↑` / `↓` | Navigate items |
| `Enter` | Copy snippet / Open quicklink |
| `Ctrl+Enter` | Paste snippet at cursor |
| `Ctrl+C` | Copy quicklink URL |
| `Ctrl+E` | Edit selected item |
| `Ctrl+D` | Duplicate selected item |
| `Ctrl+P` | Pin / Unpin selected item |
| `Ctrl+N` | New snippet |
| `Ctrl+L` | New quicklink |
| `Esc` | Reset search / Close form |

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app/) (Rust) |
| Frontend | [Next.js 16](https://nextjs.org/) (static export) |
| UI | React 19 + Tailwind CSS + Lucide icons |
| Text expansion | Rust (`rdev` for key listening, `enigo` for injection) |
| Storage | `localStorage` (JSON) |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)
- [Rust](https://rustup.rs/) (stable toolchain)
- Tauri 2 system dependencies — see [Tauri prerequisites](https://tauri.app/start/prerequisites/)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in dev mode (starts Next.js + Tauri)
pnpm tauri:dev

# Build for production
pnpm tauri:build
```

## Project Structure

```
├── app/                    # Next.js app router
├── components/
│   ├── command-bar.tsx     # Main command bar UI
│   ├── snippet-form.tsx    # Snippet create/edit form
│   ├── quicklink-form.tsx  # Quicklink create/edit form
│   ├── icon-picker.tsx     # Icon selector (25 Lucide icons)
│   └── settings-menu.tsx   # Settings panel (shortcut, opacity, always-on-top)
├── hooks/
│   ├── use-snippets.ts     # Snippet CRUD + backend sync
│   └── use-quicklinks.ts   # Quicklink CRUD
├── lib/
│   └── resolve-placeholders.ts  # Dynamic placeholder resolution
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                # Tauri commands (paste, open_link, shortcuts)
│   │   └── text_expansion/       # Rust text expansion engine
│   │       ├── listener.rs       # Global key listener (rdev)
│   │       ├── buffer.rs         # Keystroke buffer
│   │       ├── injector.rs       # Text injection (enigo)
│   │       └── placeholder.rs    # Server-side placeholder resolution
│   └── Cargo.toml
├── styles/                 # Global CSS
└── tailwind.config.ts
```

## License

MIT
