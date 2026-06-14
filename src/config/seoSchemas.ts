// JSON-LD Structured Data Schemas for SkyNeu

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SkyNeu",
  "alternateName": "SkyNeu Travel",
  "url": "https://skyneu.com",
  "logo": "https://skyneu.com/logo.png",
  "description": "AI-powered travel planning and flight tracking platform helping travelers make smarter decisions.",
  "email": "support@skyneu.com",
  "telephone": "+1-XXX-XXX-XXXX",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://www.twitter.com/skyneuai",
    "https://www.instagram.com/skyneuai",
    "https://www.linkedin.com/company/skyneu"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-XXX-XXX-XXXX",
    "contactType": "Customer Service",
    "email": "support@skyneu.com",
    "availableLanguage": ["English"]
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SkyNeu",
  "url": "https://skyneu.com",
  "description": "AI-powered travel planning and flight tracking platform",
  "publisher": {
    "@type": "Organization",
    "name": "SkyNeu"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://skyneu.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const tripPlannerServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "SkyNeu Trip Planner",
  "description": "AI-powered trip planning tool that helps you organize your entire journey. Get personalized itineraries, destination recommendations, and smart travel suggestions all in one place.",
  "brand": {
    "@type": "Brand",
    "name": "SkyNeu"
  },
  "image": "https://skyneu.com/images/trip-planner.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://skyneu.com/pricing",
    "priceCurrency": "USD",
    "price": "2.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "SkyNeu"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "250"
  }
};

export const flightTrackerServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "SkyNeu Flight Tracker",
  "description": "Real-time flight tracking with live updates, delay predictions, and instant notifications. Track any flight worldwide and get alerts for gate changes, delays, and cancellations.",
  "brand": {
    "@type": "Brand",
    "name": "SkyNeu"
  },
  "image": "https://skyneu.com/images/flight-tracker.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://skyneu.com/pricing",
    "priceCurrency": "USD",
    "price": "2.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "SkyNeu"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "320"
  }
};

export const visaCheckerServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "SkyNeu Visa Checker",
  "description": "Instant visa requirement checker for any destination. Get accurate visa information, processing times, required documents, and application guidance for your travel plans.",
  "brand": {
    "@type": "Brand",
    "name": "SkyNeu"
  },
  "image": "https://skyneu.com/images/visa-checker.jpg",
  "offers": {
    "@type": "Offer",
    "url": "https://skyneu.com/pricing",
    "priceCurrency": "USD",
    "price": "2.99",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "SkyNeu"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "180"
  }
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SkyNeu",
  "applicationCategory": "TravelApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "2.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "750"
  },
  "description": "AI-powered travel planning and flight tracking platform"
};

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const homepageBreadcrumb = breadcrumbSchema([
  { name: "Home", url: "https://skyneu.com" }
]);

export const pricingBreadcrumb = breadcrumbSchema([
  { name: "Home", url: "https://skyneu.com" },
  { name: "Pricing", url: "https://skyneu.com/pricing" }
]);

export const featuresBreadcrumb = breadcrumbSchema([
  { name: "Home", url: "https://skyneu.com" },
  { name: "Features", url: "https://skyneu.com/features" }
]);
