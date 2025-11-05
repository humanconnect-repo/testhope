import { NextResponse } from 'next/server';

interface PolymarketCondition {
  id: string;
  question: string;
  description?: string;
  slug: string;
  resolutionSource?: string;
  endDate?: string;
  endDateTimestamp?: string;
  outcomes?: Array<{
    id: string;
    title: string;
    price?: string;
  }>;
  marketMakerAddress?: string;
  volume?: string;
  liquidity?: string;
  image?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

interface PolymarketMarket {
  id: string;
  slug: string;
  question: string;
  description?: string;
  condition: PolymarketCondition;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  endDateTimestamp?: string;
  liquidity?: string;
  volume?: string;
  image?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

// Endpoint API ufficiale di Polymarket (Gamma API)
const POLYMARKET_API_ENDPOINT = 'https://gamma-api.polymarket.com/markets';

export async function GET() {
  try {
    // Calcola date per filtrare mercati futuri o recenti (non più vecchi di 3 mesi)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Formatta date in formato ISO per l'API
    const endDateMin = threeMonthsAgo.toISOString();
    const endDateMax = oneYearFromNow.toISOString();
    
    let allMarkets: any[] = [];
    
    // Usa direttamente l'endpoint markets standard (non richiede autenticazione)
    try {
      console.log('📡 Fetching markets from Polymarket API...');
      const marketsUrl = new URL(POLYMARKET_API_ENDPOINT);
      marketsUrl.searchParams.set('limit', '200');
      marketsUrl.searchParams.set('closed', 'false');
      marketsUrl.searchParams.set('active', 'true');
      marketsUrl.searchParams.set('end_date_min', endDateMin);
      marketsUrl.searchParams.set('end_date_max', endDateMax);
      marketsUrl.searchParams.set('order', 'volumeNum');
      marketsUrl.searchParams.set('ascending', 'false');
      
      const response = await fetch(marketsUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BellaNapoli/1.0',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const marketsData = await response.json();
        const markets = Array.isArray(marketsData) ? marketsData : [];
        
        // Filtra per crypto o finance nei tags o nel testo
        const filtered = markets.filter((market: any) => {
          const tags = market.tags || [];
          const tagNames = tags.map((tag: any) => (tag.name || tag || '').toLowerCase()).join(' ');
          const title = (market.question || '').toLowerCase();
          const description = (market.description || '').toLowerCase();
          const fullText = `${tagNames} ${title} ${description}`;
          
          const hasCryptoOrFinance = fullText.includes('crypto') || 
                                    fullText.includes('finance') || 
                                    fullText.includes('financial') ||
                                    fullText.includes('bitcoin') || 
                                    fullText.includes('btc') ||
                                    fullText.includes('ethereum') ||
                                    fullText.includes('eth') ||
                                    fullText.includes('stock') ||
                                    fullText.includes('stocks') ||
                                    fullText.includes('economy') ||
                                    fullText.includes('economic') ||
                                    fullText.includes('s&p') ||
                                    fullText.includes('sp500') ||
                                    fullText.includes('nasdaq') ||
                                    fullText.includes('dow') ||
                                    fullText.includes('inflation') ||
                                    fullText.includes('fed') ||
                                    fullText.includes('federal reserve') ||
                                    fullText.includes('interest rate') ||
                                    fullText.includes('gdp') ||
                                    fullText.includes('unemployment') ||
                                    fullText.includes('trading') ||
                                    fullText.includes('investment') ||
                                    fullText.includes('earnings') ||
                                    fullText.includes('revenue') ||
                                    fullText.includes('profit') ||
                                    fullText.includes('recession') ||
                                    fullText.includes('growth') ||
                                    fullText.includes('currency') ||
                                    fullText.includes('forex') ||
                                    fullText.includes('usd') ||
                                    fullText.includes('dollar') ||
                                    fullText.includes('euro') ||
                                    fullText.includes('company') ||
                                    fullText.includes('corporate');
          
          // Verifica data di scadenza
          const endDate = market.endDate ? new Date(market.endDate) :
                         market.endDateIso ? new Date(market.endDateIso) : null;
          
          if (endDate && (endDate < threeMonthsAgo || endDate > oneYearFromNow)) {
            return false;
          }
          
          return hasCryptoOrFinance;
        });
        
        allMarkets = [...allMarkets, ...filtered];
        console.log(`✅ Markets endpoint: trovati ${filtered.length} mercati (da ${markets.length} totali)`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Errore API markets:`, response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Errore fetching markets endpoint:', error);
    }
    
    // Rimuovi duplicati basandosi sull'ID
    const uniqueMarkets = allMarkets.filter((market: any, index: number, self: any[]) => 
      index === self.findIndex((m: any) => m.id === market.id)
    );
    
    console.log(`✅ Polymarket: trovati ${uniqueMarkets.length} mercati unici totali (Crypto + Finance)`);
    
    // Filtra i mercati per escludere sport e altri non desiderati
    const excludedKeywords = [
      'sport', 'sports', 'football', 'soccer', 'basketball', 'baseball', 
      'nfl', 'nba', 'nhl', 'mlb', 'sportivo', 'match', 'game', 'team', 'player',
      'athlete', 'championship', 'tournament', 'olympics', 'world cup', 'politics', 'election'
    ];
    
    const filteredMarkets = uniqueMarkets.filter((market: any) => {
      // Estrai categoria dai tags
      const tags = market.tags || [];
      const tagNames = tags.map((tag: any) => (tag.name || tag || '').toLowerCase()).join(' ');
      const category = (market.category || market.question || '').toLowerCase();
      
      const title = (market.question || '').toLowerCase();
      const description = (market.description || '').toLowerCase();
      
      const fullText = `${category} ${tagNames} ${title} ${description}`;
      
      // Escludi mercati sportivi o politici
      const isExcluded = excludedKeywords.some(excluded => {
        const regex = new RegExp(`\\b${excluded}\\b`, 'i');
        return regex.test(fullText);
      });
      
      if (isExcluded) {
        return false;
      }
      
      // Verifica data di scadenza
      const endDate = market.endDate ? new Date(market.endDate) :
                     market.endDateIso ? new Date(market.endDateIso) : null;
      
      if (endDate) {
        if (endDate < threeMonthsAgo || endDate > oneYearFromNow) {
          return false;
        }
      }
      
      return true;
    });
    
    // Ordina per volume decrescente
    filteredMarkets.sort((a: any, b: any) => {
      const volumeA = a.volumeNum || a.volume || 0;
      const volumeB = b.volumeNum || b.volume || 0;
      return volumeB - volumeA;
    });
    
    console.log(`📊 Dopo filtraggio: ${filteredMarkets.length} mercati (Crypto/Finance, non scaduti)`);
    
    // Formatta i dati per il frontend (formato Gamma API)
    const formattedMarkets = filteredMarkets.map((market: any) => {
      // Formato Gamma API: estrai outcomes e prezzi
      let outcomePrices: any = {};
      try {
        if (typeof market.outcomePrices === 'string') {
          outcomePrices = JSON.parse(market.outcomePrices);
        } else if (market.outcomePrices) {
          outcomePrices = market.outcomePrices;
        }
      } catch (e) {
        // Ignora errori di parsing
      }

      // Calcola probabilità YES/NO dai prezzi (formato Gamma API)
      let yesPrice = null;
      let noPrice = null;
      
      if (typeof outcomePrices === 'object' && outcomePrices !== null) {
        yesPrice = outcomePrices.Yes || outcomePrices.YES || outcomePrices['Yes'] || outcomePrices[0] || null;
        noPrice = outcomePrices.No || outcomePrices.NO || outcomePrices['No'] || outcomePrices[1] || null;
      }
      
      // Fallback: usa lastTradePrice se disponibile
      if (yesPrice === null && market.lastTradePrice !== null && market.lastTradePrice !== undefined) {
        yesPrice = market.lastTradePrice;
        noPrice = 1 - market.lastTradePrice;
      }
      
      let yesPercentage = null;
      let noPercentage = null;
      
      if (yesPrice !== null && noPrice !== null) {
        const total = parseFloat(String(yesPrice)) + parseFloat(String(noPrice));
        if (total > 0) {
          yesPercentage = (parseFloat(String(yesPrice)) / total) * 100;
          noPercentage = (parseFloat(String(noPrice)) / total) * 100;
        }
      }

      // Estrai categoria dai tags (formato Gamma API - array di oggetti)
      const tags = market.tags || [];
      const category = tags[0]?.name || market.category || 'Altro';

      // Estrai data di scadenza (formato Gamma API)
      const endDate = market.endDate || market.endDateIso || null;
      const endDateTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1000).toString() : null;

      return {
        id: market.id || '',
        slug: market.slug || '',
        title: market.question || 'Nessun titolo',
        description: market.description || '',
        category,
        endDate,
        endDateTimestamp,
        yesPrice: yesPrice ? parseFloat(String(yesPrice)) : null,
        noPrice: noPrice ? parseFloat(String(noPrice)) : null,
        yesPercentage: yesPercentage ? Math.round(yesPercentage * 10) / 10 : null,
        noPercentage: noPercentage ? Math.round(noPercentage * 10) / 10 : null,
        volume: market.volumeNum ? market.volumeNum : 
               (market.volume ? parseFloat(market.volume) : null),
        liquidity: market.liquidityNum ? market.liquidityNum : 
                  (market.liquidity ? parseFloat(market.liquidity) : null),
        image: market.image || market.twitterCardImage || null,
        active: market.active !== false,
        closed: market.closed || false,
      };
    });

    return NextResponse.json({
      markets: formattedMarkets,
      count: formattedMarkets.length,
    });
  } catch (error) {
    console.error('❌ Errore fetch Polymarket:', error);
    return NextResponse.json(
      { 
        error: 'Errore nel recupero dei mercati da Polymarket',
        details: error instanceof Error ? error.message : 'Errore sconosciuto',
        markets: [] 
      },
      { status: 500 }
    );
  }
}

