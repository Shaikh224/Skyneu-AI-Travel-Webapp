import { client } from './sanity'

// Aviation Guides
export async function getAviationGuides() {
  return client.fetch(`*[_type == "guide"]{
    _id,
    title,
    slug,
    excerpt,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    category,
    difficulty,
    tags,
    readingTime,
    publishedAt,
    featured,
    featuredImage{
      asset->{
        _id,
        url
      },
      alt
    },
    "seo": seo{
      metaTitle,
      metaDescription
    }
  } | order(publishedAt desc)`)
}

// Get single aviation guide
export async function getAviationGuide(slug: string) {
  return client.fetch(`*[_type == "guide" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    excerpt,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    category,
    difficulty,
    tags,
    readingTime,
    publishedAt,
    featured,
    featuredImage{
      asset->{
        _id,
        url
      },
      alt
    },
    "seo": seo{
      metaTitle,
      metaDescription
    }
  }`, { slug })
}

// Airplane Guides
export async function getAirplaneGuides() {
  return client.fetch(`*[_type == "airplaneGuide"]{
    _id,
    title,
    slug,
    manufacturer,
    model,
    category,
    specifications,
    publishedAt,
    featured,
    images[]{
      asset->{
        _id,
        url
      },
      alt,
      caption
    }
  } | order(publishedAt desc)`)
}

// Get single airplane guide
export async function getAirplaneGuide(slug: string) {
  return client.fetch(`*[_type == "airplaneGuide" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    manufacturer,
    model,
    description,
    category,
    specifications,
    publishedAt,
    featured,
    tags,
    images[]{
      asset->{
        _id,
        url
      },
      alt,
      caption
    }
  }`, { slug })
}

// Travel Guides
export async function getTravelGuides() {
  return client.fetch(`*[_type == "travelGuide"]{
    _id,
    title,
    slug,
    city,
    country,
    content,
    tips,
    category,
    difficulty,
    bestTimeToVisit,
    estimatedCost,
    tags,
    publishedAt,
    featured,
    images[]{
      asset->{
        _id,
        url
      },
      alt,
      caption
    }
  } | order(publishedAt desc)`)
}

// Get single travel guide
export async function getTravelGuide(slug: string) {
  return client.fetch(`*[_type == "travelGuide" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    city,
    country,
    content,
    tips,
    category,
    difficulty,
    bestTimeToVisit,
    estimatedCost,
    tags,
    publishedAt,
    featured,
    images[]{
      asset->{
        _id,
        url
      },
      alt,
      caption
    }
  }`, { slug })
}

// Airport Information
export async function getAirports() {
  return client.fetch(`*[_type == "airportInfo"]{
    _id,
    name,
    code,
    city,
    country,
    description[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    services,
    terminals,
    transportation,
    lounges,
    images[]{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    category,
    tags,
    publishedAt,
    featured
  } | order(publishedAt desc)`)
}

// Get single airport
export async function getAirport(code: string) {
  const result = await client.fetch(`*[_type == "airportInfo" && code == $code][0]{
    _id,
    name,
    code,
    city,
    country,
    description[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    services,
    terminals,
    transportation,
    lounges,
    images[]{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    featuredImage{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    mainImage{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    photo{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    photos[]{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    media{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    category,
    tags,
    publishedAt,
    featured
  }`, { code })
  
  return result
}


// Knowledge Tests/Quizzes
export async function getKnowledgeTests() {
  return client.fetch(`*[_type == "knowledgeTest"]{
    _id,
    title,
    description,
    category,
    difficulty,
    questions,
    timeLimit,
    passingScore,
    featured
  } | order(_createdAt desc)`)
}

// Aviation Quizzes
export async function getQuizzes() {
  return client.fetch(`*[_type == "quiz"]{
    _id,
    question,
    options,
    correctAnswer,
    explanation,
    category,
    difficulty,
    tags,
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    points,
    timeLimit,
    publishedAt,
    featured
  } | order(publishedAt desc)`)
}

export async function getQuiz(id: string) {
  return client.fetch(`*[_type == "quiz" && _id == $id][0]{
    _id,
    question,
    options,
    correctAnswer,
    explanation,
    category,
    difficulty,
    tags,
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    points,
    timeLimit,
    publishedAt,
    featured
  }`, { id })
}

export async function getFeaturedQuizzes() {
  return client.fetch(`*[_type == "quiz" && featured == true]{
    _id,
    question,
    options,
    correctAnswer,
    explanation,
    category,
    difficulty,
    tags,
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    points,
    timeLimit,
    publishedAt,
    featured
  } | order(publishedAt desc)[0...6]`)
}

