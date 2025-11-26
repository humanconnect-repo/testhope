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

export async function GET(request: Request) {
  try {
    const apiKey = process.env.FOOTBALL_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key non configurata' },
        { status: 500 }
      );
    }

    // Leggi i parametri dalla query string
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competition') || '2019'; // Default: Serie A
    const requestedDays = parseInt(searchParams.get('days') || '7', 10); // Default: 7 giorni

    // L'API ha un limite di 10 giorni per richiesta - limitiamo a max 10 giorni
    // IMPORTANTE: Il range include sia il giorno iniziale che quello finale
    // Se richiediamo 10 giorni, dobbiamo andare da oggi a 9 giorni dopo (non 10)
    // perché oggi + 9 giorni = 10 giorni totali nel range
    const maxDays = Math.min(requestedDays, 10);
    const daysToAdd = maxDays - 1; // Sottraiamo 1 perché includiamo il giorno di oggi

    // Calcola range: da oggi fino a N giorni nel futuro
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const daysLater = new Date(today);
    daysLater.setDate(today.getDate() + daysToAdd);
    daysLater.setHours(23, 59, 59, 999);

    // Formatta le date in ISO per l'API (formato YYYY-MM-DD)
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo = daysLater.toISOString().split('T')[0];

    console.log('🔍 Fetching matches from', dateFrom, 'to', dateTo, `(competition: ${competitionId}, requested: ${requestedDays} days, actual range: ${maxDays} days)`);

    // Determina la competizione in base all'ID
    // Serie A competition ID: 2019
    // Champions League competition ID: 2001
    const competitionMap: Record<string, { name: string; code: string }> = {
      '2019': { name: 'Serie A', code: 'SA' },
      '2001': { name: 'Champions League', code: 'CL' }
    };

    const competition = competitionMap[competitionId] || competitionMap['2019'];
    const competitions = [
      { id: competitionId, name: competition.name, code: competition.code }
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
            competitionCode: m.competition.code,
            competitionId: m.competition.id,
            competitionName: m.competition.name
          })));
          
          // Per Champions League, mostra anche le competizioni uniche trovate
          if (comp.id === '2001') {
            const uniqueCompetitions = [...new Set(data.matches.map(m => `${m.competition.id}-${m.competition.code}-${m.competition.name}`))];
            console.log(`🔍 Champions League - Competizioni trovate:`, uniqueCompetitions);
          }
        }
        
        // Filtra match nel range: include TIMED, SCHEDULED, POSTPONED, LIVE, IN_PLAY
        // Include tutte le partite nel range da oggi a N giorni nel futuro
        // IMPORTANTE: Filtra anche per competizione per evitare match di altre competizioni
        const scheduledMatches = (data.matches || []).filter(
          (match) => {
            // Verifica che il match appartenga alla competizione richiesta
            // Controlla sia per ID che per codice
            const matchCompetitionCode = match.competition?.code?.toUpperCase();
            const matchCompetitionId = match.competition?.id?.toString();
            const expectedCode = competition.code.toUpperCase();
            const expectedId = comp.id;
            
            // Accetta se corrisponde per ID O per codice (doppio controllo)
            const isCorrectCompetition = matchCompetitionId === expectedId || matchCompetitionCode === expectedCode;
            
            if (!isCorrectCompetition) {
              return false; // Escludi match di altre competizioni
            }
            
            const status = match.status?.toUpperCase();
            // Include anche LIVE e IN_PLAY per partite di oggi
            const validStatuses = ['SCHEDULED', 'TIMED', 'POSTPONED', 'LIVE', 'IN_PLAY'];
            const hasValidStatus = validStatuses.includes(status);
            
            // Verifica che la data sia nel range (da oggi a N giorni nel futuro)
            // Usa today invece di now per includere tutti i match di oggi
            const matchDate = new Date(match.utcDate);
            const matchDateOnly = new Date(matchDate);
            matchDateOnly.setHours(0, 0, 0, 0);
            
            // Match deve essere >= oggi e <= N giorni nel futuro
            const isInRange = matchDateOnly >= today && matchDateOnly <= daysLater;
            
            // Accetta se ha status valido E è nel range E appartiene alla competizione corretta
            return hasValidStatus && isInRange && isCorrectCompetition;
          }
        );
        
        console.log(`📋 Match SCHEDULED per ${comp.name}:`, scheduledMatches.length);
        if (scheduledMatches.length > 0) {
          scheduledMatches.forEach(match => {
            console.log(`  ✅ ${match.competition.name} (${match.competition.code}) | ${match.homeTeam.name} vs ${match.awayTeam.name} | ${match.utcDate}`);
          });
        } else if (data.matches && data.matches.length > 0) {
          console.log(`⚠️ Nessun match valido dopo il filtro per ${comp.name}. Match totali: ${data.matches.length}`);
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

