export interface AirplaneGuide extends SanityDocument {
  _type: 'airplaneGuide';
  title: string;
  slug: { current: string };
  manufacturer: string;
  model: string;
  description: any[];
  specifications?: {
    maxPassengers?: number;
    range?: number;
    cruiseSpeed?: number;
    maxAltitude?: number;
    engines?: number;
    engineType?: string;
  };
  images?: Array<{
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  }>;
  category: string;
  tags?: string[];
  publishedAt: string;
  featured?: boolean;
}
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export interface Article extends SanityDocument {
  _type: 'article';
  title: string;
  slug: { current: string };
  excerpt?: string;
  content: any[];
  author?: string;
  publishedAt: string;
  category: string;
  tags?: string[];
  featured?: boolean;
  featuredImage?: string;
  readTime?: number;
}

export interface Guide extends SanityDocument {
  _type: 'guide';
  title: string;
  slug: { current: string };
  excerpt?: string;
  content: any[];
  featuredImage?: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  category: string;
  difficulty: string;
  tags?: string[];
  readingTime?: number;
  publishedAt: string;
  featured?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export interface AviationGuide extends SanityDocument {
  _type: 'aviationGuide';
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  content: any[];
  tags?: string[];
  thumbnail?: string;
  downloadUrl?: string;
}

export interface Aircraft extends SanityDocument {
  _type: 'aircraft';
  name: string;
  manufacturer: string;
  type: string;
  category: string;
  description: string;
  specifications: {
    length?: string;
    wingspan?: string;
    height?: string;
    maxSpeed?: string;
    range?: string;
    capacity?: string;
  };
  images?: string[];
  firstFlight?: string;
  inService?: boolean;
}

export interface TravelGuide extends SanityDocument {
  _type: 'travelGuide';
  title: string;
  slug?: { current: string };
  destination?: string;
  city?: string;
  country: string;
  description?: string;
  content?: any[];
  bestTimeToVisit?: string;
  estimatedCost?: string;
  category?: string;
  difficulty?: string;
  activities?: string[];
  tips?: string[];
  images?: Array<{
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  }>;
  tags?: string[];
  rating?: number;
  featured?: boolean;
  publishedAt?: string;
}

export interface Airport extends SanityDocument {
  _type: 'airport' | 'airportInfo';
  name: string;
  code: string;
  city: string;
  country: string;
  description?: any[];
  services?: string[];
  facilities?: string[];
  terminals?: number | string | Array<{
    name: string;
    description: string;
    airlines: string[];
  }>;
  transportation?: string[] | Array<{
    type: string;
    description: string;
    estimatedCost: string;
    duration: string;
  }>;
  lounges?: string[] | Array<{
    name: string;
    location: string;
    access: string;
    amenities: string[];
  }>;
  coordinates?: {
    lat: number;
    lng: number;
  };
  runways?: number;
  images?: Array<{
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  }>;
  image?: {
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  };
  featuredImage?: {
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  };
  mainImage?: {
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  };
  photo?: {
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  };
  photos?: Array<{
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  }>;
  media?: {
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  };
  category?: string;
  tags?: string[];
  publishedAt?: string;
  featured?: boolean;
}

export interface KnowledgeTest extends SanityDocument {
  _type: 'knowledgeTest';
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
  timeLimit?: number;
  passingScore?: number;
}

export interface Resource extends SanityDocument {
  _type: 'resource';
  title: string;
  type: 'document' | 'video' | 'podcast' | 'tool' | 'website';
  description: string;
  url?: string;
  downloadUrl?: string;
  category: string;
  tags?: string[];
  thumbnail?: string;
  featured?: boolean;
}

export interface TravelAdvisory extends SanityDocument {
  _type: 'travelAdvisory';
  title: string;
  country: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: string[];
  lastUpdated: string;
  validUntil?: string;
  source: string;
}

export interface NewsArticle extends SanityDocument {
  _type: 'newsArticle' | 'latestNews';
  title: string;
  slug?: { current: string };
  excerpt?: string;
  content?: any[];
  author?: string;
  source?: string;
  publishedAt: string;
  category: string;
  tags?: string[];
  featured?: boolean;
  breaking?: boolean;
  image?: {
    asset: { _id: string; url: string };
    alt?: string;
    caption?: string;
  };
  url?: string;
  externalUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export interface RoadmapItem extends SanityDocument {
  _type: 'roadmap';
  title: string;
  slug: { current: string };
  description: string;
  status: 'planned' | 'in-progress' | 'in-review' | 'testing' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'feature' | 'enhancement' | 'bugfix' | 'performance' | 'security' | 'ui-ux' | 'api' | 'infrastructure';
  progress: number;
  timeline?: {
    startDate?: string;
    targetDate?: string;
    actualDate?: string;
    quarter?: string;
  };
  assignee?: string;
  dependencies?: Array<{ _ref: string; _type: 'reference' }>;
  acceptanceCriteria?: Array<{
    description: string;
    completed: boolean;
  }>;
  userStories?: Array<{
    story: string;
    priority?: 'must-have' | 'should-have' | 'could-have' | 'wont-have';
  }>;
  technicalNotes?: any[];
  tags?: string[];
  public: boolean;
  featured: boolean;
  estimatedEffort?: 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
}

export interface ChangelogItem extends SanityDocument {
  _type: 'changelog';
  version: string;
  releaseDate: string;
  title?: string;
  description?: string;
  changes: Array<{
    type: 'feature' | 'improvement' | 'bugfix' | 'security' | 'breaking' | 'deprecation';
    title: string;
    description?: string;
    impact?: 'high' | 'medium' | 'low';
    affectedAreas?: string[];
  }>;
  migrationNotes?: any[];
  downloadLinks?: Array<{
    platform: 'ios' | 'android' | 'web' | 'desktop' | 'api';
    url: string;
    size?: string;
  }>;
  published: boolean;
  featured: boolean;
}

export interface Announcement extends SanityDocument {
  _type: 'announcement';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'feature' | 'maintenance' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionButton?: {
    text: string;
    url: string;
    openInNewTab: boolean;
  };
  dismissible: boolean;
  showOnPages: string[];
  startDate: string;
  endDate?: string;
  active: boolean;
  backgroundColor: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  customCSS?: string;
}

