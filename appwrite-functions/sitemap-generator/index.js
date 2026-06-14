const { createClient } = require('@sanity/client');
const { Client, Databases, Storage } = require('node-appwrite');

// Sanity client
const sanityClient = createClient({
  projectId: 'qw48169l',
  dataset: 'production',
  apiVersion: '2023-12-01',
  useCdn: false,
});

const baseUrl = 'https://skyneu.com';

module.exports = async ({ req, res, log, error }) => {
  try {
    log('🚀 Starting dynamic sitemap generation...');

    // Fetch all content from Sanity CMS
    log('📡 Fetching content from Sanity CMS...');
    
    const [guides, aircraft, news, airports, travelGuides, advisories, quizzes, resources] = await Promise.all([
      sanityClient.fetch(`*[_type == "guide" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        category,
        title
      } | order(_updatedAt desc)`),
      
      sanityClient.fetch(`*[_type == "airplaneGuide" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        category,
        title,
        manufacturer
      } | order(_updatedAt desc)`),
      
      sanityClient.fetch(`*[_type == "newsArticle" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        publishedAt,
        category,
        title,
        breaking
      } | order(publishedAt desc)`),
      
      sanityClient.fetch(`*[_type == "airport" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        name,
        iataCode
      } | order(_updatedAt desc)`),
      
      sanityClient.fetch(`*[_type == "travelGuide" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        city,
        country
      } | order(_updatedAt desc)`),
      
      sanityClient.fetch(`*[_type == "travelAdvisory" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        category,
        country,
        severity
      } | order(_updatedAt desc)`),
      
      sanityClient.fetch(`*[_type == "quiz" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        title,
        category
      } | order(_updatedAt desc)`),
      
      sanityClient.fetch(`*[_type == "resource" && !(_id in path("drafts.**"))]{ 
        "slug": slug.current, 
        _updatedAt,
        title,
        type
      } | order(_updatedAt desc)`)
    ]);

    log(`✅ Fetched content:
    - Guides: ${guides.length}
    - Aircraft: ${aircraft.length}
    - News: ${news.length}
    - Airports: ${airports.length}
    - Travel Guides: ${travelGuides.length}
    - Advisories: ${advisories.length}
    - Quizzes: ${quizzes.length}
    - Resources: ${resources.length}`);

    const now = new Date().toISOString().split('T')[0];

    // Helper function to escape XML
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Generate sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- ============================================ -->
  <!-- STATIC PAGES -->
  <!-- ============================================ -->
  
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${baseUrl}/aviation-education</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>

  <url>
    <loc>${baseUrl}/features</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/pricing</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/flights</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/visa</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>${baseUrl}/roadmap</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/changelog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${baseUrl}/profile</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>

  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
`;

    // Aviation Guides
    if (guides.length > 0) {
      xml += `\n  <!-- Aviation Guides (${guides.length}) -->\n`;
      guides.forEach(guide => {
        if (guide.slug) {
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/guide/' + guide.slug)}</loc>
    <lastmod>${guide._updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      });
    }

    // Aircraft
    if (aircraft.length > 0) {
      xml += `\n  <!-- Aircraft Library (${aircraft.length}) -->\n`;
      aircraft.forEach(plane => {
        if (plane.slug) {
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/aircraft/' + plane.slug)}</loc>
    <lastmod>${plane._updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      });
    }

    // Aviation News with News Schema
    if (news.length > 0) {
      xml += `\n  <!-- Aviation News (${news.length}) -->\n`;
      news.forEach(article => {
        if (article.slug) {
          const pubDate = article.publishedAt || article._updatedAt;
          const isRecent = new Date(pubDate) > new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
          
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/news/' + article.slug)}</loc>
    <lastmod>${article._updatedAt.split('T')[0]}</lastmod>
    <changefreq>${isRecent ? 'hourly' : 'daily'}</changefreq>
    <priority>${article.breaking ? 0.95 : 0.9}</priority>`;
          
          // Add Google News schema for recent articles
          if (isRecent && article.title) {
            xml += `
    <news:news>
      <news:publication>
        <news:name>AviHub</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>`;
          }
          
          xml += `
  </url>
`;
        }
      });
    }

    // Airports
    if (airports.length > 0) {
      xml += `\n  <!-- Airports (${airports.length}) -->\n`;
      airports.forEach(airport => {
        if (airport.slug) {
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/airport/' + airport.slug)}</loc>
    <lastmod>${airport._updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      });
    }

    // Travel Guides
    if (travelGuides.length > 0) {
      xml += `\n  <!-- Travel Guides (${travelGuides.length}) -->\n`;
      travelGuides.forEach(guide => {
        if (guide.slug) {
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/travel-guide/' + guide.slug)}</loc>
    <lastmod>${guide._updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      });
    }

    // Travel Advisories
    if (advisories.length > 0) {
      xml += `\n  <!-- Travel Advisories (${advisories.length}) -->\n`;
      advisories.forEach(advisory => {
        if (advisory.slug) {
          const isCritical = advisory.severity === 'critical' || advisory.severity === 'high';
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/advisory/' + advisory.slug)}</loc>
    <lastmod>${advisory._updatedAt.split('T')[0]}</lastmod>
    <changefreq>${isCritical ? 'hourly' : 'daily'}</changefreq>
    <priority>${isCritical ? 0.9 : 0.85}</priority>
  </url>
`;
        }
      });
    }

    // Quizzes
    if (quizzes.length > 0) {
      xml += `\n  <!-- Quizzes (${quizzes.length}) -->\n`;
      quizzes.forEach(quiz => {
        if (quiz.slug) {
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/quiz/' + quiz.slug)}</loc>
    <lastmod>${quiz._updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      });
    }

    // Resources
    if (resources.length > 0) {
      xml += `\n  <!-- Resources (${resources.length}) -->\n`;
      resources.forEach(resource => {
        if (resource.slug) {
          xml += `  <url>
    <loc>${escapeXml(baseUrl + '/resource/' + resource.slug)}</loc>
    <lastmod>${resource._updatedAt.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      });
    }

    xml += `\n</urlset>`;

    const totalUrls = guides.length + aircraft.length + news.length + airports.length + 
                      travelGuides.length + advisories.length + quizzes.length + resources.length + 12;

    log(`✅ Sitemap generated! Total URLs: ${totalUrls}`);

    // Ping Google to index
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(baseUrl + '/sitemap.xml')}`;
      const pingResponse = await fetch(pingUrl);
      log(`🔔 Google pinged: ${pingResponse.status}`);
    } catch (e) {
      log('⚠️ Could not ping Google');
    }

    // Return XML with proper headers
    return res.send(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      'X-Total-URLs': totalUrls.toString(),
      'X-Generated': new Date().toISOString()
    });

  } catch (err) {
    error('❌ Sitemap generation failed:', err);
    return res.json({
      error: 'Failed to generate sitemap',
      message: err.message
    }, 500);
  }
};
