export interface ManualTrack {
  id: string;       // e.g. 'itunes:trk:123456'
  title: string;
  artist: string;
  artwork: string;  // 600x600bb URL
}

export interface WorldMusicWeek {
  weekOf: string;           // ISO date (Monday) — e.g. '2026-03-02'
  region: string;           // Display name
  flag: string;             // Emoji flag or symbol
  searchTerms: string[];    // iTunes search terms (fallback when no manualTracks)
  description: string;      // Short subtitle for the section
  manualTracks?: ManualTrack[]; // Curator-picked tracks — overrides iTunes auto-fetch
}

export const WORLD_MUSIC_SCHEDULE: WorldMusicWeek[] = [
  {
    weekOf: '2026-03-02',
    region: 'Brasil',
    flag: '🇧🇷',
    searchTerms: ['bossa nova', 'MPB', 'samba'],
    description: 'Bossa nova, MPB & samba',
    manualTracks: [
      { id: 'itunes:trk:1763712155', title: 'Coração Partido (Corazón Partío) [Ao Vivo]', artist: 'Grupo Menos É Mais', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/72/dd/5a/72dd5ac3-5f16-fc6a-ceb3-09b253e410d7/196872400793.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1444127573', title: 'A Nível De...', artist: 'João Bosco', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/d6/4a/f1/d64af175-97b8-5b42-e780-f04fba95e539/00731453374928.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:808283546', title: 'Eu Te Devoro', artist: 'Djavan', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/39/18/77/391877e4-1904-5694-e3f7-9f6fca2ac215/5099749214620.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1300458325', title: 'Meu ébano', artist: 'Alcione', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/7d/30/92/7d3092c5-f3ba-0784-a970-d95fd8f252a3/7898420125044.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1341850272', title: 'Vale a Pena Ouvir de Novo', artist: 'VS', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/36/8d/e5/368de5a4-7986-c910-8755-61718804b92d/0.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1445041050', title: 'Pé Na Areia', artist: 'Diogo Nogueira', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/65/fb/42/65fb42cf-6e90-ce49-a5ce-1ba1d273c88c/16UMGIM60916.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1587064131', title: 'A Sós (feat. Léo Brandão)', artist: 'André & Felipe, Casa Worship & Julliany Souza', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d4/b1/0c/d4b10c84-06ed-e485-09ee-9ac1154dce33/190296465741.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1444080829', title: 'Samba da Volta', artist: 'Vinicius De Moraes & Toquinho', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b5/59/6f/b5596f52-12c4-725d-268c-7c4131c66fbd/06UMGIM34429.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:973133665', title: 'Pot-Pourri: De Bem Com Deus / Seja Mais Você / Volta de Vez Pra Mim', artist: 'Péricles', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/1c/d8/9c/1cd89ce5-b036-5b06-6ee1-46530c58b9ea/889176629990.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:439636358', title: 'O Bem', artist: 'Arlindo Cruz', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d3/91/7f/d3917f1d-4eac-d966-2828-02e97fbc8cd5/mzi.jvpyhajo.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:354579342', title: 'Maria Maria (feat. The Product G&B) [Radio Mix]', artist: 'Santana', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/f5/97/4c/f5974c1e-06cb-f84c-1da9-5f7505a20a0c/mzi.etsqfvqq.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:907208491', title: 'Somente Sombras (feat. Zeca Pagodinho)', artist: 'Arlindo Cruz', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/4b/b5/a1/4bb5a1b3-670c-0caa-5c49-5662ec795e25/886444745970.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:713177299', title: 'Estate', artist: 'Bruno Martino', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/33/56/73/335673d5-20e2-1746-9bc1-d4460c89e9e7/00724359822150.jpg/600x600bb.jpg' },
    ],
  },
  {
    weekOf: '2026-03-09',
    region: 'Middle East',
    flag: '🕌',
    searchTerms: ['Arabic pop', 'khaleeji', 'Fairuz'],
    description: 'Arabic pop, khaleeji & oud',
  },
  {
    weekOf: '2026-03-16',
    region: 'India',
    flag: '🇮🇳',
    searchTerms: ['Bollywood', 'A.R. Rahman', 'Carnatic'],
    description: 'Bollywood, Carnatic & A.R. Rahman',
  },
  {
    weekOf: '2026-03-23',
    region: 'Japan',
    flag: '🇯🇵',
    searchTerms: ['city pop Japan', 'J-jazz', 'kayokyoku'],
    description: 'City pop, J-jazz & kayōkyoku',
  },
  {
    weekOf: '2026-03-30',
    region: 'West Africa',
    flag: '🌍',
    searchTerms: ['Afrobeats', 'highlife Ghana', 'Burna Boy'],
    description: 'Afrobeats, highlife & griot',
  },
  {
    weekOf: '2026-04-06',
    region: 'Jamaica',
    flag: '🇯🇲',
    searchTerms: ['reggae', 'dancehall', 'Bob Marley'],
    description: 'Reggae, dancehall & roots',
  },
  {
    weekOf: '2026-04-13',
    region: 'Colombia',
    flag: '🇨🇴',
    searchTerms: ['cumbia', 'vallenato', 'Carlos Vives'],
    description: 'Cumbia, vallenato & tropical',
  },
  {
    weekOf: '2026-04-20',
    region: 'South Korea',
    flag: '🇰🇷',
    searchTerms: ['K-indie', 'Korean jazz', 'IU'],
    description: 'K-indie, jazz & Korean soul',
  },
  {
    weekOf: '2026-04-27',
    region: 'Mali',
    flag: '🇲🇱',
    searchTerms: ['Mali kora', 'Toumani Diabate', 'desert blues'],
    description: 'Kora, desert blues & griot',
  },
  {
    weekOf: '2026-05-04',
    region: 'Cuba',
    flag: '🇨🇺',
    searchTerms: ['salsa cubana', 'son cubano', 'Buena Vista Social Club'],
    description: 'Salsa, son & habanera',
  },
  {
    weekOf: '2026-05-11',
    region: 'Portugal',
    flag: '🇵🇹',
    searchTerms: ['fado', 'Amalia Rodrigues', 'Portuguese jazz'],
    description: 'Fado, mourning & longing',
  },
  {
    weekOf: '2026-05-18',
    region: 'Ethiopia',
    flag: '🇪🇹',
    searchTerms: ['ethiojazz', 'Mulatu Astatke', 'Tigrinya music'],
    description: 'Ethiojazz, pentatonic & groove',
  },
];

/**
 * Returns the active WorldMusicWeek for the current date.
 * Falls back to the most recent past week if today is past all scheduled weeks.
 */
export function getCurrentWorldMusicWeek(): WorldMusicWeek {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent week whose start is ≤ today
  let active = WORLD_MUSIC_SCHEDULE[0];
  for (const week of WORLD_MUSIC_SCHEDULE) {
    const weekStart = new Date(week.weekOf + 'T00:00:00');
    if (weekStart <= today) {
      active = week;
    } else {
      break;
    }
  }
  return active;
}