// Resources
export async function getResources() {
  return client.fetch(`*[_type == "resource"]{
    _id,
    title,
    slug,
    description,
    type,
    url,
    file{
      asset->{
        _id,
        url,
        originalFilename,
        size
      }
    },
    thumbnail{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    featuredImage{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    category,
    difficulty,
    tags,
    author,
    cost,
    rating,
    featured,
    publishedAt
  } | order(publishedAt desc)`)
}

export async function getResource(slug: string) {
  return client.fetch(`*[_type == "resource" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    description,
    type,
    url,
    file{
      asset->{
        _id,
        url,
        originalFilename,
        size
      }
    },
    thumbnail{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    featuredImage{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    category,
    difficulty,
    tags,
    author,
    cost,
    rating,
    featured,
    publishedAt,
    seo
  }`, { slug })
}

export async function getFeaturedResources() {
  return client.fetch(`*[_type == "resource" && featured == true]{
    _id,
    title,
    slug,
    description,
    type,
    url,
    file{
      asset->{
        _id,
        url,
        originalFilename,
        size
      }
    },
    thumbnail{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    image{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    featuredImage{
      ...,
      asset->{
        _id,
        url,
        originalFilename
      }
    },
    category,
    difficulty,
    tags,
    author,
    cost,
    rating,
    featured,
    publishedAt
  } | order(publishedAt desc)[0...6]`)
}

// Travel Advisories
export async function getTravelAdvisories() {
  return client.fetch(`*[_type == "travelAdvisory"]{
    _id,
    title,
    slug,
    country,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    category,
    severity,
    effectiveDate,
    expiryDate,
    source,
    sourceUrl,
    affectedRegions,
    recommendations[]{
      action,
      description
    },
    emergencyContacts[]{
      name,
      phone,
      email,
      website
    },
    tags,
    publishedAt,
    featured
  } | order(publishedAt desc)`)
}

export async function getTravelAdvisory(slug: string) {
  return client.fetch(`*[_type == "travelAdvisory" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    country,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    category,
    severity,
    effectiveDate,
    expiryDate,
    source,
    sourceUrl,
    affectedRegions,
    recommendations[]{
      action,
      description
    },
    emergencyContacts[]{
      name,
      phone,
      email,
      website
    },
    tags,
    publishedAt,
    featured
  }`, { slug })
}

export async function getFeaturedTravelAdvisories() {
  return client.fetch(`*[_type == "travelAdvisory" && featured == true]{
    _id,
    title,
    slug,
    country,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    category,
    severity,
    effectiveDate,
    expiryDate,
    source,
    sourceUrl,
    affectedRegions,
    recommendations[]{
      action,
      description
    },
    emergencyContacts[]{
      name,
      phone,
      email,
      website
    },
    tags,
    publishedAt,
    featured
  } | order(publishedAt desc)[0...6]`)
}

// Latest News
export async function getNewsArticles() {
  return client.fetch(`*[_type == "latestNews"]{
    _id,
    title,
    slug,
    source,
    excerpt,
    author,
    publishedAt,
    category,
    image{
      asset->{
        _id,
        url
      },
      alt,
      caption
    },
    url,
    tags,
    featured,
    breaking,
    "seo": seo{
      metaTitle,
      metaDescription
    }
  } | order(publishedAt desc)`)
}

// Get single news article by slug
export async function getNewsArticle(slug: string) {
  return client.fetch(`*[_type == "latestNews" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    source,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    excerpt,
    author,
    publishedAt,
    category,
    image{
      asset->{
        _id,
        url
      },
      alt,
      caption
    },
    url,
    tags,
    featured,
    breaking,
    "seo": seo{
      metaTitle,
      metaDescription
    }
  }`, { slug })
}

// Get single news article by ID (for backward compatibility)
export async function getNewsArticleById(id: string) {
  return client.fetch(`*[_type == "latestNews" && _id == $id][0]{
    _id,
    title,
    slug,
    source,
    content[]{
      ...,
      _type == "image" => {
        ...,
        asset->{
          _id,
          url
        }
      }
    },
    excerpt,
    author,
    publishedAt,
    category,
    image{
      asset->{
        _id,
        url
      },
      alt,
      caption
    },
    url,
    tags,
    featured,
    breaking,
    "seo": seo{
      metaTitle,
      metaDescription
    }
  }`, { id })
}

