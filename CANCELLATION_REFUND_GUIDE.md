# Annulation de Réservation avec Remboursement Conditionnel

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux touristes d'annuler leurs réservations confirmées (payées) avec un remboursement conditionnel basé sur le délai avant la date de l'excursion.

### Règles de remboursement

- **≥ 24h avant l'excursion** : Remboursement **100%** (gratuit)
- **< 24h avant l'excursion** : Remboursement **50%** uniquement
- **Excursion déjà commencée** : Pas de remboursement (0%)

---

## 🏗️ Architecture

### 1. Endpoint API

**Route** : `POST /api/reservations/cancel`

**Body**:

```json
{
  "reservation_id": "uuid",
  "reason": "Raison optionnelle"
}
```

**Response** (succès):

```json
{
  "success": true,
  "message": "Réservation annulée. Remboursement: 100% (120.00 EUR)",
  "data": {
    "reservation_id": "uuid",
    "status": "cancelled",
    "refund_percentage": 100,
    "refund_amount": 120.0,
    "stripe_refund_id": "re_1234567890",
    "reason": "Annulation > 24h avant l'excursion"
  }
}
```

### 2. Logique de calcul du remboursement

```typescript
const excursionDateTime = new Date(
  `${reservation.date}T${reservation.time}:00`,
);
const hoursDifference =
  (excursionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

if (hoursDifference >= 24) {
  refundPercentage = 100;
  refundAmount = reservation.total_price;
} else if (hoursDifference > 0) {
  refundPercentage = 50;
  refundAmount = reservation.total_price * 0.5;
} else {
  refundPercentage = 0;
  refundAmount = 0;
}
```

### 3. Intégration Stripe

- Récupère la charge Stripe via `payment_intent`
- Crée un remboursement partiel ou complet
- Stocke l'ID de remboursement pour traçabilité
- Met à jour le statut du paiement à `refunded`

### 4. Restauration des places

- Appelle `restore_slots_on_cancel()` RPC pour libérer les places réservées
- Permet à d'autres touristes de réserver ces places

---

## 🗄️ Changements Base de Données

### Table `reservations`

Nouvelles colonnes:

- `cancelled_at` (TIMESTAMP) : Quand la réservation a été annulée
- `cancel_reason` (TEXT) : Raison de l'annulation

### Table `paiements`

Nouvelles colonnes:

- `refund_amount` (NUMERIC) : Montant remboursé en EUR
- `refund_percentage` (INTEGER) : Pourcentage (0, 50, 100)
- `stripe_refund_id` (TEXT) : ID du remboursement Stripe

**Migration SQL** : Voir `migrations/add_cancellation_refund_columns.sql`

---

## 🎨 Composants Frontend

### 1. CancellationModal (`app/components/reservation/CancellationModal.tsx`)

Modal en 4 étapes:

1. **Confirmation initiale** - Affiche les détails de la réservation
2. **Calcul du remboursement** - Affiche le % et le montant exact
3. **Confirmation finale** - Demande la confirmation définitive
4. **Résultat** - Succès ou erreur

**Caractéristiques**:

- Calcul du remboursement côté client (optimiste)
- Affichage du nombre d'heures restantes
- Code couleur (vert=100%, orange=50%, rouge=0%)
- Messages clairs et traduction française

### 2. ReservationCard (modifié)

- Ajout d'un bouton "Annuler" rouge pour les réservations payées
- Visible uniquement si `status !== "cancelled"`
- Ouverture du modal au clic

---

## 📱 Flux Utilisateur Complet

```
1. Touriste affiche ses réservations
2. Clique sur le bouton "Annuler" (rouge)
   ↓
3. Modal de confirmation s'ouvre
   - Affiche les détails de la réservation
   - Bouton "Calculer le remboursement"
   ↓
4. Touriste clique sur "Calculer le remboursement"
   - Modal calcule le % et le montant
   - Affiche un message explicite
   ↓
5. Touriste confirme l'annulation
   - Appel API POST /api/reservations/cancel
   - Backend calcule le remboursement (validation)
   - Stripe crée le remboursement
   - Base de données mise à jour
   ↓
6. Modal affiche le succès
   - Message: "Votre réservation a été annulée"
   - Info: "Remboursement dans 5-7 jours"
   - Auto-fermeture après 2s
   ↓
7. Page se rafraîchit automatiquement
   - Réservation passe à "cancelled"
   - Disparaît des réservations actives
```

