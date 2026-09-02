export interface CuratedMediaItem {
  id: string;
  title: string;
  category: 'cover' | 'story' | 'venue' | 'avatar' | 'texture';
  url: string;
  thumbnail: string;
  description: string;
}

export const CURATED_WEDDING_MEDIA: CuratedMediaItem[] = [
  // 1. Cover & Hero Imagery
  {
    id: 'cover_como_villa',
    title: 'Villa Balbianello Terrace Sunset',
    category: 'cover',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80',
    description: 'Breathtaking Italian lakefront villa with classical statues and cypress trees.',
  },
  {
    id: 'cover_tuscan_hills',
    title: 'Tuscan Sunset & Olive Grove',
    category: 'cover',
    url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=300&q=80',
    description: 'Golden hour rolling hills with warm terracotta tones and cypress lane.',
  },
  {
    id: 'cover_amalfi_terrace',
    title: 'Amalfi Coast Cliffside Reception',
    category: 'cover',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=300&q=80',
    description: 'Dramatic coastal terrace with candlelit table settings and ocean views.',
  },
  {
    id: 'cover_modern_botanical',
    title: 'Minimalist Botanical Courtyard',
    category: 'cover',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=300&q=80',
    description: 'Warm travertine courtyard with olive tree branches and linen drapery.',
  },

  // 2. Our Story Imagery
  {
    id: 'story_riva_boat',
    title: 'Vintage Mahogany Riva Cruise',
    category: 'story',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&q=80',
    description: 'Classic wooden boat ride across calm azure water.',
  },
  {
    id: 'story_varenna_stroll',
    title: 'Strolling Cobblestone Alleys',
    category: 'story',
    url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80',
    description: 'Intimate walk through historic village streets and pastel facades.',
  },
  {
    id: 'story_champagne_toast',
    title: 'Private Champagne Toast',
    category: 'story',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=300&q=80',
    description: 'Two vintage coupe glasses filled with Franciacorta sparkling wine.',
  },

  // 3. Venue & Architecture
  {
    id: 'venue_villa_facade',
    title: 'Historic Villa del Balbianello',
    category: 'venue',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=300&q=80',
    description: 'Grand historical villa archways overlooking the lake gardens.',
  },
  {
    id: 'venue_botanical_greenhouse',
    title: 'Glass Conservatory & Orangerie',
    category: 'venue',
    url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=300&q=80',
    description: 'Lush glasshouse illuminated by fairy lights and hanging greenery.',
  },
  {
    id: 'venue_stone_chapel',
    title: 'Historic Stone Romanesque Chapel',
    category: 'venue',
    url: 'https://images.unsplash.com/photo-1545232979-fbf6c7a0c644?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1545232979-fbf6c7a0c644?auto=format&fit=crop&w=300&q=80',
    description: 'Ancient stone chapel courtyard surrounded by olive trees.',
  },

  // 4. Textures & Motifs
  {
    id: 'texture_handmade_paper',
    title: 'Handmade Deckled Cotton Paper',
    category: 'texture',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80',
    description: 'Tactile deckled-edge paper texture with subtle organic grain.',
  },
  {
    id: 'texture_botanical_olive',
    title: 'Watercolour Olive Branch Foliage',
    category: 'texture',
    url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=300&q=80',
    description: 'Delicate botanical leaves and natural olive branches on ivory.',
  },

  // 5. Avatars & Wedding Party
  {
    id: 'avatar_maid_of_honor',
    title: 'Maid of Honor Portrait',
    category: 'avatar',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    description: 'Editorial portrait with natural warm lighting.',
  },
  {
    id: 'avatar_best_man',
    title: 'Best Man Portrait',
    category: 'avatar',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    description: 'Sharp tailored portrait with soft bokeh background.',
  },
  {
    id: 'avatar_bridesmaid_1',
    title: 'Bridesmaid Portrait',
    category: 'avatar',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    description: 'Outdoor natural portrait with warm smile.',
  },
  {
    id: 'avatar_groomsman_1',
    title: 'Groomsman Portrait',
    category: 'avatar',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    description: 'Black tie linen attire portrait in soft garden light.',
  },
];
