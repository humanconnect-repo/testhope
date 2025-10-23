"use client";
import AdminPanel from '@/components/AdminPanel';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { isAdmin, loading, error } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // Se non è in loading e non è admin, reindirizza alla home
    if (!loading && !isAdmin) {
      console.log('❌ Accesso negato: utente non è admin');
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  // Mostra loading mentre controlla i permessi
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <Header />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Verifica permessi admin...
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Se non è admin, non mostra nulla (il redirect è gestito da useEffect)
  if (!isAdmin) {
    return null;
  }

  // Se c'è un errore, mostra il messaggio
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-bg">
        <Header />
        <main className="py-10">
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
        </main>
        <Footer />
      </div>
    );
  }

  // Se è admin, mostra il pannello
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      <main className="py-10">
        <AdminPanel />
      </main>
      <Footer />
    </div>
  );
}
