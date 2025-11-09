"use client";
import AdminPanel from '../../components/AdminPanel';
import AdminLoadingModal from '../../components/AdminLoadingModal';
import { useAdmin } from '../../hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const { isAdmin, loading, error } = useAdmin();
  const router = useRouter();
  const [isPanelReady, setIsPanelReady] = useState(false);

  useEffect(() => {
    // Aggiungi un delay per evitare reindirizzamenti prematuri durante il refresh
    const timeoutId = setTimeout(() => {
      // Se non è in loading e non è admin, reindirizza alla home
      if (!loading && !isAdmin) {
        console.log('❌ Accesso negato: utente non è admin');
        router.push('/');
      }
    }, 5000); // 5 secondi di delay per dare tempo all'autenticazione
    
    return () => clearTimeout(timeoutId);
  }, [isAdmin, loading, router]);

  // Monitora quando il pannello è pronto (dopo che i permessi sono verificati e ha avuto tempo di caricare)
  useEffect(() => {
    if (!loading && isAdmin && !isPanelReady) {
      // Aspetta che AdminPanel abbia tempo di caricare tutti i dati asincroni
      // (pools, predictions, contract states, etc.)
      const timer = setTimeout(() => {
        setIsPanelReady(true);
      }, 2000); // 2 secondi per dare tempo a tutti i caricamenti asincroni
      
      return () => clearTimeout(timer);
    }
  }, [loading, isAdmin, isPanelReady]);

  // Se non è admin, mostra solo il modal di errore o nulla (il redirect è gestito da useEffect)
  if (!isAdmin && !loading) {
    return (
      <>
        <div className="min-h-screen bg-white dark:bg-dark-bg">
          <main className="pt-24 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Errore di Accesso
                  </h2>
                  <p className="text-red-600 dark:text-red-300">
                    {error}
                  </p>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </>
    );
  }

  // Mostra sempre la pagina (si carica dietro il modal) e il modal quando è in loading
  // Il modal si chiude solo quando loading è false, isAdmin è true E il pannello è pronto
  const showModal = loading || (!loading && !isAdmin) || (!loading && isAdmin && !isPanelReady);

  return (
    <>
      {/* Modal popup con loading - si chiude quando tutto è completamente caricato */}
      <AdminLoadingModal isOpen={showModal} />
      
      {/* Pagina admin - si carica dietro il modal */}
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <main className="pt-24 pb-10">
          {!loading && isAdmin ? (
            <AdminPanel />
          ) : error ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Errore di Accesso
                </h2>
                <p className="text-red-600 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}