// Featured Content
export async function getFeaturedContent() {
  const [guides, airplaneGuides, travelGuides, airports, newsArticles, quizzes, resources, travelAdvisories] = await Promise.all([
    client.fetch(`*[_type == "guide" && featured == true]{
      _id,
      title,
      slug,
      excerpt,
      content[]{
        ...,
        _type == "image" => {
          ...,
          asset->{
            _id,
            url
          }
        }
      },
      category,
      difficulty,
      readingTime,
      publishedAt,
      featuredImage{
        asset->{
          _id,
          url
        },
        alt
      }
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "airplaneGuide" && featured == true]{
      _id,
      title,
      slug,
      manufacturer,
      model,
      category,
      images[]{
        asset->{
          _id,
          url
        },
        alt
      },
      publishedAt
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "travelGuide" && featured == true]{
      _id,
      title,
      city,
      country,
      content,
      tips,
      category,
      difficulty,
      bestTimeToVisit,
      estimatedCost,
      tags,
      images[]{
        asset->{
          _id,
          url
        },
        alt,
        caption
      },
      publishedAt
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "airportInfo" && featured == true]{
      _id,
      name,
      code,
      city,
      country,
      category,
      images{
        asset->{
          _id,
          url
        },
        alt,
        caption
      },
      publishedAt
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "latestNews" && featured == true]{
      _id,
      title,
      slug,
      source,
      excerpt,
      author,
      publishedAt,
      category,
      image{
        asset->{
          _id,
          url
        },
        alt,
        caption
      },
      url,
      breaking
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "quiz" && featured == true]{
      _id,
      question,
      options,
      correctAnswer,
      explanation,
      category,
      difficulty,
      tags,
      image{
        asset->{
          _id,
          url
        },
        alt
      },
      points,
      timeLimit,
      publishedAt,
      featured
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "resource" && featured == true]{
      _id,
      title,
      slug,
      description,
      type,
      url,
      file{
        asset->{
          _id,
          url,
          originalFilename,
          size
        }
      },
      thumbnail{
        asset->{
          _id,
          url
        },
        alt
      },
      image{
        asset->{
          _id,
          url
        },
        alt
      },
      featuredImage{
        asset->{
          _id,
          url
        },
        alt
      },
      category,
      difficulty,
      tags,
      author,
      cost,
      rating,
      featured,
      publishedAt
    } | order(publishedAt desc)[0...3]`),
    
    client.fetch(`*[_type == "travelAdvisory" && featured == true]{
      _id,
      title,
      slug,
      country,
      content[]{
        ...,
        _type == "image" => {
          ...,
          asset->{
            _id,
            url
          }
        }
      },
      category,
      severity,
      effectiveDate,
      expiryDate,
      source,
      sourceUrl,
      affectedRegions,
      recommendations[]{
        action,
        description
      },
      emergencyContacts[]{
        name,
        phone,
        email,
        website
      },
      tags,
      publishedAt,
      featured
    } | order(publishedAt desc)[0...3]`)
  ])
  
  return { 
    guides, 
    airplaneGuides, 
    travelGuides, 
    airports, 
    newsArticles,
    quizzes,
    resources,
    travelAdvisories
  }
}

// Search Function
export async function searchContent(query: string) {
  return client.fetch(`{
    "articles": *[_type == "article" && (title match $query || excerpt match $query || tags[] match $query)]{
      _id, title, slug, excerpt, category, publishedAt, featuredImage{
        asset->{url}, alt
      }
    },
    "airplaneGuides": *[_type == "airplaneGuide" && (title match $query || manufacturer match $query || model match $query)]{
      _id, title, slug, manufacturer, model, publishedAt, images[0]{
        asset->{url}, alt
      }
    },
    "travelGuides": *[_type == "travelGuide" && (title match $query || city match $query || country match $query)]{
      _id, title, city, country, category, publishedAt, images[0]{
        asset->{url}, alt, caption
      }
    },
    "airports": *[_type == "airportInfo" && (name match $query || city match $query || code match $query || country match $query)]{
      _id, name, code, city, country, category, images[]{
        asset->{url}, alt, caption
      }, photos[]{
        asset->{url}, alt, caption
      }, image{
        asset->{url}, alt
      }, featuredImage{
        asset->{url}, alt
      }, mainImage{
        asset->{url}, alt
      }
    },
    "newsArticles": *[_type == "latestNews" && (title match $query || excerpt match $query || tags[] match $query)]{
      _id, title, slug, source, excerpt, publishedAt, category, breaking, image{
        asset->{url}, alt
      }
    }
  }`, { query: `*${query}*` })
}

