# ⚠️ PRÉ-DÉPLOIEMENT - Points d'Attention

## 🔍 Avant de Déployer en Production

### 1. Migration Base de Données (OBLIGATOIRE)

```sql
-- Exécuter dans Supabase SQL Editor:
migrations/add_cancellation_refund_columns.sql
```

**Vérification post-migration**:

```sql
-- Vérifier colonnes reservations
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reservations'
AND column_name IN ('cancelled_at', 'cancel_reason');

-- Vérifier colonnes paiements
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'paiements'
AND column_name IN ('refund_amount', 'refund_percentage', 'stripe_refund_id');
```

✅ Les 5 colonnes doivent s'afficher

---

### 2. Variables d'Environnement

Vérifier que ces variables existent et sont valides:

```
STRIPE_SECRET_KEY          ✅ Clé secrète Stripe (commençant par sk_)
STRIPE_WEBHOOK_SECRET      ✅ Déjà configuré
SUPABASE_URL               ✅ Déjà configuré
SUPABASE_ANON_KEY          ✅ Déjà configuré
```

---

### 3. Test en Staging

#### Test 1: Remboursement 100% (≥ 24h)

1. Créer excursion: 3 jours à partir d'aujourd'hui
2. Réserver + Payer (Stripe test)
3. Vérifier status = "confirmed"
4. Annuler via modal
5. ✅ Vérifier: refund_percentage = 100

#### Test 2: Remboursement 50% (< 24h)

1. Créer excursion: 12 heures à partir de maintenant
2. Réserver + Payer
3. Annuler
4. ✅ Vérifier: refund_percentage = 50

#### Test 3: Sécurité

1. Utilisateur A réserve
2. Utilisateur B essaie d'annuler (appel API direct)
3. ✅ Erreur 403 "Non autorisé"

---

### 4. Stripe Dashboard Checks

**Avant le déploiement**:

1. Accéder au dashboard Stripe
2. Vérifier les charges existantes
3. Pendant test: observer les remboursements créés
4. ✅ Les remboursements doivent apparaître en 1-2 minutes

**Configuration Stripe requise**:

- ✅ Mode Live ou Test (selon env)
- ✅ Webhook configuré pour remboursements (optionnel)
- ✅ Notification email activée (optionnel)

---

### 5. Logs & Monitoring

**Activer les logs**:

```typescript
// Dans le code déploié, vérifier que les logs incluent:
✅ Remboursement Stripe créé: [refund.id]
❌ Erreur remboursement Stripe: [error]
⚠️ Erreur restauration places: [error]
```

**Monitoring recommandé**:

- Nombre d'annulations/jour
- Taux de succès Stripe
- Erreurs authentification
- Performance API

---

### 6. Rollback Plan

Si problème détecté:

1. Désactiver le bouton "Annuler" en frontend (feature flag)
2. Investiguer l'erreur dans les logs
3. Rollback code si nécessaire
4. **NE PAS annuler manuellement** les réservations

---

### 7. Validation Checklist

Avant cliquer "Deploy to Production":

```
BASE DE DONNÉES:
☐ Migration appliquée
☐ 5 colonnes créées et vérifiées
☐ Indices créés
☐ Pas d'erreur SQL

CODE:
☐ API endpoint: /api/reservations/cancel (créé)
☐ Modal: CancellationModal.tsx (créé)
☐ ReservationCard modifié (bouton + modal)
☐ Aucune erreur TypeScript

TESTS:
☐ Test remboursement 100% (≥ 24h)
☐ Test remboursement 50% (< 24h)
☐ Test sécurité (propriété vérifiée)
☐ Test Stripe (remboursement créé)
☐ UI responsive testé

CONFIGURATION:
☐ STRIPE_SECRET_KEY valide
☐ Supabase connecté
☐ RPC restore_slots_on_cancel existe

DOCUMENTATION:
☐ CANCELLATION_REFUND_GUIDE.md lu
☐ TEST_GUIDE_CANCELLATION.ts compris
☐ IMPLEMENTATION_SUMMARY.md passé en revue
```

---

### 8. Cas d'Erreur Connus

**Problème: Modal ne s'ouvre pas**

- Vérifier: CancellationModal importé dans ReservationCard
- Vérifier: showCancellationModal state déclaré
- Solution: Nettoyer cache navigateur

**Problème: Remboursement Stripe échoue**

- Cause possible: Clé Stripe invalide
- Cause possible: Charge Stripe non trouvée
- Solution: Vérifier logs Stripe dashboard
- NOTE: L'annulation continue même si Stripe échoue

**Problème: Places ne sont pas restaurées**

- Cause possible: RPC restore_slots_on_cancel indisponible
- Solution: Vérifier que le RPC existe en Supabase
- Impact: Low (remboursement fonctionne quand même)

**Problème: Authentification échoue**

- Cause: Utilisateur pas connecté
- Cause: Session expirée
- Solution: Rediriger vers login

---

### 9. Communication Utilisateurs

**À notifier APRÈS déploiement en production**:

1. Newsletter: "Vous pouvez maintenant annuler vos réservations"
2. In-app notification: "Nouvelle fonctionnalité disponible"
3. FAQ: "Comment annuler ma réservation?"

**Clarifier**:

- Remboursement 100% si ≥ 24h ✅
- Remboursement 50% si < 24h ✅
- Délai de traitement: 5-7 jours (Stripe) ✅
- Annulation irréversible ✅

---

### 10. Post-Déploiement (24-48h)

**Surveillance active**:

- ✅ Pas d'erreurs dans les logs
- ✅ Remboursements Stripe créés
- ✅ Base de données mise à jour correctement
- ✅ Performance API < 2s

**Feedback utilisateurs**:

- ✅ Vérifier les retours
- ✅ Ajuster les messages si nécessaire

---

## 🚨 BLOCKERS À VÉRIFIER

- [ ] **Migration SQL**: Doit être appliquée AVANT déploiement code
- [ ] **Stripe Key**: Doit être valide et accessible
- [ ] **RPC restore_slots**: Doit exister en Supabase
- [ ] **Tests**: Doit passer tous les tests en staging

---

## 📋 Fichiers de Référence

- `CANCELLATION_REFUND_GUIDE.md` - Documentation technique complète
- `TEST_GUIDE_CANCELLATION.ts` - Tous les scénarios de test
- `IMPLEMENTATION_SUMMARY.md` - Résumé des changements
- `migrations/add_cancellation_refund_columns.sql` - Migration SQL

---

## ✅ Si Tout Est Vert

Vous êtes prêt pour:

1. Merge PR en main
2. Déploiement en production
3. Monitoring post-déploiement

---

## 🆘 En Cas de Problème

1. Consulter `TEST_GUIDE_CANCELLATION.ts` (section Debugging)
2. Vérifier les logs Supabase
3. Vérifier les logs Stripe
4. Consulter `CANCELLATION_REFUND_GUIDE.md` (section Troubleshooting)

---

**Dernière mise à jour**: 2026-05-21
**Prêt pour déploiement**: ✅ OUI (après migration SQL)
