# Window Blur Effect Configuration

Cette application permet de personnaliser l'effet de blur (flou) de la fenêtre via un slider dans les paramètres.

## Fonctionnalités

### Slider de Blur dans les Paramètres

1. **Emplacement** : Menu Paramètres → Section "Appearance" → "Window blur"
2. **Plage** : 0 à 24 (avec incrément de 0.5)
3. **Valeur par défaut** : 8.0
4. **Effet** : Contrôle l'intensité du flou d'arrière-plan de la fenêtre

### Comment utiliser

1. Ouvrez l'application
2. Accédez aux paramètres (icône d'engrenage)
3. Ajustez le slider "Window blur" à votre convenance
4. **Important** : Redémarrez l'application pour appliquer les changements

### Comportement technique

- Les changements de blur radius sont **sauvegardés automatiquement** dans le fichier de préférences
- Le fichier de préférences est situé dans le répertoire app data de Tauri :
  - **Windows** : `%APPDATA%\com.ohmycommandbar.app\preferences.json`
  - **macOS** : `~/Library/Application Support/com.ohmycommandbar.app/preferences.json`
  - **Linux** : `~/.config/com.ohmycommandbar.app/preferences.json`

- Au démarrage de l'application (dev ou build), le script `scripts/update-tauri-config.js` :
  1. Lit le fichier de préférences
  2. Met à jour `src-tauri/tauri.conf.json` avec le blur radius sauvegardé
  3. Lance l'application avec la configuration mise à jour

### Pour les développeurs

#### Structure des fichiers

```
components/
  └── settings-menu.tsx       # Composant avec le slider de blur

scripts/
  └── update-tauri-config.js  # Script de mise à jour de la config

src-tauri/
  ├── src/
  │   └── lib.rs              # Commande Tauri pour sauvegarder le blur radius
  └── tauri.conf.json         # Configuration Tauri (mise à jour au démarrage)
```

#### Commandes npm

```bash
# Mode développement (avec mise à jour de la config)
pnpm tauri:dev

# Build de production (avec mise à jour de la config)
pnpm tauri:build
```

#### API Tauri

```typescript
// Sauvegarder le blur radius (côté frontend)
await invoke('set_blur_radius', { radius: 12.0 });
```

```rust
// Commande Rust (côté backend)
#[tauri::command]
fn set_blur_radius(app_handle: tauri::AppHandle, radius: f64) -> Result<(), String>
```

### Limitations

- Les modifications de `windowEffects` ne peuvent pas être appliquées dynamiquement dans Tauri
- Un **redémarrage de l'application est requis** pour voir les changements
- Le blur ne fonctionne que sur les plateformes qui le supportent (macOS vibrancy, Windows Acrylic/Mica, compositeurs Linux)

### Compatibilité

- **macOS** : Effet vitreux natif (vibrancy)
- **Windows 10/11** : Acrylic ou Mica selon la version
- **Linux** : Dépend du compositeur de fenêtres (Wayland/X11)

## Dépannage

### Le blur ne change pas après ajustement

**Solution** : Redémarrez complètement l'application

### Le blur ne fonctionne pas du tout

**Vérifications** :
1. Assurez-vous que la fenêtre a `transparent: true` dans `tauri.conf.json`
2. Vérifiez que `tabbingIdentifier` est défini dans la configuration de la fenêtre
3. Sur Linux, vérifiez que votre compositeur supporte les effets de blur

### Préférences non persistantes

**Solution** : Vérifiez que le répertoire app data est accessible en écriture
