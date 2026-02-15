# Changelog - Window Blur Slider Feature

## 🎨 Nouvelle fonctionnalité : Slider de blur réglable

### Vue d'ensemble

Ajout d'un slider dans les paramètres permettant aux utilisateurs d'ajuster l'intensité de l'effet de blur (flou) de la fenêtre.

### Changements effectués

#### 1. Frontend (TypeScript/React)

##### `components/settings-menu.tsx`
- ✅ Ajout d'un helper `isTauri()` pour détecter l'environnement Tauri
- ✅ Ajout d'un state `blurRadius` avec valeur par défaut de 8.0
- ✅ Ajout d'un `useEffect` pour sauvegarder le blur radius dans localStorage
- ✅ Ajout d'un appel à `invoke('set_blur_radius')` pour sauvegarder côté backend
- ✅ Ajout du slider dans l'UI (section Appearance)
  - Range : 0 à 24 avec step de 0.5
  - Affichage de la valeur courante
  - Message indiquant qu'un redémarrage est requis
- ✅ Protection de tous les appels Tauri avec `isTauri()`

##### `components/command-bar.tsx`
- ✅ Ajout d'un helper `isTauri()` pour la cohérence
- ✅ Protection de tous les appels aux APIs Tauri (`getCurrentWindow`, `invoke`, `listen`)
- ✅ Fix du bug "Cannot read properties of undefined (reading 'metadata')"

#### 2. Backend (Rust)

##### `src-tauri/src/lib.rs`
- ✅ Ajout de la structure `UserPreferences` avec serde
- ✅ Ajout de fonctions `load_preferences()` et `save_preferences()`
- ✅ Ajout de la fonction `get_prefs_path()` pour obtenir le chemin du fichier
- ✅ Implémentation de la commande `set_blur_radius()`
- ✅ Enregistrement de la commande dans `invoke_handler`

##### `src-tauri/tauri.conf.json`
- ✅ Configuration initiale du blur avec `windowEffects`
- ✅ Ajout de `tabbingIdentifier: "main"` (requis pour macOS)
- ✅ Configuration du blur par défaut (radius: 8.0)

#### 3. Build System

##### `scripts/update-tauri-config.js`
- ✅ Script Node.js pour mettre à jour automatiquement `tauri.conf.json`
- ✅ Lecture des préférences depuis le fichier app data
- ✅ Support multi-plateforme (Windows, macOS, Linux)
- ✅ Logs informatifs pour le debugging

##### `package.json`
- ✅ Modification de `tauri:dev` pour appeler le script de mise à jour
- ✅ Modification de `tauri:build` pour appeler le script de mise à jour

#### 4. Documentation

- ✅ `docs/BLUR_CONFIGURATION.md` - Documentation technique complète
- ✅ `docs/USER_GUIDE_BLUR.md` - Guide utilisateur simple
- ✅ `docs/CHANGELOG_BLUR_SLIDER.md` - Ce fichier

### Flux de fonctionnement

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. L'utilisateur ajuste le slider dans les paramètres          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend : Sauvegarde dans localStorage + invoke Tauri      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend Rust : Sauvegarde dans preferences.json (app data)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. L'utilisateur redémarre l'application                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Script : Lit preferences.json et met à jour tauri.conf.json │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Tauri démarre avec la nouvelle valeur de blur               │
└─────────────────────────────────────────────────────────────────┘
```

### Fichiers modifiés

```
components/
├── command-bar.tsx              ✏️ Modifié (protection Tauri)
└── settings-menu.tsx            ✏️ Modifié (ajout slider)

src-tauri/
├── src/
│   └── lib.rs                   ✏️ Modifié (commande + préférences)
└── tauri.conf.json              ✏️ Modifié (windowEffects)

scripts/
└── update-tauri-config.js       ✨ Nouveau

docs/
├── BLUR_CONFIGURATION.md        ✨ Nouveau
├── USER_GUIDE_BLUR.md           ✨ Nouveau
└── CHANGELOG_BLUR_SLIDER.md     ✨ Nouveau

package.json                     ✏️ Modifié (scripts)
```

### Tests recommandés

#### Test 1 : Ajustement du slider
1. Ouvrir l'application
2. Aller dans les paramètres
3. Ajuster le slider "Window blur"
4. Vérifier que la valeur s'affiche correctement

#### Test 2 : Persistance
1. Ajuster le blur à une valeur spécifique (ex: 16)
2. Fermer l'application complètement
3. Relancer l'application
4. Vérifier que l'effet de blur correspond à la valeur choisie

#### Test 3 : Valeurs limites
- Tester avec blur = 0 (pas de blur)
- Tester avec blur = 24 (blur maximum)
- Tester avec blur = 8 (valeur par défaut)

#### Test 4 : Mode développement
```bash
# Test 1
pnpm tauri:dev
# Ajuster le blur dans l'UI
# Arrêter (Ctrl+C)

# Test 2
pnpm tauri:dev
# Vérifier que le nouveau blur est appliqué
```

### Limitations connues

1. **Redémarrage requis** : Les modifications de blur ne peuvent pas être appliquées en temps réel dans Tauri
2. **Support plateforme** : L'effet de blur dépend des capacités de l'OS et du compositeur
3. **Pas de preview** : Impossible de prévisualiser le blur avant redémarrage

### Améliorations futures possibles

- [ ] Ajouter un bouton "Redémarrer maintenant" après changement de blur
- [ ] Précharger des presets (Subtil, Modéré, Intense)
- [ ] Ajouter une prévisualisation approximative (avec CSS blur)
- [ ] Synchroniser avec le thème système (clair/sombre)
- [ ] Permettre de désactiver complètement le blur

### Compatibilité

- ✅ Windows 10/11 (Acrylic/Mica)
- ✅ macOS (Vibrancy)
- ✅ Linux (avec compositeur moderne)
- ✅ Mode développement Next.js (sans erreurs)

### Notes de migration

Si vous mettez à jour depuis une version antérieure :

1. Les préférences seront créées automatiquement au premier ajustement
2. La valeur par défaut (8.0) sera utilisée si aucune préférence n'existe
3. Aucune migration de données n'est nécessaire

### Contact et support

Pour toute question ou problème :
- Consulter `docs/USER_GUIDE_BLUR.md` pour l'utilisation
- Consulter `docs/BLUR_CONFIGURATION.md` pour les détails techniques