---

## 🔒 Sécurité

### Validations côté serveur

- ✅ Vérification de l'authentification
- ✅ Vérification de propriété (réservation appartient à l'utilisateur)
- ✅ Vérification du statut (doit être "confirmed" ou "completed")
- ✅ Calcul du remboursement côté serveur (jamais du client)
- ✅ Validation Stripe intégrée

### Gestion des erreurs

- Erreur Stripe n'interrompt pas l'annulation locale
- Traçabilité complète via IDs
- Logs serveur pour debug

---

## 🧪 Cas de Test

### Test 1: Remboursement 100% (≥ 24h)

- Créer une réservation pour demain + 24h
- Annuler aujourd'hui
- ✅ Vérifier: remboursement = 100%, montant = total_price

### Test 2: Remboursement 50% (< 24h)

- Créer une réservation pour dans 12h
- Annuler maintenant
- ✅ Vérifier: remboursement = 50%, montant = total_price \* 0.5

### Test 3: Pas de remboursement (excursion passée)

- Créer une réservation pour hier
- Annuler aujourd'hui
- ✅ Vérifier: remboursement = 0%, montant = 0

### Test 4: Restauration des places

- Réserver 2 places sur une excursion
- Annuler la réservation
- ✅ Vérifier: places libérées et disponibles pour autres

### Test 5: Intégration Stripe

- Annuler une réservation payée
- ✅ Vérifier: remboursement Stripe créé dans le dashboard
- ✅ Vérifier: `stripe_refund_id` stocké en base

---

## 📊 Monitoring & Logging

### Logs importants

```typescript
✅ Remboursement Stripe créé: [refund.id]
❌ Erreur remboursement Stripe: [error]
⚠️ Erreur restauration places: [error]
```

### Métriques à suivre

- Nombre d'annulations par jour
- Répartition par % de remboursement (100% vs 50%)
- Montant total remboursé
- Taux d'erreur Stripe

---

## 🚀 Déploiement

### Checklist

- [ ] Appliquer la migration SQL à la base de données
- [ ] Déployer l'endpoint API `/api/reservations/cancel`
- [ ] Déployer les composants frontend
- [ ] Tester en staging
- [ ] Vérifier les logs Stripe
- [ ] Notifier les utilisateurs (nouveau feature)

### Variables d'environnement requises

```
STRIPE_SECRET_KEY   (déjà existant)
```

---

## 🔄 Points d'intégration existants

- **Supabase** : Lecture/mise à jour des réservations et paiements
- **Stripe** : Remboursements partiels/complets
- **RPC** : `restore_slots_on_cancel` pour libérer les places
- **Auth** : Vérification de l'utilisateur connecté

---

## 📝 Notes de développement

### Limites connues

1. Le remboursement Stripe prend 5-7 jours (politique Stripe)
2. Une fois annulée, une réservation ne peut pas être récupérée
3. Les annulations partielles (50%) sont irrévocables

### Améliorations futures

- [ ] Ajouter un motif d'annulation structuré (dropdown)
- [ ] Notifications email lors de l'annulation
- [ ] Historique des remboursements pour les touristes
- [ ] Dashboard pour les prestataires (voir les annulations)
- [ ] API pour les prestataires (accepter/refuser les annulations?)

---

## 🆘 Troubleshooting

### Erreur: "Réservation introuvable"

- Vérifier que l'ID est correct
- Vérifier que l'utilisateur est connecté
- Vérifier que c'est bien le propriétaire

### Erreur: "Erreur remboursement Stripe"

- Vérifier la clé Stripe en env
- Vérifier que la charge Stripe existe
- Vérifier les logs Stripe dashboard

### Modal ne s'ouvre pas

- Vérifier que le bouton "Annuler" est visible
- Vérifier que la réservation est `status = "confirmed"`
- Vérifier les erreurs console

---

## 📞 Support

Pour toute question, contactez l'équipe développement.
