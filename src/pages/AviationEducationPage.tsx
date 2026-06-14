import React from 'react';
import Header from '../components/layout/Header';
import AviationEducation from '../components/AviationEducation';
import SEOHead from '../components/seo/SEOHead';
import { Book, Plane } from 'lucide-react';

const AviationEducationPage: React.FC = () => {
  // Comprehensive SEO Schema for Blog/News
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AviHub - Aviation News & Knowledge Center",
    "description": "Your comprehensive source for aviation news, aircraft guides, airport information, flight alerts, and aviation education. Stay updated with the latest in the aviation industry.",
    "url": "https://skyneu.com/aviation-education",
    "publisher": {
      "@type": "Organization",
      "name": "SkyNeu",
      "logo": {
        "@type": "ImageObject",
        "url": "https://skyneu.com/img/skin3.png"
      }
    },
    "inLanguage": "en-US",
    "about": {
      "@type": "Thing",
      "name": "Aviation"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AviHub by SkyNeu",
    "alternateName": "AviHub",
    "url": "https://skyneu.com/aviation-education",
    "logo": "https://skyneu.com/img/skin3.png",
    "description": "Free aviation news, aircraft guides, airport information, and flight alerts. Your go-to resource for aviation knowledge and travel insights.",
    "sameAs": [
      "https://skyneu.com"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AviHub by SkyNeu",
    "url": "https://skyneu.com/aviation-education",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://skyneu.com/aviation-education?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://skyneu.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "AviHub",
        "item": "https://skyneu.com/aviation-education"
      }
    ]
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "AviHub - Aviation News, Guides & Resources",
    "description": "Explore aviation news, aircraft specifications, airport guides, travel advisories, quizzes, and comprehensive aviation resources.",
    "url": "https://skyneu.com/aviation-education",
    "isPartOf": {
      "@type": "WebSite",
      "name": "SkyNeu",
      "url": "https://skyneu.com"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Aviation Content Categories",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Aviation News",
          "url": "https://skyneu.com/aviation-education?tab=news"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Aircraft Library",
          "url": "https://skyneu.com/aviation-education?tab=airplanes"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Aviation Guides",
          "url": "https://skyneu.com/aviation-education?tab=guides"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Airport Information",
          "url": "https://skyneu.com/aviation-education?tab=airports"
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Travel Advisories",
          "url": "https://skyneu.com/aviation-education?tab=advisories"
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is AviHub?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AviHub is a free aviation knowledge center by SkyNeu providing breaking aviation news, detailed aircraft guides, airport information, flight alerts, travel advisories, and educational resources for aviation enthusiasts and travelers."
        }
      },
      {
        "@type": "Question",
        "name": "Is AviHub free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! AviHub is completely free and open to everyone. No signup or subscription required to access aviation news, aircraft guides, airport information, and educational content."
        }
      },
      {
        "@type": "Question",
        "name": "What content does AviHub provide?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AviHub offers aviation news, detailed aircraft specifications, airport guides, travel advisories, aviation quizzes, educational resources, and real-time flight alerts. Content is updated daily from official and verified sources."
        }
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="AviHub - Free Aviation News, Aircraft Guides & Flight Alerts | SkyNeu"
        description="Discover AviHub: Your free aviation knowledge hub with daily breaking news, comprehensive aircraft guides, airport information, real-time flight alerts, travel advisories, and educational resources. Perfect for aviation enthusiasts, travelers, and professionals. No signup required."
        canonical="https://skyneu.com/aviation-education"
        keywords="aviation news, free aviation blog, aircraft guides, airplane specifications, airport information, flight alerts, aviation education, travel advisories, aviation resources, pilot training, aircraft library, aviation industry, flight tracking, airport guides, aviation knowledge, aviation enthusiasts, aircraft database, aviation updates, aviation community, free aviation content"
        ogType="website"
        ogImage="https://skyneu.com/img/avihub-og.jpg"
        schemaData={[blogSchema, organizationSchema, websiteSchema, breadcrumbSchema, collectionPageSchema, faqSchema]}
      />

      <div className="min-h-screen bg-gradient-to-br from-white via-skyneu-light/10 to-skyneu-blue/5 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg transition-colors duration-300">
        <Header />
        
        <main>
          {/* Main Component */}
          <AviationEducation />
        </main>
      </div>
    </>
  );
};

export default AviationEducationPage;