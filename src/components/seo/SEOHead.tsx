import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schemaData?: object[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

const SEOHead: React.FC<SEOProps> = ({
  title = 'SkyNeu - AI-Powered Travel Planning & Flight Tracking',
  description = 'Discover smarter travel with SkyNeu. Get real-time flight tracking, AI-powered trip planning, visa requirements, and instant travel insights. Start planning your next adventure for just $2.99/month.',
  keywords = 'flight tracker, trip planner, travel planning, visa checker, flight status, travel app, AI travel assistant, flight deals, travel insights, skyneu',
  canonical,
  ogImage = 'https://skyneu.com/og-image.jpg',
  ogType = 'website',
  schemaData = [],
  publishedTime,
  modifiedTime,
  author,
  section
}) => {
  const siteName = 'SkyNeu';
  const twitterHandle = '@skyneuai';

  useEffect(() => {
    // Set document title
    document.title = title;

    // Remove existing meta tags
    const existingMetas = document.querySelectorAll('meta[data-seo="true"]');
    existingMetas.forEach(meta => meta.remove());

    // Remove existing schema scripts
    const existingSchemas = document.querySelectorAll('script[data-schema="true"]');
    existingSchemas.forEach(schema => schema.remove());

    // compute final canonical: prefer prop, else derive from current location (strip query/hash)
    const derivedCanonical = (() => {
      try {
        if (canonical && canonical.length > 0) return canonical;
        if (typeof window !== 'undefined' && window.location) {
          const url = new URL(window.location.href);
          // normalize: origin + pathname (no trailing slash unless root)
          const path = url.pathname.replace(/\/+$/,'');
          return `${url.origin}${path === '' ? '/' : path}`;
        }
      } catch (e) {
        // fallback
      }
      return 'https://skyneu.com';
    })();

    // Add meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'googlebot', content: 'index, follow' },
      { name: 'bingbot', content: 'index, follow' },
      { name: 'language', content: 'English' },
      { name: 'author', content: author || 'SkyNeu' },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: derivedCanonical },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title },
      { property: 'og:site_name', content: siteName },
      { property: 'og:locale', content: 'en_US' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: derivedCanonical },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: ogImage },
      { property: 'twitter:image:alt', content: title },
      { property: 'twitter:site', content: twitterHandle },
      { property: 'twitter:creator', content: twitterHandle },
    ];

    // Add article-specific meta tags
    if (ogType === 'article') {
      if (publishedTime) {
        metaTags.push({ property: 'article:published_time', content: publishedTime });
      }
      if (modifiedTime) {
        metaTags.push({ property: 'article:modified_time', content: modifiedTime });
      }
      if (author) {
        metaTags.push({ property: 'article:author', content: author });
      }
      if (section) {
        metaTags.push({ property: 'article:section', content: section });
      }
    }

    metaTags.forEach(tag => {
      const meta = document.createElement('meta');
      if (tag.name) meta.setAttribute('name', tag.name);
      if (tag.property) meta.setAttribute('property', tag.property);
      meta.setAttribute('content', tag.content);
      meta.setAttribute('data-seo', 'true');
      document.head.appendChild(meta);
    });

    // Add canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
  canonicalLink.href = derivedCanonical;

    // Add structured data
    schemaData.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      // Cleanup on unmount
      const metas = document.querySelectorAll('meta[data-seo="true"]');
      metas.forEach(meta => meta.remove());
      const schemas = document.querySelectorAll('script[data-schema="true"]');
      schemas.forEach(schema => schema.remove());
    };
  }, [title, description, keywords, canonical, ogImage, ogType, schemaData, siteName, twitterHandle, publishedTime, modifiedTime, author, section]);

  return null;
};

export default SEOHead;
