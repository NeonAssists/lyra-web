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
      { id: 'itunes:trk:1444127573', title: 'A Nível De...', artist: 'João Bosco', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/d6/4a/f1/d64af175-97b8-5b42-e780-f04fba95e539/00731453374928.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:808755045', title: 'Eu Te Devoro (Ao Vivo)', artist: 'Djavan', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d7/28/14/d72814bd-11f4-9ef5-9354-f758f95caa74/886443250871.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1341850272', title: 'Vale a Pena Ouvir de Novo', artist: 'VS', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/36/8d/e5/368de5a4-7986-c910-8755-61718804b92d/0.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:458305598', title: 'Meu Ébano', artist: 'Alcione', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/4b/67/89/4b67890b-0842-3139-de77-fcea5b83f1b7/V4HttpAssetRepositoryClient-ticket.sojlqpts.jpg-7311795440337080434.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1445041050', title: 'Pé Na Areia', artist: 'Diogo Nogueira', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/65/fb/42/65fb42cf-6e90-ce49-a5ce-1ba1d273c88c/16UMGIM60916.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1443084867', title: 'A Sós', artist: 'Arlindo Cruz & Arlindo Neto', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/d5/60/24/d56024eb-d3d5-c073-f873-fab793564274/00602557356854.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:439636358', title: 'O Bem', artist: 'Arlindo Cruz', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d3/91/7f/d3917f1d-4eac-d966-2828-02e97fbc8cd5/mzi.jvpyhajo.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1361081880', title: 'Maria Maria', artist: 'Milton Nascimento', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0b/59/ef/0b59ef5d-a254-cbd2-7628-537cb9fc1d27/18UMGIM13930.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:973133665', title: 'Pot-Pourri: De Bem Com Deus / Seja Mais Você / Volta de Vez Pra Mim', artist: 'Péricles', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/1c/d8/9c/1cd89ce5-b036-5b06-6ee1-46530c58b9ea/889176629990.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:1576606260', title: 'Samba Da Volta', artist: 'Vinicius De Moraes & Toquinho', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/2c/ec/6f/2cec6f06-c9c8-e228-f507-16563cbacebe/21UMGIM63750.rgb.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:404520901', title: 'Estate', artist: 'João Gilberto', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music/63/15/75/mzi.zlcacvwt.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:379515281', title: 'Flor de Lis', artist: 'Djavan', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music3/v4/fd/23/3d/fd233dfa-51de-4111-a063-25e3fe51c56b/dj.vzveqtxn.jpg/600x600bb.jpg' },
      { id: 'itunes:trk:907208491', title: 'Somente Sombras (feat. Zeca Pagodinho)', artist: 'Arlindo Cruz', artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/4b/b5/a1/4bb5a1b3-670c-0caa-5c49-5662ec795e25/886444745970.jpg/600x600bb.jpg' },
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
