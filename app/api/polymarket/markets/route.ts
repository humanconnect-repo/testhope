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
    // Limita a 50 mercati totali
    const limit = 50;
    
    // Calcola date per filtrare mercati futuri o recenti (non più vecchi di 3 mesi)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Formatta date in formato ISO per l'API
    const endDateMin = threeMonthsAgo.toISOString();
    const endDateMax = oneYearFromNow.toISOString();
    
    // Costruisci URL con parametri di query
    const url = new URL(POLYMARKET_API_ENDPOINT);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('closed', 'false');
    url.searchParams.set('active', 'true');
    url.searchParams.set('end_date_min', endDateMin);
    url.searchParams.set('end_date_max', endDateMax);
    // Ordina per volume decrescente per avere i più popolari
    url.searchParams.set('order', 'volumeNum');
    url.searchParams.set('ascending', 'false');
    
    console.log('📡 Fetching markets from Polymarket Gamma API:', url.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BellaNapoli/1.0',
      },
      // Timeout di 15 secondi
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore API Polymarket:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Errore nel recupero dei mercati da Polymarket',
          details: errorText,
          markets: [] 
        },
        { status: response.status }
      );
    }

    const markets: PolymarketMarket[] = await response.json();
    
    if (!Array.isArray(markets)) {
      console.error('❌ Formato dati inaspettato:', typeof markets);
      return NextResponse.json(
        { 
          error: 'Formato dati inaspettato dall\'API Polymarket',
          markets: [] 
        },
        { status: 500 }
      );
    }
    
    console.log(`✅ Polymarket: trovati ${markets.length} mercati totali`);
    
    // Filtra i mercati per categoria: solo economia e crypto (escludi sport)
    // Usa i tag e la categoria dal formato Gamma API
    const allowedKeywords = [
      'economy', 'economics', 'economic', 'economia',
      'crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain',
      'finance', 'financial', 'finanza',
      'stock', 'stocks', 's&p', 'sp500', 'spx', 'dow', 'nasdaq', 'djia',
      'inflation', 'fed', 'federal reserve', 'interest rate', 'tasso', 'rates',
      'gdp', 'unemployment', 'disoccupazione', 'employment',
      'trading', 'investment', 'investimento', 'asset', 'assets',
      'dollar', 'euro', 'currency', 'forex', 'exchange rate', 'usd',
      'company', 'companies', 'corporate', 'earnings', 'revenue', 'profit',
      'recession', 'growth', 'crescita', 'economico', 'monetary', 'fiscal',
      'commodity', 'commodities', 'oil', 'gold', 'silver'
    ];
    
    const excludedKeywords = [
      'sport', 'sports', 'football', 'soccer', 'basketball', 'baseball', 
      'nfl', 'nba', 'nhl', 'mlb', 'sportivo', 'match', 'game', 'team', 'player',
      'athlete', 'championship', 'tournament', 'olympics', 'world cup'
    ];
    
    const filteredMarkets = markets.filter((market: any) => {
      // Estrai categoria dai tags (array di oggetti nella Gamma API)
      const tags = market.tags || [];
      const tagNames = tags.map((tag: any) => tag.name || tag).join(' ').toLowerCase();
      const category = (market.category || '').toLowerCase();
      
      const title = (market.question || '').toLowerCase();
      const description = (market.description || '').toLowerCase();
      
      const fullText = `${category} ${tagNames} ${title} ${description}`;
      
      // Controlla se contiene categorie escluse (sport) - esclusione rigorosa
      const isExcluded = excludedKeywords.some(excluded => {
        const regex = new RegExp(`\\b${excluded}\\b`, 'i');
        return regex.test(fullText);
      });
      
      if (isExcluded) {
        return false;
      }
      
      // Controlla se contiene categorie permesse (economia/crypto)
      const isAllowed = allowedKeywords.some(allowed => {
        const regex = new RegExp(`\\b${allowed}\\b`, 'i');
        return regex.test(fullText);
      });
      
      if (!isAllowed) {
        return false;
      }
      
      // Verifica data di scadenza (già filtrata dall'API, ma verifichiamo comunque)
      const endDate = market.endDate ? new Date(market.endDate) :
                     market.endDateIso ? new Date(market.endDateIso) : null;
      
      if (endDate) {
        // Escludi mercati scaduti più di 3 mesi fa o troppo futuri
        if (endDate < threeMonthsAgo || endDate > oneYearFromNow) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`📊 Dopo filtraggio: ${filteredMarkets.length} mercati (Economia/Crypto, non scaduti)`);
    
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

