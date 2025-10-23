// Lista di parole inappropriate in italiano
// Fonte: https://github.com/censor-text/profanity-list
const ITALIAN_PROFANITY_WORDS = [
  'allupato', 'ammucchiata', 'arrapato', 'arrusa', 'arruso', 'assatanato',
  'bagascia', 'bagassa', 'bagnarsi', 'baldracca', 'balle', 'battere', 'battona',
  'belino', 'biga', 'bocchinara', 'bocchino', 'bofilo', 'boiata', 'bordello',
  'brinca', 'bucaiolo', 'budiùlo', 'busone', 'cacca', 'caciocappella', 'cadavere',
  'cagare', 'cagata', 'cagna', 'casci', 'cazzata', 'cazzimma', 'cazzo', 'cazzone',
  'cesso', 'checca', 'chiappa', 'chiavare', 'chiavata', 'ciospo', 'coglione',
  'coglioni', 'cornuto', 'cozza', 'culattina', 'culattone', 'culo', 'ditalino',
  'fava', 'femminuccia', 'fica', 'figa', 'figone', 'finocchio', 'fottere',
  'fottersi', 'fracicone', 'fregna', 'frocio', 'froscio', 'goldone', 'guardone',
  'imbecille', 'incazzarsi', 'incoglionirsi', 'ingoio', 'leccaculo', 'lecchino',
  'lofare', 'loffa', 'loffare', 'mannaggia', 'merda', 'merdata', 'merdoso',
  'mignotta', 'minchia', 'minchione', 'mona', 'monta', 'montare', 'mussa',
  'nerchia', 'padulo', 'palle', 'palloso', 'patacca', 'patonza', 'pecorina',
  'pesce', 'picio', 'pincare', 'pinnolone', 'pippa', 'pippone', 'pipì', 'pirla',
  'pisciare', 'piscio', 'pisello', 'pistolotto', 'pomiciare', 'pompa', 'pompino',
  'porca', 'porco', 'potta', 'puppami', 'puttana', 'quaglia', 'recchione',
  'regina', 'rincoglionire', 'rizzarsi', 'rompiballe', 'rompipalle', 'ruffiano',
  'sbattere', 'sbattersi', 'sborra', 'sborrata', 'sborrone', 'sbrodolata',
  'scopare', 'scopata', 'scorreggiare', 'sega', 'slinguare', 'slinguata',
  'smandrappata', 'soccia', 'socmel', 'sorca', 'spagnola', 'spompinare',
  'sticchio', 'stronza', 'stronzata', 'stronzo', 'succhiami', 'succhione',
  'sveltina', 'sverginare', 'tarzanello', 'terrone', 'tette', 'tirare', 'topa',
  'troia', 'trombare', 'vacca', 'vaffanculo', 'vangare', 'zinne', 'zoccola', 'porco dio',
  'porca madonna', 'porca merda', 'porca puttana', 'porco il dio', 'porca la madonna', 'porca la merda', 'porca la puttana',
  'brutto dio', 'dio', 'madonna', 'stupro' 
];

