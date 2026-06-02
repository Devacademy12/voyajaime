# 📐 Design System Guide - VoyajAime

## Vue d'ensemble

Ce guide documente le système de design unifié de VoyajAime. Tous les composants, couleurs, typographie et animations doivent suivre ces standards pour garantir une cohérence visuelle et une meilleure expérience utilisateur.

---

## 🎨 Palette de Couleurs

### Primaire

- **Bleu Tunisie (Dark)**: `#053366` - Brand principal, titres, texte primaire
- **Cyan (Main)**: `#02AFCF` - Accents, boutons, liens
- **Cyan (Light)**: `#0099B5` - Interactions au survol
- **Cyan (BG très clair)**: `#EFF9FB` - Backgrounds informatifs

### Status Colors

#### ✅ Success

```
Color: #10B981 (Vert)
Background: #ECFDF5
Border: #6EE7B7
```

#### ❌ Error

```
Color: #DC2626 (Rouge)
Background: #FEF2F2
Border: #FECACA
```

#### ⚠️ Warning

```
Color: #D97706 (Orange)
Background: #FFFBEB
Border: #FDE68A
```

#### ℹ️ Info

```
Color: #02AFCF (Cyan)
Background: #EFF9FB
Border: #A5F3FC
```

---

## 🔤 Typographie

### Police

- **Primaire**: `Plus Jakarta Sans` (400-800 weights)
- **Mono**: `JetBrains Mono` (pour le code)

### Tailles & Poids

| Utilisation           | Taille | Poids |
| --------------------- | ------ | ----- |
| Titre Principal (H1)  | 32px   | 800   |
| Titre Secondaire (H2) | 24px   | 800   |
| Titre Tertiaire (H3)  | 20px   | 700   |
| Texte Standard        | 14px   | 400   |
| Label / Small         | 13px   | 500   |
| Caption / XS          | 12px   | 500   |

### Espacement des lignes

- **Tight**: 1.15 (titres)
- **Snug**: 1.2 (sous-titres)
- **Normal**: 1.5 (texte standard)
- **Relaxed**: 1.6 (paragraphes)

---

## 🎯 Composants

### 1️⃣ Alert (Alerte)

Composant réutilisable pour afficher des messages de type success, error, warning, info.

#### Utilisation

```tsx
import { Alert } from "@/app/components/ui";

<Alert
  variant="success"
  title="Succès!"
  message="Votre profil a été mis à jour"
  onClose={() => console.log("closed")}
  closeable={true}
/>;
```

#### Variantes

- `success` - Message de réussite
- `error` - Message d'erreur
- `warning` - Message d'avertissement
- `info` - Message informatif

#### Props

```tsx
interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  title?: string; // Optionnel
  message: string | React.ReactNode;
  icon?: React.ReactNode; // Icône personnalisée
  onClose?: () => void;
  closeable?: boolean; // Défaut: true
  className?: string;
  style?: React.CSSProperties;
  actions?: React.ReactNode; // Boutons d'action
}
```

### 2️⃣ Toast (Notification)

Notification système qui disparaît automatiquement.

#### Utilisation

```tsx
import { useToast } from "@/lib/useToast";

function MyComponent() {
  const { toast, showSuccess, showError } = useToast();

  return (
    <>
      <button onClick={() => showSuccess("Opération réussie!")}>
        Show Toast
      </button>
      <Toast toast={toast} onClose={() => {}} />
    </>
  );
}
```

#### Méthodes disponibles

```tsx
showSuccess(msg: string, duration?: number)
showError(msg: string, duration?: number)
showWarning(msg: string, duration?: number)
showInfo(msg: string, duration?: number)
showToast(msg: string, type: MessageType, duration?: number)
```

#### Durées par défaut

- Success: 3000ms
- Error: 5000ms
- Warning: 4000ms
- Info: 3000ms

### 3️⃣ ConfirmModal (Dialogue de Confirmation)

Modal standardisée pour les confirmations.

#### Utilisation

```tsx
import { ConfirmModal } from "@/app/components/ui";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete</button>
      <ConfirmModal
        isOpen={isOpen}
        type="danger"
        title="Supprimer?"
        message="Cette action est irréversible"
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        onConfirm={async () => {
          await deleteItem();
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
```

#### Types

- `warning` - Confirmation générale
- `danger` - Action destructive
- `info` - Notification
- `success` - Confirmation réussie

#### Props

```tsx
interface ConfirmModalProps {
  isOpen: boolean;
  type?: "warning" | "danger" | "info" | "success";
  title: string;
  message: string | React.ReactNode;
  confirmText?: string; // Défaut: "Confirmer"
  cancelText?: string; // Défaut: "Annuler"
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  confirmVariant?: "danger" | "primary";
}
```

### 4️⃣ Button (Bouton)

Composant Button existant, maintenant harmonisé avec le design system.

