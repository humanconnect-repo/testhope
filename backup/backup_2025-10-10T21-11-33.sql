-- Backup Database Bella Napoli
-- Data: 2025-10-10T21:11:33.855Z
-- Generato automaticamente

-- ==============================================
-- 1. FUNZIONI CORRETTE
-- ==============================================

-- ==============================================
-- 3. DATI DI ESEMPIO - PREDICTIONS
-- ==============================================

INSERT INTO predictions (id, title, description, slug, category, closing_date, status, rules, created_at, created_by, updated_at, closing_bid) VALUES ('786bbc03-690a-4ce4-8329-010cdc9381b6', 'Il Napoli vincerà lo scudetto di questa stagione?', 'La stagione calcistica 2025-26 è iniziata e in molti si chiedono se il Napoli riuscirà a conquistare nuovamente lo scudetto. Con una squadra rinnovata e nuovi acquisti, i partenopei puntano al titolo!', 'il-napoli-vincer-lo-scudetto-di-questa-stagione', 'Sport', '2026-05-24T15:59:00+00:00', 'attiva', 'La prediction si chiude alla fine della stagione regolare. Il Napoli deve vincere il campionato di Serie A 2025-26.', '2025-10-10T07:11:46.588609+00:00', NULL, '2025-10-10T15:32:57.487197+00:00', '2026-03-28T16:59:00+00:00');
INSERT INTO predictions (id, title, description, slug, category, closing_date, status, rules, created_at, created_by, updated_at, closing_bid) VALUES ('a43102fd-cb43-434d-a8d7-3bcea62b3012', 'Arresteranno Fabrizio Corona entro fine giugno 2026?', 'Riuscirà la giustizia a mettere le mani su di lui entro la data indicata?', 'arresteranno-fabrizio-corona-entro-6-mesi', 'Degen', '2026-06-30T21:59:00+00:00', 'attiva', 'La prediction si chiude se Corona viene arrestato o se si arriva alla data indicata. L''arresto deve essere formale e confermato dalle autorità.', '2025-10-10T07:11:46.588609+00:00', NULL, '2025-10-10T17:10:51.069423+00:00', '2026-03-01T22:59:00+00:00');
INSERT INTO predictions (id, title, description, slug, category, closing_date, status, rules, created_at, created_by, updated_at, closing_bid) VALUES ('25e33eb8-a996-496f-bb10-dd1e24d5ee93', 'Bitcoin raggiungerà $150,000 entro fine 2025?', 'Con il recente rally di Bitcoin e l''approvazione degli ETF, molti analisti prevedono che BTC possa raggiungere i $150,000 entro la fine del 2025. Cosa ne pensi?', 'bitcoin-raggiungera-100000-entro-fine-2024', 'Crypto', '2025-12-31T20:59:00+00:00', 'attiva', 'La prediction si chiude il 31 dicembre 2025. Bitcoin deve raggiungere i $150,000 su almeno un exchange tra Binance, Coinbase, Bitfinex, Bybit, o Kraken.', '2025-10-10T10:23:02.745505+00:00', NULL, '2025-10-10T17:55:09.724391+00:00', '2025-11-15T20:59:00+00:00');

-- ==============================================
-- 3. DATI DI ESEMPIO - PROFILES
-- ==============================================

INSERT INTO profiles (id, wallet_address, created_at, updated_at, nickname, avatar_url, bio, signature, is_admin) VALUES ('0x7504349365e571f3978BDd5304042B3493C03cc4', '0x7504349365e571f3978BDd5304042B3493C03cc4', '2025-10-09T17:09:25.699+00:00', '2025-10-09T17:09:59.852+00:00', 'Boss di Napoli', NULL, 'Top', '0xfc8df4339a70270bb92c070a590433b0af9fe7cb7a41975d7ec1c63215b98fee67a6ab5a4345bac6cd3c5313a91318a753871f1c0ed774071e5ce000ec6e1caf1b', true);

-- ==============================================
-- 4. PERMESSI
-- ==============================================

GRANT EXECUTE ON FUNCTION get_prediction_percentages(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_bettors(UUID, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_prediction_comments(UUID, INTEGER) TO authenticated, anon;