// Lista di parole inappropriate in inglese (selezione delle più comuni)
// Fonte: https://github.com/censor-text/profanity-list
const ENGLISH_PROFANITY_WORDS = [
  'abuse', 'anal', 'anus', 'ass', 'asshole', 'bastard', 'bitch', 'bloody',
  'blowjob', 'bollock', 'bollok', 'boner', 'boob', 'boobs', 'booobs', 'boooobs',
  'booooobs', 'booooooobs', 'breast', 'buceta', 'bum', 'butt', 'buttplug',
  'clitoris', 'cock', 'coon', 'crap', 'cunt', 'damn', 'dick', 'dildo', 'dyke',
  'fag', 'faggot', 'fagot', 'fagots', 'fags', 'fanny', 'fatass', 'fcuk',
  'fellate', 'fellatio', 'fingerfuck', 'fingerfucked', 'fingerfucker',
  'fingerfuckers', 'fingerfucking', 'fingerfucks', 'fistfuck', 'fistfucked',
  'fistfucker', 'fistfuckers', 'fistfucking', 'fistfuckings', 'fistfucks',
  'flange', 'fook', 'fooker', 'fuck', 'fucka', 'fucked', 'fucker', 'fuckers',
  'fuckhead', 'fuckheads', 'fucking', 'fuckings', 'fuckme', 'fucks', 'fuckwhit',
  'fuckwit', 'fudge', 'fudgepacker', 'fuk', 'fuker', 'fukker', 'fukkin',
  'fuks', 'fukwhit', 'fukwit', 'fux', 'gangbang', 'gangbanged', 'gangbangs',
  'gay', 'gaylord', 'gaysex', 'goatse', 'god', 'god-dam', 'god-damned',
  'goddamn', 'goddamned', 'hardcoresex', 'hell', 'heshe', 'hoar', 'hoare',
  'hoer', 'homo', 'hore', 'horniest', 'horny', 'hotsex', 'jackoff', 'jap',
  'jerk', 'jerkoff', 'jism', 'jiz', 'jizm', 'jizz', 'kawk', 'knob', 'knobead',
  'knobed', 'knobend', 'knobhead', 'knobjocky', 'knobjokey', 'kock', 'kondum',
  'kondums', 'kum', 'kummer', 'kumming', 'kums', 'kunilingus', 'l3i+ch',
  'l3itch', 'labia', 'lust', 'lusting', 'm0f0', 'm0fo', 'm45', 'ma5terbate',
  'ma5terbation', 'masochist', 'master-bate', 'masterb8', 'masterbat*',
  'masterbate', 'masterbation', 'masterbations', 'masturbate', 'masturbating',
  'masturbation', 'mof0', 'mofo', 'mothafuck', 'mothafucka', 'mothafuckas',
  'mothafuckaz', 'mothafucked', 'mothafucker', 'mothafuckers', 'mothafuckin',
  'mothafucking', 'mothafuckings', 'mothafucks', 'motherfuck', 'motherfucka',
  'motherfucked', 'motherfucker', 'motherfuckers', 'motherfuckin',
  'motherfucking', 'motherfuckings', 'motherfuckka', 'motherfucks', 'muff',
  'mutha', 'muthafecker', 'muthafuckker', 'muther', 'mutherfucker', 'n1gga',
  'n1gger', 'nazi', 'nigg3r', 'nigg4h', 'nigga', 'niggah', 'niggas', 'niggaz',
  'nigger', 'niggers', 'nob', 'nobhead', 'nobjocky', 'nobjokey', 'numbnuts',
  'nutsack', 'orgasm', 'orgasmic', 'orgasms', 'orgy', 'p0rn', 'pawn', 'pecker',
  'penis', 'penisfucker', 'phonesex', 'phuck', 'phuk', 'phuked', 'phuking',
  'phukked', 'phukking', 'phuks', 'phuq', 'pi55', 'pimpis', 'piss', 'pissed',
  'pisser', 'pissers', 'pisses', 'pissflaps', 'pissin', 'pissing', 'pissoff',
  'porn', 'porno', 'pornography', 'pornos', 'prick', 'pricks', 'pron', 'pube',
  'pusse', 'pussi', 'pussies', 'pussy', 'pussys', 'rectum', 'retard', 'rimjaw',
  'rimjob', 'rimming', 's hit', 's.o.b.', 'sadist', 'schlong', 'screwing',
  'scroat', 'scrote', 'scrotum', 'semen', 'sex', 'sh!+', 'sh!t', 'sh1t', 'shag',
  'shagger', 'shaggin', 'shagging', 'shemale', 'shi+', 'shit', 'shitdick',
  'shite', 'shited', 'shitey', 'shitfuck', 'shitfull', 'shithead', 'shiting',
  'shitings', 'shits', 'shitted', 'shitter', 'shitters', 'shitting', 'shittings',
  'shitty', 'skank', 'slut', 'sluts', 'smegma', 'smut', 'snatch', 'son-of-a-bitch',
  'spac', 'spunk', 't1tt1e5', 't1tties', 'teets', 'teez', 'testical', 'testicle',
  'tit', 'titfuck', 'tits', 'titt', 'tittie5', 'tittiefucker', 'titties', 'tittyfuck',
  'tittywank', 'titwank', 'turd', 'tw4t', 'twat', 'twathead', 'twatty', 'twunt',
  'twunter', 'v14gra', 'v1gra', 'vagina', 'viagra', 'vulva', 'w00se', 'wang',
  'wank', 'wanker', 'wanky', 'whoar', 'whore', 'willies', 'willy', 'xrated',
  'xxx'
];

// Lista combinata di tutte le parole inappropriate
const ALL_PROFANITY_WORDS = [...ITALIAN_PROFANITY_WORDS, ...ENGLISH_PROFANITY_WORDS];

// Funzione per normalizzare il testo (rimuove accenti, punteggiatura, spazi extra)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^\w\s]/g, ' ') // Sostituisce punteggiatura con spazi
    .replace(/\s+/g, ' ') // Rimuove spazi multipli
    .trim();
};

// Funzione per verificare se il testo contiene parole inappropriate
export const containsProfanity = (text: string): boolean => {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');
  
  return words.some(word => 
    ALL_PROFANITY_WORDS.includes(word)
  );
};

// Funzione per ottenere le parole inappropriate trovate
export const getProfanityWords = (text: string): string[] => {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');
  
  return words.filter(word => 
    ALL_PROFANITY_WORDS.includes(word)
  );
};

// Funzione per sostituire le parole inappropriate con asterischi
export const censorText = (text: string, replacement: string = '***'): string => {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');
  
  return words.map(word => 
    ALL_PROFANITY_WORDS.includes(word) ? replacement : word
  ).join(' ');
};

// Funzione principale per validare un commento
export const validateComment = (text: string): {
  isValid: boolean;
  message?: string;
  censoredText?: string;
  foundWords?: string[];
} => {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      message: 'Il commento non può essere vuoto.'
    };
  }

  if (containsProfanity(text)) {
    const foundWords = getProfanityWords(text);
    const censoredText = censorText(text);
    
    return {
      isValid: false,
      message: `Il tuo commento contiene parole inappropriate. Per favore, usa un linguaggio rispettoso e appropriato.`,
      censoredText,
      foundWords
    };
  }

  return {
    isValid: true
  };
};