#### Utilisation

```tsx
import { Button } from "@/app/components/ui";

<Button variant="primary" size="md" loading={false}>
  Envoyer
</Button>;
```

#### Variantes

- `primary` - Action principale (gradient bleu)
- `secondary` - Action secondaire (blanc avec bordure)
- `danger` - Action destructive (rouge clair)
- `success` - Action positive (gradient vert)
- `ghost` - Pas de background

#### Tailles

- `sm` - Petit (7px 14px)
- `md` - Normal (11px 20px) **[défaut]**
- `lg` - Grand (14px 28px)

---

## 🎬 Animations

Toutes les animations utilisent des durées cohérentes:

### Durées standard

- Rapide: 0.2s
- Normal: 0.3s
- Lent: 0.4s

### Types d'animations disponibles

```css
/* Modal & Overlay */
@keyframes fadeIn {
  /* opacity 0→1 */
}
@keyframes slideUp {
  /* translateY 20px→0 */
}
@keyframes slideDown {
  /* translateY -20px→0 */
}

/* Toast */
@keyframes slideInUp {
  /* Toast entrée */
}
@keyframes slideOutDown {
  /* Toast sortie */
}

/* Génériques */
@keyframes scaleIn {
  /* scale 0.95→1 */
}
@keyframes pulse {
  /* opacity 1→0.5→1 */
}
@keyframes spin {
  /* rotate 360° */
}
```

---

## 📱 Responsive Design

### Breakpoints

```typescript
xs: "320px"; // Mobile extra-small
sm: "640px"; // Mobile standard
md: "900px"; // Tablette
lg: "1200px"; // Desktop
xl: "1600px"; // Desktop large
```

### Règles

1. **Mobile First**: Développer pour mobile d'abord
2. **Max-width**: 1600px pour les conteneurs
3. **Padding**:
   - Mobile: 16px
   - Tablet: 24px
   - Desktop: 40px

---

## 🔧 Utilisation dans les Pages

### ✅ BON EXEMPLE

```tsx
"use client";

import { Alert, ConfirmModal, Button } from "@/app/components/ui";
import { useToast } from "@/lib/useToast";

export default function MyPage() {
  const { toast, showSuccess, showError } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteItem();
      showSuccess("Supprimé avec succès!");
      setIsConfirming(false);
    } catch (error) {
      showError("Erreur lors de la suppression");
    }
  };

  return (
    <>
      <h1>Ma Page</h1>

      {/* Alert pour info statique */}
      <Alert variant="info" message="Pensez à vérifier votre profil" />

      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        Supprimer
      </Button>

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={isConfirming}
        type="danger"
        title="Confirmer la suppression?"
        message="Cette action est irréversible"
        onConfirm={handleDelete}
        onCancel={() => setIsConfirming(false)}
        confirmVariant="danger"
      />

      {/* Toast notification */}
      <Toast toast={toast} onClose={() => {}} />
    </>
  );
}
```

### ❌ À ÉVITER

```tsx
// ❌ Créer des alertes custom sans utiliser le composant Alert
<div style={{ background: '#fee2e2', /* ... */ }}>
  Erreur personnalisée
</div>

// ❌ Styles en dur au lieu d'utiliser le design system
<button style={{ background: '#053366', padding: '10px' }}>
  Click me
</button>

// ❌ Utiliser console.log au lieu de showError pour les erreurs utilisateur
console.log('Erreur!');
```

---

## 🎯 Checklist de Cohérence

Avant de créer/modifier un composant, vérifiez:

- [ ] Utilise les couleurs du design system (COLORS)
- [ ] Utilise la typographie Plus Jakarta Sans avec poids/tailles standards
- [ ] Les animations durent 0.2s/0.3s/0.4s
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Messages d'erreur/succès utilisent Alert ou Toast
- [ ] Les boutons utilisent le composant Button
- [ ] Les confirmations utilisent ConfirmModal
- [ ] Les bordures utilisent #E2E8F0 ou design-system
- [ ] Les ombres utilisent CSS var ou COLORS.shadow
- [ ] Accessible (ARIA labels, focus states)

---

## 📦 Fichiers Clés

```
app/components/ui/
├── design-system.ts          # 🎨 Variables & constantes
├── design-system.css         # 🎬 Animations & classes
├── Alert.tsx                 # ⚠️ Composant Alert
├── Toast.tsx                 # 🔔 Composant Toast
├── ConfirmModal.tsx          # ❓ Composant ConfirmModal
├── button.tsx                # 🔘 Composant Button (existant)
└── index.ts                  # 📤 Exports
```

---

## 🚀 Prochaines Étapes

1. Mettre à jour tous les composants existants
2. Remplacer les messages d'erreur/succès custom
3. Appliquer les styles à toutes les pages
4. Tester la cohérence sur tous les breakpoints
5. Documenter les patterns de chaque page
