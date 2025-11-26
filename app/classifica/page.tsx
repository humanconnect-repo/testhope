"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type LeaderRow = {
  userId: string;
  username: string;
  totalPredictions: number;
  totalBnbStaked: number;
  totalWins: number;
  totalBnbEarned: number;
  points?: number; // placeholder, calcolo verrà definito dopo
};

export default function ClassificaPage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carica i profili con tutti i contatori (ottimizzato: tutto da profiles, nessun calcolo!)
        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('id, username, total_bets, total_bnb_bets, total_wins, total_bnb_earned')
          .gt('total_bets', 0) // Solo utenti con almeno una bet
          .order('total_bets', { ascending: false });
        if (profilesErr) throw profilesErr;

        console.log('🔍 Profili caricati:', profiles?.length);

        // Combina dati da profiles (tutti i contatori già calcolati!)
        const rowsBase: LeaderRow[] = (profiles || []).map((prof: {
          id: string;
          username: string | null;
          total_bets: number | null;
          total_bnb_bets: number | null;
          total_wins: number | null;
          total_bnb_earned: number | null;
        }) => {
          return {
            userId: prof.id,
            username: prof.username || 'Anonimo',
            totalPredictions: prof.total_bets || 0, // Usa total_bets da profiles (ottimizzato!)
            totalBnbStaked: Number(prof.total_bnb_bets) || 0, // Usa total_bnb_bets da profiles (ottimizzato!)
            totalWins: prof.total_wins || 0, // Usa total_wins da profiles (ottimizzato!)
            totalBnbEarned: Number(prof.total_bnb_earned) || 0, // Usa total_bnb_earned da profiles (ottimizzato!)
          };
        });

        console.log('🔍 Righe classifica preparate:', rowsBase.length);

        // Calcola punti e arricchisci i dati
        const enriched = rowsBase.map(r => {
          const displayName = (r.username && String(r.username).trim()) || 'Anonimo';
          // Calcolo punti: 1 per prediction, 2 per prediction vinta, 1 per ogni 0.1 BNB scommessi
          const points = (r.totalPredictions || 0)
            + 2 * (r.totalWins || 0)
            + Math.floor((r.totalBnbStaked || 0) / 0.1);
          return { ...r, username: displayName, points };
        });

        // Ordina per punti (desc), poi BNB guadagnati, poi BNB scommessi
        enriched.sort((a, b) => {
          const ap = a.points ?? 0;
          const bp = b.points ?? 0;
          if (bp !== ap) return bp - ap;
          if (b.totalBnbEarned !== a.totalBnbEarned) return b.totalBnbEarned - a.totalBnbEarned;
          return b.totalBnbStaked - a.totalBnbStaked;
        });

        setRows(enriched);
      } catch (e: any) {
        console.error('Errore caricamento classifica:', e);
        setError('Errore nel caricamento della classifica');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        {/* Pulsante HOME */}
        <div className="flex justify-start mt-2 mb-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            HOME
          </Link>
        </div>
        <div className="flex justify-center mb-6">
          <img
            src="/media/image/classificabn.png"
            alt="Classifica Bella Napoli"
            className="h-32 w-auto"
          />
        </div>

        {loading ? (
          <div className="text-gray-600 dark:text-gray-400">Caricamento classifica...</div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">Nessun dato disponibile</div>
        ) : (
          <>
            {/* Tooltip per mobile */}
            <div className="sm:hidden mb-3 flex justify-center">
              <div className="inline-block text-xs text-gray-600 dark:text-gray-400 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                Su desktop vedi più dettagli...
              </div>
            </div>
            <div>
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Predictions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">BNB Scommessi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Vinte</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">BNB Guadagnati</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Punti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rows.map((r, idx) => (
                  <tr
                    key={r.userId}
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-gray-50 dark:bg-gray-800'} transition-transform duration-150 hover:scale-[1.01] hover:bg-primary/5 dark:hover:bg-primary/10`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.username || 'Anonimo'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{r.totalPredictions}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{r.totalBnbStaked.toFixed(4)} BNB</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{r.totalWins}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">{r.totalBnbEarned.toFixed(4)} BNB</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.points ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </main>
    </div>
  );
}


