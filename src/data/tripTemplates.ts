export interface TripTemplate {
  id: string;
  name: string;
  description: string;
  category: 'leisure' | 'business' | 'adventure' | 'family' | 'romantic' | 'cultural';
  icon: string;
  duration: number; // in days
  destination: string;
  budget: number;
  currency: string;
  activities: string[];
  checklist: string[];
  tags: string[];
  isPopular?: boolean;
  isBusiness?: boolean;
}

export const tripTemplates: TripTemplate[] = [
  // Business Templates
  {
    id: 'business-conference',
    name: 'Business Conference',
    description: 'Professional conference trip with meetings and networking',
    category: 'business',
    icon: '💼',
    duration: 3,
    destination: 'San Francisco, CA',
    budget: 2500,
    currency: 'USD',
    activities: [
      'Conference registration',
      'Keynote presentations',
      'Networking sessions',
      'Business dinners',
      'City tour',
      'Airport transfers'
    ],
    checklist: [
      'Book conference tickets',
      'Reserve business hotel',
      'Prepare presentation materials',
      'Schedule client meetings',
      'Pack business attire',
      'Download conference app',
      'Check visa requirements',
      'Arrange airport pickup'
    ],
    tags: ['professional', 'networking', 'conference', 'meetings'],
    isBusiness: true,
    isPopular: true
  },
  {
    id: 'business-client-visit',
    name: 'Client Visit',
    description: 'Visit clients and partners for business meetings',
    category: 'business',
    icon: '🤝',
    duration: 5,
    destination: 'New York, NY',
    budget: 3000,
    currency: 'USD',
    activities: [
      'Client meetings',
      'Site visits',
      'Business lunches',
      'Product demonstrations',
      'Contract negotiations',
      'Cultural activities'
    ],
    checklist: [
      'Schedule client meetings',
      'Prepare business proposals',
      'Book business hotel',
      'Arrange transportation',
      'Pack business cards',
      'Prepare presentation',
      'Check client preferences',
      'Plan cultural activities'
    ],
    tags: ['client', 'meetings', 'negotiations', 'professional'],
    isBusiness: true
  },
  {
    id: 'business-training',
    name: 'Training & Development',
    description: 'Corporate training or professional development program',
    category: 'business',
    icon: '📚',
    duration: 4,
    destination: 'Chicago, IL',
    budget: 2000,
    currency: 'USD',
    activities: [
      'Training sessions',
      'Workshops',
      'Team building',
      'Networking events',
      'City exploration',
      'Group dinners'
    ],
    checklist: [
      'Register for training',
      'Book accommodation',
      'Prepare learning materials',
      'Schedule team activities',
      'Pack comfortable clothes',
      'Download training materials',
      'Plan networking events',
      'Arrange group transportation'
    ],
    tags: ['training', 'development', 'learning', 'team-building'],
    isBusiness: true
  },

  // Leisure Templates
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    description: 'Relaxing beach getaway with sun, sand, and sea',
    category: 'leisure',
    icon: '🏖️',
    duration: 7,
    destination: 'Miami, FL',
    budget: 1500,
    currency: 'USD',
    activities: [
      'Beach relaxation',
      'Water sports',
      'Sunset dinners',
      'Beach volleyball',
      'Snorkeling',
      'Beach walks'
    ],
    checklist: [
      'Book beachfront hotel',
      'Pack swimwear and sunscreen',
      'Reserve water activities',
      'Plan beach dinners',
      'Check weather forecast',
      'Pack beach essentials',
      'Book airport transfer',
      'Research local beaches'
    ],
    tags: ['relaxation', 'beach', 'sun', 'water-sports'],
    isPopular: true
  },
  {
    id: 'city-exploration',
    name: 'City Exploration',
    description: 'Urban adventure exploring museums, restaurants, and attractions',
    category: 'leisure',
    icon: '🏙️',
    duration: 5,
    destination: 'Paris, France',
    budget: 2000,
    currency: 'EUR',
    activities: [
      'Museum visits',
      'City walking tours',
      'Local cuisine',
      'Shopping',
      'Historical sites',
      'Nightlife'
    ],
    checklist: [
      'Book city center hotel',
      'Plan museum visits',
      'Research restaurants',
      'Download city maps',
      'Pack comfortable shoes',
      'Check local events',
      'Book attraction tickets',
      'Learn basic local phrases'
    ],
    tags: ['culture', 'museums', 'food', 'history'],
    isPopular: true
  },
  {
    id: 'mountain-retreat',
    name: 'Mountain Retreat',
    description: 'Peaceful mountain getaway with hiking and nature',
    category: 'leisure',
    icon: '🏔️',
    duration: 6,
    destination: 'Aspen, CO',
    budget: 1800,
    currency: 'USD',
    activities: [
      'Hiking trails',
      'Mountain views',
      'Hot springs',
      'Photography',
      'Local cuisine',
      'Stargazing'
    ],
    checklist: [
      'Book mountain lodge',
      'Pack hiking gear',
      'Check trail conditions',
      'Plan hiking routes',
      'Pack warm clothes',
      'Book hot springs',
      'Check weather forecast',
      'Prepare camera equipment'
    ],
    tags: ['nature', 'hiking', 'mountains', 'relaxation']
  },

  // Adventure Templates
  {
    id: 'adventure-safari',
    name: 'Adventure Safari',
    description: 'Wildlife safari with game drives and nature experiences',
    category: 'adventure',
    icon: '🦁',
    duration: 8,
    destination: 'Serengeti, Tanzania',
    budget: 4000,
    currency: 'USD',
    activities: [
      'Game drives',
      'Wildlife photography',
      'Bush walks',
      'Cultural visits',
      'Sunset safaris',
      'Bird watching'
    ],
    checklist: [
      'Book safari lodge',
      'Get required vaccinations',
      'Pack camera equipment',
      'Book game drives',
      'Check visa requirements',
      'Pack neutral colors',
      'Book airport transfers',
      'Research wildlife seasons'
    ],
    tags: ['wildlife', 'safari', 'adventure', 'photography'],
    isPopular: true
  },
  {
    id: 'hiking-expedition',
    name: 'Hiking Expedition',
    description: 'Multi-day hiking adventure through scenic trails',
    category: 'adventure',
    icon: '🥾',
    duration: 5,
    destination: 'Patagonia, Chile',
    budget: 1200,
    currency: 'USD',
    activities: [
      'Multi-day hiking',
      'Mountain climbing',
      'Camping',
      'Photography',
      'Wildlife spotting',
      'Stargazing'
    ],
    checklist: [
      'Book camping permits',
      'Pack hiking gear',
      'Plan hiking routes',
      'Check weather conditions',
      'Pack emergency supplies',
      'Book guide services',
      'Prepare fitness training',
      'Research trail conditions'
    ],
    tags: ['hiking', 'mountains', 'camping', 'adventure']
  },

  // Family Templates
  {
    id: 'family-theme-park',
    name: 'Family Theme Park',
    description: 'Fun-filled family vacation at theme parks',
    category: 'family',
    icon: '🎢',
    duration: 4,
    destination: 'Orlando, FL',
    budget: 2500,
    currency: 'USD',
    activities: [
      'Theme park visits',
      'Family rides',
      'Character meet & greets',
      'Water parks',
      'Family dinners',
      'Shopping'
    ],
    checklist: [
      'Book theme park tickets',
      'Reserve family hotel',
      'Plan daily schedules',
      'Pack family essentials',
      'Book character dining',
      'Check height requirements',
      'Plan rest days',
      'Pack comfortable shoes'
    ],
    tags: ['family', 'theme-park', 'kids', 'fun']
  },
  {
    id: 'family-beach',
    name: 'Family Beach Trip',
    description: 'Relaxing family beach vacation with activities for all ages',
    category: 'family',
    icon: '👨‍👩‍👧‍👦',
    duration: 6,
    destination: 'Myrtle Beach, SC',
    budget: 1800,
    currency: 'USD',
    activities: [
      'Beach activities',
      'Family games',
      'Water sports',
      'Mini golf',
      'Family dinners',
      'Beach walks'
    ],
    checklist: [
      'Book family resort',
      'Pack beach essentials',
      'Plan family activities',
      'Book water sports',
      'Pack sunscreen',
      'Plan indoor activities',
      'Book family dinners',
      'Check kid-friendly spots'
    ],
    tags: ['family', 'beach', 'kids', 'relaxation']
  },

  // Romantic Templates
  {
    id: 'romantic-getaway',
    name: 'Romantic Getaway',
    description: 'Intimate couple\'s retreat with romantic activities',
    category: 'romantic',
    icon: '💕',
    duration: 4,
    destination: 'Santorini, Greece',
    budget: 2200,
    currency: 'EUR',
    activities: [
      'Sunset dinners',
      'Couple\'s spa',
      'Wine tasting',
      'Romantic walks',
      'Photography sessions',
      'Private tours'
    ],
    checklist: [
      'Book romantic hotel',
      'Reserve sunset dinners',
      'Book couple\'s spa',
      'Plan wine tastings',
      'Pack romantic attire',
      'Book photography session',
      'Plan surprise activities',
      'Check romantic spots'
    ],
    tags: ['romantic', 'couple', 'intimate', 'luxury']
  },
  {
    id: 'honeymoon',
    name: 'Honeymoon',
    description: 'Special honeymoon trip for newlyweds',
    category: 'romantic',
    icon: '💍',
    duration: 10,
    destination: 'Maldives',
    budget: 5000,
    currency: 'USD',
    activities: [
      'Overwater bungalow',
      'Couple\'s massage',
      'Private dinners',
      'Snorkeling',
      'Sunset cruises',
      'Beach relaxation'
    ],
    checklist: [
      'Book overwater bungalow',
      'Plan couple\'s activities',
      'Book private dinners',
      'Pack romantic attire',
      'Book spa treatments',
      'Plan water activities',
      'Book sunset cruises',
      'Check special packages'
    ],
    tags: ['honeymoon', 'luxury', 'romantic', 'exclusive']
  },

  // Cultural Templates
  {
    id: 'cultural-heritage',
    name: 'Cultural Heritage',
    description: 'Immersive cultural experience exploring history and traditions',
    category: 'cultural',
    icon: '🏛️',
    duration: 7,
    destination: 'Rome, Italy',
    budget: 2000,
    currency: 'EUR',
    activities: [
      'Historical sites',
      'Museum visits',
      'Cultural tours',
      'Local cuisine',
      'Art galleries',
      'Traditional performances'
    ],
    checklist: [
      'Book cultural hotel',
      'Plan historical sites',
      'Book guided tours',
      'Research local customs',
      'Pack appropriate attire',
      'Book museum tickets',
      'Learn basic Italian',
      'Plan cultural activities'
    ],
    tags: ['culture', 'history', 'art', 'heritage']
  },
  {
    id: 'food-tour',
    name: 'Food & Wine Tour',
    description: 'Culinary journey exploring local cuisine and beverages',
    category: 'cultural',
    icon: '🍷',
    duration: 5,
    destination: 'Tuscany, Italy',
    budget: 1800,
    currency: 'EUR',
    activities: [
      'Wine tastings',
      'Cooking classes',
      'Food tours',
      'Farm visits',
      'Local markets',
      'Restaurant hopping'
    ],
    checklist: [
      'Book food tours',
      'Reserve cooking classes',
      'Plan wine tastings',
      'Research restaurants',
      'Book farm visits',
      'Pack comfortable clothes',
      'Plan market visits',
      'Check dietary restrictions'
    ],
    tags: ['food', 'wine', 'culinary', 'local-cuisine']
  }
];

export const getTemplatesByCategory = (category: string) => {
  return tripTemplates.filter(template => template.category === category);
};

export const getBusinessTemplates = () => {
  return tripTemplates.filter(template => template.isBusiness);
};

export const getPopularTemplates = () => {
  return tripTemplates.filter(template => template.isPopular);
};

export const getTemplateById = (id: string) => {
  return tripTemplates.find(template => template.id === id);
};