// Roadmap Queries
export async function getRoadmapItems() {
  return client.fetch(`*[_type == "roadmap" && public == true]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    title,
    slug,
    description,
    status,
    priority,
    category,
    progress,
    timeline,
    assignee,
    tags,
    public,
    featured,
    estimatedEffort
  } | order(priority desc, _createdAt desc)`)
}

export async function getRoadmapItem(slug: string) {
  return client.fetch(`*[_type == "roadmap" && slug.current == $slug && public == true][0]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    title,
    slug,
    description,
    status,
    priority,
    category,
    progress,
    timeline,
    assignee,
    dependencies,
    acceptanceCriteria,
    userStories,
    technicalNotes,
    tags,
    public,
    featured,
    estimatedEffort
  }`, { slug })
}

export async function getFeaturedRoadmapItems() {
  return client.fetch(`*[_type == "roadmap" && featured == true && public == true]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    title,
    slug,
    description,
    status,
    priority,
    category,
    progress,
    timeline,
    assignee,
    tags,
    public,
    featured,
    estimatedEffort
  } | order(priority desc, _createdAt desc)[0...3]`)
}

// Changelog Queries
export async function getChangelogItems() {
  return client.fetch(`*[_type == "changelog" && published == true]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    version,
    releaseDate,
    title,
    description,
    changes,
    migrationNotes,
    downloadLinks,
    published,
    featured
  } | order(releaseDate desc)`)
}

export async function getChangelogItem(version: string) {
  return client.fetch(`*[_type == "changelog" && version == $version && published == true][0]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    version,
    releaseDate,
    title,
    description,
    changes,
    migrationNotes,
    downloadLinks,
    published,
    featured
  }`, { version })
}

export async function getFeaturedChangelogItems() {
  return client.fetch(`*[_type == "changelog" && featured == true && published == true]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    version,
    releaseDate,
    title,
    description,
    changes,
    migrationNotes,
    downloadLinks,
    published,
    featured
  } | order(releaseDate desc)[0...3]`)
}

export async function getLatestChangelogItem() {
  return client.fetch(`*[_type == "changelog" && published == true] | order(releaseDate desc)[0]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    version,
    releaseDate,
    title,
    description,
    changes,
    migrationNotes,
    downloadLinks,
    published,
    featured
  }`)
}

// Announcement Queries
export async function getActiveAnnouncements(currentPage: string = 'all') {
  try {
    const now = new Date().toISOString();
    
    return await client.fetch(`*[_type == "announcement" && active == true && startDate <= $now && (!endDate || endDate >= $now) && ($currentPage in showOnPages || "all" in showOnPages)]{
      _id,
      _type,
      _createdAt,
      _updatedAt,
      title,
      message,
      type,
      priority,
      actionButton,
      dismissible,
      showOnPages,
      startDate,
      endDate,
      active,
      backgroundColor,
      customCSS
    } | order(priority desc, startDate desc)`, { 
      now, 
      currentPage 
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return []; // Return empty array if query fails
  }
}

export async function getAnnouncementById(id: string) {
  return client.fetch(`*[_type == "announcement" && _id == $id][0]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    title,
    message,
    type,
    priority,
    actionButton,
    dismissible,
    showOnPages,
    startDate,
    endDate,
    active,
    backgroundColor,
    customCSS
  }`, { id })
}

export async function getCriticalAnnouncements() {
  const now = new Date().toISOString();
  
  return client.fetch(`*[_type == "announcement" && active == true && priority == "critical" && startDate <= $now && (!endDate || endDate >= $now)]{
    _id,
    _type,
    _createdAt,
    _updatedAt,
    title,
    message,
    type,
    priority,
    actionButton,
    dismissible,
    showOnPages,
    startDate,
    endDate,
    active,
    backgroundColor,
    customCSS
  } | order(startDate desc)`, { now })
}

// Get content by tab
export async function getContentByTab(tab: string) {
  switch (tab) {
    case 'guides':
      return getAviationGuides()
    case 'airplanes':
      return getAirplaneGuides()
    case 'travel':
      return getTravelGuides()
    case 'airports':
      return getAirports()
    case 'quizzes':
      return getKnowledgeTests()
    case 'resources':
      return getResources()
    case 'advisories':
      return getTravelAdvisories()
    case 'news':
      return getNewsArticles()
    default:
      return []
  }
}