/**
 * IMPLEMENTATION EXAMPLES - Design System
 * Exemples concrets d'utilisation du système de design harmonisé
 */

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 1: Component avec Alert et Toast
// ═══════════════════════════════════════════════════════════════

import { Alert, Toast } from '@/app/components/ui';
import { useToast } from '@/lib/useToast';
import { useState } from 'react';

export function ExampleAlertToast() {
  const { toast, showSuccess, showError, closeToast } = useToast();
  const [showAlert, setShowAlert] = useState(true);

  const handleAction = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showSuccess('Opération réussie! ✓');
    } catch (error) {
      showError('Une erreur est survenue ✕');
    }
  };

  return (
    <div>
      {/* Alert statique */}
      {showAlert && (
        <Alert
          variant="info"
          title="Information"
          message="Vous pouvez améliorer votre profil en ajoutant une photo"
          onClose={() => setShowAlert(false)}
          closeable={true}
        />
      )}

      {/* Boutons d'action */}
      <button onClick={handleAction}>Déclencher succès</button>
      <button onClick={() => showError('Oups! Une erreur s\'est produite')}>
        Déclencher erreur
      </button>

      {/* Toast notification */}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 2: ConfirmModal pour suppression
// ═══════════════════════════════════════════════════════════════

import { ConfirmModal, Button } from '@/app/components/ui';

export function ExampleConfirmDelete() {
  const { showSuccess, showError } = useToast();
  const { toast, closeToast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    try {
      // API call to delete
      await deleteItem();
      showSuccess('Élément supprimé avec succès');
      setIsConfirming(false);
    } catch (error) {
      showError('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="danger"
        onClick={() => setIsConfirming(true)}
      >
        Supprimer
      </Button>

      <ConfirmModal
        isOpen={isConfirming}
        type="danger"
        title="Supprimer cet élément?"
        message="Cette action est irréversible et ne peut pas être annulée."
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        confirmVariant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteItem}
        onCancel={() => setIsConfirming(false)}
      />

      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 3: Formulaire avec validation et messages
// ═══════════════════════════════════════════════════════════════

import { Alert, Button } from '@/app/components/ui';

export function ExampleFormWithValidation() {
  const { showSuccess, showError } = useToast();
  const { toast, closeToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      // API call
      await submitForm(formData);
      showSuccess('Formulaire envoyé avec succès!');
      setFormData({ email: '', password: '' });
    } catch (error) {
      showError('Erreur lors de l\'envoi du formulaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Erreur validation */}
      {Object.keys(errors).length > 0 && (
        <Alert
          variant="error"
          title="Erreurs de validation"
          message={Object.values(errors).join(', ')}
        />
      )}

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-harmonized"
        />
      </div>

      <div>
        <label>Mot de passe</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="input-harmonized"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={isSubmitting}
      >
        Envoyer
      </Button>

      <Toast toast={toast} onClose={closeToast} />
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 4: Utilisation des Alerts en cascade (multi-étapes)
// ═══════════════════════════════════════════════════════════════

export function ExampleMultiStepAlerts() {
  const { toast, closeToast } = useToast();
  const [step, setStep] = useState<'pending' | 'processing' | 'complete' | 'error'>('pending');

  const handleLongOperation = async () => {
    try {
      setStep('processing');
      // Long operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      setStep('complete');
    } catch (error) {
      setStep('error');
    }
  };

  return (
    <div>
      {/* Alerte du statut courant */}
      {step === 'pending' && (
        <Alert
          variant="info"
          title="Prêt"
          message="Cliquez sur le bouton pour démarrer"
        />
      )}

      {step === 'processing' && (
        <Alert
          variant="warning"
          title="Traitement en cours..."
          message="Veuillez patienter"
        />
      )}

      {step === 'complete' && (
        <Alert
          variant="success"
          title="Succès!"
          message="Opération terminée avec succès"
        />
      )}

      {step === 'error' && (
        <Alert
          variant="error"
          title="Erreur"
          message="Une erreur s'est produite"
        />
      )}

      <Button onClick={handleLongOperation} disabled={step !== 'pending'}>
        {step === 'processing' ? 'Traitement...' : 'Démarrer'}
      </Button>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 5: Migration des messages d'erreur existants
// ═══════════════════════════════════════════════════════════════

// ❌ ANCIEN CODE
/*
function OldErrorHandling() {
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      // ...
    } catch (e) {
      setError('Une erreur s\'est produite');
      // Affichage custom dans le JSX:
      // <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px' }}>
      //   {error}
      // </div>
    }
  };
}
*/

// ✅ NOUVEAU CODE avec Design System
function NewErrorHandling() {
  const { showError, showSuccess } = useToast();
  const { toast, closeToast } = useToast();

  const handleAction = async () => {
    try {
      // API call
      await doSomething();
      showSuccess('Succès!');
    } catch (error) {
      showError('Une erreur s\'est produite');
    }
  };

  return (
    <>
      <button onClick={handleAction}>Essayer</button>
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 6: Utilisation des couleurs du design system en direct
// ═══════════════════════════════════════════════════════════════

import { COLORS, COMPONENT_STYLES } from '@/app/components/ui';

export function ExampleDirectColorUsage() {
  return (
    <div>
      {/* Utiliser les variables du design system */}
      <h1 style={{ color: COLORS.primary.dark }}>Titre Principal</h1>
      
      <p style={{ color: COLORS.neutral.text.secondary }}>
        Texte secondaire
      </p>

      {/* Utiliser les styles des composants */}
      <div style={{
        ...COMPONENT_STYLES.card.base,
        ...COMPONENT_STYLES.card.hover,
      }}>
        Carte avec styles standardisés
      </div>

      {/* Bouton avec styles directes */}
      <button
        style={{
          ...COMPONENT_STYLES.button.base,
          ...COMPONENT_STYLES.button.primary,
          ...COMPONENT_STYLES.button.sizes.md,
        }}
      >
        Bouton Harmonisé
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PATTERNS À APPLIQUER PARTOUT
// ═══════════════════════════════════════════════════════════════

/**
 * PATTERN: Messages d'erreur dans les modales
 * 
 * Au lieu d'avoir des styles d'alerte différents dans chaque modale,
 * utiliser le composant Alert harmonisé:
 */

function ModalWithError() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {/* PARTOUT dans les modales */}
      {error && (
        <Alert
          variant="error"
          message={error}
          onClose={() => setError(null)}
          closeable={true}
        />
      )}
      {/* ... reste de la modale ... */}
    </div>
  );
}

/**
 * PATTERN: Notifications de succès après action
 * 
 * Au lieu de créer des modales success custom,
 * utiliser le Toast pour les notifications:
 */

function ActionWithNotification() {
  const { showSuccess } = useToast();
  const { toast, closeToast } = useToast();

  return (
    <>
      <button onClick={() => showSuccess('Profil sauvegardé!')}>
        Sauvegarder
      </button>
      <Toast toast={toast} onClose={closeToast} />
    </>
  );
}

/**
 * PATTERN: Confirmations d'actions destructives
 * 
 * Toujours utiliser ConfirmModal pour les suppressions/changements majeurs:
 */

function DestructiveAction() {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <>
      <button onClick={() => setIsConfirming(true)}>
        Supprimer mon compte
      </button>
      
      <ConfirmModal
        isOpen={isConfirming}
        type="danger"
        title="Êtes-vous certain?"
        message="Cette action est irréversible"
        confirmVariant="danger"
        onConfirm={() => {
          // Action
          setIsConfirming(false);
        }}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUICK REFERENCE: Imports à utiliser
// ═══════════════════════════════════════════════════════════════

/*
// Composants UI
import { Alert, Toast, ConfirmModal, Button } from '@/app/components/ui';

// Styles & couleurs
import { COLORS, COMPONENT_STYLES, TYPOGRAPHY } from '@/app/components/ui';

// Hooks
import { useToast } from '@/lib/useToast';

// Types
import type { MessageType, AlertVariant, ConfirmModalType } from '@/app/components/ui';
*/
