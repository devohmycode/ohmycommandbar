'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { X, Keyboard, Pin } from 'lucide-react'

interface ShortcutConfig {
  modifiers: string[]
  key: string
}

function formatShortcut(config: ShortcutConfig): string {
  const labels = config.modifiers.map((m) =>
    m === 'Control' ? 'Ctrl' : m
  )
  return [...labels, config.key].join(' + ')
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [opacity, setOpacity] = useState(() => {
    if (typeof window === 'undefined') return 82
    return Number(localStorage.getItem('glass-opacity') ?? '82')
  })

  const [shortcut, setShortcut] = useState<ShortcutConfig>(() => {
    if (typeof window === 'undefined') return { modifiers: ['Control'], key: 'K' }
    try {
      const saved = localStorage.getItem('shortcut')
      return saved ? JSON.parse(saved) : { modifiers: ['Control'], key: 'K' }
    } catch {
      return { modifiers: ['Control'], key: 'K' }
    }
  })

  const [alwaysOnTop, setAlwaysOnTop] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('always-on-top') === 'true'
  })

  const [capturing, setCapturing] = useState(false)
  const captureRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    getCurrentWindow().setAlwaysOnTop(alwaysOnTop).catch(() => {})
    localStorage.setItem('always-on-top', String(alwaysOnTop))
  }, [alwaysOnTop])

  useEffect(() => {
    const alpha = opacity / 100
    document.documentElement.style.setProperty(
      '--glass-bg',
      `rgba(10, 10, 14, ${alpha})`
    )
    localStorage.setItem('glass-opacity', String(opacity))
  }, [opacity])

  useEffect(() => {
    if (capturing && captureRef.current) captureRef.current.focus()
  }, [capturing])

  const handleCaptureKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!capturing) return
      e.preventDefault()
      e.stopPropagation()
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return
      if (!/^[a-zA-Z0-9]$/.test(e.key)) return
      const mods: string[] = []
      if (e.ctrlKey) mods.push('Control')
      if (e.altKey) mods.push('Alt')
      if (e.shiftKey) mods.push('Shift')
      if (e.metaKey) mods.push('Meta')
      if (mods.length === 0) return
      const key = e.key.toUpperCase()
      setCapturing(false)
      invoke('change_shortcut', { modifiers: mods, key })
        .then(() => {
          const config: ShortcutConfig = { modifiers: mods, key }
          setShortcut(config)
          localStorage.setItem('shortcut', JSON.stringify(config))
        })
        .catch(console.error)
    },
    [capturing]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !capturing) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [capturing, onClose])

  return (
    <div className="flex h-full flex-col p-5 animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[13px] font-semibold text-white/80 tracking-tight">Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/25 hover:text-white/50 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Opacity */}
      <div className="mb-8">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">
          Appearance
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Glass opacity</span>
            <span
              className="text-[11px] text-white/30 tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {opacity}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="glass-slider w-full"
          />
          <div
            className="relative h-14 rounded-lg border border-white/[0.06] overflow-hidden"
            style={{
              backgroundImage: "url('/wallpaper.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `rgba(10, 10, 14, ${opacity / 100})`,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              <span className="text-[10px] text-white/25">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior */}
      <div className="mb-8">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">
          Behavior
        </p>
        <button
          type="button"
          onClick={() => setAlwaysOnTop(!alwaysOnTop)}
          className="w-full flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 cursor-pointer hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Pin className="h-3.5 w-3.5 text-white/40" />
            <span className="text-[11px] text-white/50">Always on top</span>
          </div>
          <div
            className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${
              alwaysOnTop ? 'bg-[var(--accent-coral)]' : 'bg-white/[0.1]'
            }`}
          >
            <div
              className={`absolute top-[3px] h-3 w-3 rounded-full bg-white transition-transform duration-200 ${
                alwaysOnTop ? 'translate-x-[17px]' : 'translate-x-[3px]'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Shortcut */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-4">
          Keyboard Shortcut
        </p>
        <div className="space-y-2">
          <span className="text-[11px] text-white/50">Show / Hide</span>
          <button
            ref={captureRef}
            type="button"
            onClick={() => setCapturing(true)}
            onKeyDown={handleCaptureKeyDown}
            onBlur={() => setCapturing(false)}
            className={`w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-all duration-200 cursor-pointer ${
              capturing
                ? 'border-[var(--accent-coral-border)] bg-[var(--accent-coral-dim)] text-[var(--accent-coral)]'
                : 'border-white/[0.06] bg-white/[0.03] text-white/60 hover:bg-white/[0.06]'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Keyboard className="h-3.5 w-3.5" />
            {capturing ? 'Press a combination...' : formatShortcut(shortcut)}
          </button>
          <p className="text-[10px] text-white/20">
            Click to change the shortcut
          </p>
        </div>
      </div>
    </div>
  )
}
