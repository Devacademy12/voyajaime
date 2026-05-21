-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Ajouter colonnes de remboursement et annulation
-- ═══════════════════════════════════════════════════════════════════
-- Cette migration ajoute le support pour l'annulation de réservations
-- avec remboursement conditionnel (100% si >= 24h, 50% sinon)

-- 1. TABLE "reservations" - Ajouter colonnes d'annulation
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 2. TABLE "paiements" - Ajouter colonnes de remboursement
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS refund_amount NUMERIC;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS refund_percentage INTEGER;
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- ═══════════════════════════════════════════════════════════════════
-- COMMENTAIRES EXPLICATIFS
-- ═══════════════════════════════════════════════════════════════════

-- Pour la table "reservations":
-- - cancelled_at: Timestamp d'annulation (NULL si non annulée)
-- - cancel_reason: Raison de l'annulation (ex: "Annulation > 24h", "Annulation < 24h", etc)

-- Pour la table "paiements":
-- - refund_amount: Montant remboursé (en EUR)
-- - refund_percentage: Pourcentage de remboursement (0, 50, ou 100)
-- - stripe_refund_id: ID de remboursement Stripe pour traçabilité

-- ═══════════════════════════════════════════════════════════════════
-- INDICES (optionnel mais recommandé pour performance)
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_reservations_cancelled_at ON reservations(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_paiements_refund_status ON paiements(status) WHERE status = 'refunded';
CREATE INDEX IF NOT EXISTS idx_paiements_stripe_refund ON paiements(stripe_refund_id);

-- ═══════════════════════════════════════════════════════════════════
-- Exécution
-- ═══════════════════════════════════════════════════════════════════
-- 1. Accédez à Supabase SQL Editor
-- 2. Copiez-collez ce fichier
-- 3. Exécutez la migration
-- 4. Vérifiez que les colonnes ont été ajoutées avec:
--    SELECT column_name, data_type FROM information_schema.columns 
--    WHERE table_name = 'reservations';
--
--    SELECT column_name, data_type FROM information_schema.columns 
--    WHERE table_name = 'paiements';
