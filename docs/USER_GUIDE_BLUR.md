# Guide d'utilisation - Réglage de l'effet Blur

## 🎨 Personnalisation de l'effet de flou de fenêtre

### Accéder aux paramètres

1. **Ouvrir l'application** OhMyCommandBar
2. **Cliquer sur l'icône Paramètres** (⚙️)
3. **Trouver la section "Appearance"**

### Ajuster le blur

Dans la section "Appearance", vous trouverez deux sliders :

#### 1️⃣ Glass opacity
- Contrôle la transparence de la fenêtre
- Plage : 10% à 100%
- Effet immédiat ✨

#### 2️⃣ Window blur
- Contrôle l'intensité du flou d'arrière-plan
- Plage : 0 à 24
- **⚠️ Nécessite un redémarrage de l'application**

### Configuration recommandée

Pour un effet vitreux moderne :
- **Glass opacity** : 82%
- **Window blur** : 8 à 12

Pour un effet subtil :
- **Glass opacity** : 90%
- **Window blur** : 4 à 6

Pour un effet dramatique :
- **Glass opacity** : 70%
- **Window blur** : 16 à 24

### ⚡ Notes importantes

- Les modifications du **blur** sont sauvegardées automatiquement
- Pour appliquer les changements de blur, **fermez et relancez l'application**
- L'effet de blur fonctionne mieux sur :
  - macOS (effet vitreux natif)
  - Windows 10/11 (Acrylic/Mica)
  - Linux avec compositeur moderne (KWin, Mutter)

### 🔄 Comment redémarrer l'application

**Option 1 - Via le système**
- Fermez complètement l'application (Cmd+Q sur macOS, Alt+F4 sur Windows)
- Relancez depuis le Finder/Menu Démarrer

**Option 2 - Mode développement**
```bash
# Arrêtez le serveur (Ctrl+C)
# Relancez
pnpm tauri:dev
```

### 💾 Où sont sauvegardées mes préférences ?

Les préférences sont automatiquement sauvegardées dans :

- **Windows** : `%APPDATA%\com.ohmycommandbar.app\preferences.json`
- **macOS** : `~/Library/Application Support/com.ohmycommandbar.app/preferences.json`
- **Linux** : `~/.config/com.ohmycommandbar.app/preferences.json`

### 🎯 Astuces

1. **Testez différentes valeurs** : Le rendu dépend de votre fond d'écran et de votre thème système
2. **Moins c'est plus** : Un blur subtil (8-12) donne souvent les meilleurs résultats
3. **Cohérence visuelle** : Ajustez l'opacité et le blur ensemble pour un effet harmonieux

### 🐛 Problèmes courants

**Le blur ne change pas**
→ Assurez-vous d'avoir redémarré l'application

**L'effet est trop intense**
→ Réduisez la valeur du slider et redémarrez

**Pas d'effet visible**
→ Vérifiez que votre système supporte les effets de transparence
