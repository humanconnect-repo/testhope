import { NextResponse } from 'next/server';

interface Match {
  id: number;
  utcDate: string;
  status: string;
  competition: {
    id: number;
    name: string;
    code: string;
  };
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
}

interface FootballDataResponse {
  matches: Match[];
}

export async function GET() {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key non configurata' },
        { status: 500 }
      );
    }

    // Calcola range: da oggi fino a 7 giorni nel futuro
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    // Formatta le date in ISO per l'API (formato YYYY-MM-DD)
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = sevenDaysLater.toISOString().split('T')[0];

    console.log('🔍 Fetching matches from', dateFrom, 'to', dateTo);

    // Filtri: Solo Serie A (SA)
    // Serie A competition ID: 2019 (secondo football-data.org)
    const competitions = [
      { id: '2019', name: 'Serie A', code: 'SA' }
    ];
    
    let allMatches: Match[] = [];

    // Fetch per ogni competizione separatamente
    for (const comp of competitions) {
      try {
        const url = `https://api.football-data.org/v4/matches?competitions=${comp.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
        console.log(`📡 Fetching ${comp.name} (${comp.code}):`, url);
        
        const response = await fetch(url, {
          headers: {
            'X-Auth-Token': apiKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Errore API per ${comp.name}:`, response.status, errorText);
          continue; // Continua con la prossima competizione
        }

        const data: FootballDataResponse = await response.json();
        console.log(`✅ ${comp.name}: trovati ${data.matches?.length || 0} match totali`);
        
        if (data.matches && data.matches.length > 0) {
          console.log(`📋 Match trovati per ${comp.name}:`, data.matches.map(m => ({
            id: m.id,
            teams: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
            date: m.utcDate,
            status: m.status,
            competition: m.competition.code
          })));
        }
        
        // Filtra match futuri: include TIMED, SCHEDULED, POSTPONED
        // L'API restituisce match con status TIMED per i match programmati
        const scheduledMatches = (data.matches || []).filter(
          (match) => {
            const status = match.status?.toUpperCase();
            const validStatuses = ['SCHEDULED', 'TIMED', 'POSTPONED'];
            const hasValidStatus = validStatuses.includes(status);
            
            // Verifica anche che la data sia nel futuro
            const matchDate = new Date(match.utcDate);
            const now = new Date();
            const isInFuture = matchDate >= now;
            
            // Accetta se ha status valido O se è nel futuro (doppio controllo)
            return hasValidStatus && isInFuture;
          }
        );
        
        console.log(`📋 Match SCHEDULED per ${comp.name}:`, scheduledMatches.length);
        if (scheduledMatches.length > 0) {
          scheduledMatches.forEach(match => {
            console.log(`  ✅ ${match.competition.name} (${match.competition.code}) | ${match.homeTeam.name} vs ${match.awayTeam.name} | ${match.utcDate}`);
          });
        }
        
        allMatches = [...allMatches, ...scheduledMatches];
      } catch (error) {
        console.error(`❌ Errore fetching ${comp.name}:`, error);
        continue;
      }
    }

    console.log(`🏆 Totale match trovati: ${allMatches.length}`);

    // Ordina per data crescente
    allMatches.sort((a, b) => {
      const dateA = new Date(a.utcDate).getTime();
      const dateB = new Date(b.utcDate).getTime();
      return dateA - dateB;
    });

    console.log(`📊 Match finali da restituire: ${allMatches.length}`);

    return NextResponse.json({ matches: allMatches });
  } catch (error) {
    console.error('Errore nella route API matches:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei match' },
      { status: 500 }
    );
  }
}

