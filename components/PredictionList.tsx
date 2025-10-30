"use client";
import { useState, useEffect } from 'react';
import PredictionCard from './PredictionCard';
import { supabase } from '../lib/supabase';
import { getPoolWinner } from '../lib/contracts';
import { formatItalianDateShort, getClosingDateText } from '../lib/dateUtils';

interface Prediction {
  id: string;
  title: string;
  slug: string;
  category: string;
  closing_date: string;
  status: 'in_attesa' | 'attiva' | 'in_pausa' | 'risolta' | 'cancellata' | 'nascosta';
  image_url?: string;
  pool_address?: string;
  yes_percentage: number;
  no_percentage: number;
  total_bets: number;
  total_predictions?: number;
}

interface PredictionListProps {
  selectedCategory: string;
  searchQuery: string;
}

export default function PredictionList({ selectedCategory, searchQuery }: PredictionListProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, [selectedCategory, searchQuery]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      let predictionsData: any[] = [];
      let limit = 15; // Default per "Novità"

      // Se c'è una query di ricerca, filtra per titolo
      const hasSearchQuery = searchQuery.trim().length > 0;

      if (selectedCategory === 'trending') {
        // Trending: top 5 con maggiori puntate
        limit = 5;
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa', 'in_pausa']);

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Conta le bets per Sì e No
            const { count: totalBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id);
            
            const { count: yesBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'yes');
            
            const { count: noBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'no');

            // Calcola le percentuali con un solo decimale
            const total = totalBets || 0;
            const yesCount = yesBets || 0;
            const noCount = noBets || 0;
            
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            // Calcola il totale degli importi BNB per i volumi
            const { data: betAmounts } = await supabase
              .from('bets')
              .select('amount_bnb')
              .eq('prediction_id', prediction.id);
            
            const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte dal contratto anche se hanno status diverso nel DB
        const filteredTrending = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        
        // Ordina per total_predictions (trending) e filtra solo quelle con puntate
        predictionsData = filteredTrending
          .filter((p: any) => p !== null && p.total_predictions > 0) // Solo prediction con puntate e non risolte
          .sort((a, b) => b.total_predictions - a.total_predictions)
          .slice(0, limit);

      } else if (selectedCategory === 'all') {
        // Novità: ultime 15 prediction
        limit = 15;
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          .in('status', ['attiva', 'in_attesa', 'in_pausa'])
          .order('created_at', { ascending: false })
          .limit(limit);

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Conta le bets per Sì e No
            const { count: totalBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id);
            
            const { count: yesBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'yes');
            
            const { count: noBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'no');

            // Calcola le percentuali con un solo decimale
            const total = totalBets || 0;
            const yesCount = yesBets || 0;
            const noCount = noBets || 0;
            
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            // Calcola il totale degli importi BNB per i volumi
            const { data: betAmounts } = await supabase
              .from('bets')
              .select('amount_bnb')
              .eq('prediction_id', prediction.id);
            
            const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte dal contratto anche se hanno status diverso nel DB
        const filteredPredictions = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        predictionsData = filteredPredictions.filter((p: any) => p !== null);

      } else if (selectedCategory === 'closing_soon') {
        // In scadenza: tutte le prediction ATTIVE ordinate per data di chiusura (DB)
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          .eq('status', 'attiva')
          .order('closing_date', { ascending: true });

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Conta le bets per Sì e No
            const { count: totalBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id);
            
            const { count: yesBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'yes');
            
            const { count: noBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'no');

            // Calcola le percentuali con un solo decimale
            const total = totalBets || 0;
            const yesCount = yesBets || 0;
            const noCount = noBets || 0;
            
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            // Calcola il totale degli importi BNB per i volumi
            const { data: betAmounts } = await supabase
              .from('bets')
              .select('amount_bnb')
              .eq('prediction_id', prediction.id);
            
            const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte dal contratto anche se hanno status diverso nel DB
        const filteredClosing = await Promise.all(
          predictionsWithPercentages.map(async (prediction: any) => {
            if (prediction.pool_address) {
              try {
                const winnerInfo = await getPoolWinner(prediction.pool_address);
                if (winnerInfo && winnerInfo.winnerSet) {
                  return null; // Escludi questa prediction
                }
              } catch (error) {
                // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                if (prediction.status === 'risolta') {
                  return null;
                }
              }
            } else {
              // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
              if (prediction.status === 'risolta') {
                return null;
              }
            }
            return prediction;
          })
        );
        predictionsData = filteredClosing.filter((p: any) => p !== null);

      } else {
        // Categoria specifica: tutte le prediction di quella categoria
        let query = supabase
          .from('predictions')
          .select(`
            id,
            title,
            slug,
            category,
            closing_date,
            status,
            image_url,
            pool_address,
            created_at
          `)
          // Per la categoria "Degen" includiamo anche le prediction risolte
          .in('status', selectedCategory === 'Degen' 
            ? ['attiva', 'in_attesa', 'in_pausa', 'risolta'] 
            : ['attiva', 'in_attesa', 'in_pausa'])
          .eq('category', selectedCategory);

        if (hasSearchQuery) {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcola le percentuali basate solo sul numero di Sì/No
        const predictionsWithPercentages = await Promise.all(
          (data || []).map(async (prediction: any) => {
            // Conta le bets per Sì e No
            const { count: totalBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id);
            
            const { count: yesBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'yes');
            
            const { count: noBets } = await supabase
              .from('bets')
              .select('*', { count: 'exact', head: true })
              .eq('prediction_id', prediction.id)
              .eq('position', 'no');

            // Calcola le percentuali con un solo decimale
            const total = totalBets || 0;
            const yesCount = yesBets || 0;
            const noCount = noBets || 0;
            
            const yesPercentage = total > 0 ? Math.round((yesCount / total) * 100 * 10) / 10 : 0;
            const noPercentage = total > 0 ? Math.round((noCount / total) * 100 * 10) / 10 : 0;

            // Calcola il totale degli importi BNB per i volumi
            const { data: betAmounts } = await supabase
              .from('bets')
              .select('amount_bnb')
              .eq('prediction_id', prediction.id);
            
            const totalBnbAmount = betAmounts?.reduce((sum: number, bet: any) => sum + (bet.amount_bnb || 0), 0) || 0;

            return {
              ...prediction,
              yes_percentage: yesPercentage,
              no_percentage: noPercentage,
              total_bets: totalBnbAmount, // Totale importi BNB per i volumi
              total_predictions: total
            };
          })
        );

        // Filtra le prediction risolte solo se NON siamo nella categoria "Degen"
        const filteredCategory = selectedCategory === 'Degen'
          ? predictionsWithPercentages // non escludere le risolte
          : await Promise.all(
              predictionsWithPercentages.map(async (prediction: any) => {
                if (prediction.pool_address) {
                  try {
                    const winnerInfo = await getPoolWinner(prediction.pool_address);
                    if (winnerInfo && winnerInfo.winnerSet) {
                      return null; // Escludi questa prediction
                    }
                  } catch (error) {
                    // In caso di errore, usa fallback DB: escludi se status è 'risolta'
                    if (prediction.status === 'risolta') {
                      return null;
                    }
                  }
                } else {
                  // Senza pool_address, usa fallback DB: escludi se status è 'risolta'
                  if (prediction.status === 'risolta') {
                    return null;
                  }
                }
                return prediction;
              })
            );
        
        // ORDINA PER PREDICTIONS TOTALI (numero di bet)
        predictionsData = filteredCategory
          .filter((p: any) => p !== null)
          .sort((a, b) => b.total_predictions - a.total_predictions);
      }

      setPredictions(predictionsData);
    } catch (error) {
      console.error('Error loading predictions:', error);
      setError('Errore nel caricamento delle prediction');
    } finally {
      setLoading(false);
    }
  };

  const formatClosingDate = (dateString: string, status?: string) => {
    return getClosingDateText(dateString, status);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Predictions in corso...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Caricamento delle prediction...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Predictions in corso...
          </h2>
          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            onClick={loadPredictions}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    const getEmptyMessage = () => {
      // Se c'è una ricerca attiva
      if (searchQuery.trim()) {
        return {
          title: '🔍 Nessun risultato trovato',
          description: `Non ci sono prediction che contengono "${searchQuery.trim()}"`
        };
      }
      
      if (selectedCategory === 'trending') {
        return {
          title: null, // Nessun titolo per Trending
          description: 'Non ci sono ancora Predicitons con scommesse. Sii il primo a scommettere!'
        };
      } else if (selectedCategory === 'all') {
        return {
          title: null, // Nessun titolo per Novità
          description: 'Non ci sono Predicitons attive al momento'
        };
      } else if (selectedCategory === 'closing_soon') {
        return {
          title: null,
          description: 'Nessuna prediction in scadenza'
        };
      } else {
        return {
          title: null, // Nessun titolo per le categorie
          description: `Non ci sono Predicitons attive nella categoria ${selectedCategory}`
        };
      }
    };

    const emptyMessage = getEmptyMessage();

    return (
      <div className="space-y-6">
        <div className="text-center">
          {emptyMessage.title && (
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {emptyMessage.title}
            </h2>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            {emptyMessage.description}
          </p>
        </div>
      </div>
    );
  }

  const getSectionTitle = () => {
    // Nessun titolo per tutte le categorie
    return null;
  };

  const getSectionDescription = () => {
    switch (selectedCategory) {
      case 'all':
        return 'Prediction in corso';
      case 'trending':
        return 'Le Predicitons più popolari con il maggior numero di scommesse';
      case 'closing_soon':
        return 'Predictions in scadenza';
      default:
        return `Tutte le Predicitons della categoria ${selectedCategory}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        {getSectionTitle() && (
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getSectionTitle()}
          </h2>
        )}
        <p className="text-gray-600 dark:text-gray-400">
          {getSectionDescription()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {predictions.map((prediction) => (
          <PredictionCard
            key={prediction.id}
            id={prediction.slug}
            title={prediction.title}
            closingDate={formatClosingDate(prediction.closing_date, prediction.status)}
            yesPercentage={prediction.yes_percentage}
            noPercentage={prediction.no_percentage}
            category={prediction.category}
            status={prediction.status}
            totalBets={prediction.total_bets || 0}
            imageUrl={prediction.image_url}
            poolAddress={prediction.pool_address}
            totalPredictions={prediction.total_predictions || 0}
          />
        ))}
      </div>
    </div>
  );
}
