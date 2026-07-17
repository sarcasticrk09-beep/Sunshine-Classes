import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Type definitions for Analytics events
interface TrackEventParams {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
}

// Global window extensions for GA and GTM
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Global utility for event tracking
export const trackEvent = ({ event, category, action, label, value }: TrackEventParams) => {
  console.log(`[Analytics Event]`, { event, category, action, label, value });
  
  // Track to Google Analytics 4
  if (window.gtag) {
    window.gtag('event', event, {
      event_category: category,
      event_action: action,
      event_label: label,
      value: value,
    });
  }

  // Push to Google Tag Manager Data Layer
  if (window.dataLayer) {
    window.dataLayer.push({
      event,
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
      eventValue: value,
    });
  }
};

// Tracking helper for CTA button clicks
export const trackCTAClick = (id: string, text: string) => {
  trackEvent({
    event: 'cta_click',
    category: 'Engagement',
    action: 'Click CTA',
    label: `${text} (ID: ${id})`
  });
};

// Tracking helper for Contact actions (WhatsApp, Phone)
export const trackContactClick = (type: 'whatsapp' | 'phone' | 'email', value: string) => {
  trackEvent({
    event: 'contact_click',
    category: 'Lead Generation',
    action: `Click ${type}`,
    label: value
  });
};

// Tracking helper for Admission submission
export const trackAdmissionSubmit = (studentName: string, className: string) => {
  trackEvent({
    event: 'admission_submit',
    category: 'Lead Generation',
    action: 'Submit Admission Form',
    label: `${className} - ${studentName}`
  });
};

export function SEOHead() {
  const location = useLocation();

  // Route-specific SEO profiles
  const getSEOConfig = (pathname: string) => {
    switch (pathname) {
      case '/about':
        return {
          title: "About Sunshine Classes | Premium Tuition & Coaching in Pihani, Hardoi",
          description: "Learn more about Sunshine Classes, Pihani's leading coaching institute. Dedicated to excellence in education for Classes 1 to 10 with highly qualified teachers, regular weekly test series, and board exam preparation support.",
          keywords: "About Sunshine Classes, Coaching Institute Pihani, Tuition Pihani, Best Teachers Pihani, Academic Excellence Pihani, Hardoi Coaching"
        };
      case '/courses':
        return {
          title: "Coaching Classes 1-10 in Pihani | Science, Math & English Coaching | Sunshine Classes",
          description: "Explore structured coaching programs for Classes 1 to 10 at Sunshine Classes. Premium coaching for Mathematics, Science, English, and Social Sciences. Board preparation, weekly mock tests, and smart learning methodologies.",
          keywords: "Classes 1-10 Coaching, Math Coaching Pihani, Science Coaching Pihani, English Coaching Pihani, Board Preparation Pihani, CBSE Coaching Hardoi"
        };
      case '/enroll':
      case '/admissions':
        return {
          title: "Admission Open 2026-2027 | Enroll Now at Sunshine Classes Pihani",
          description: "Admissions open for classes 1-10 at Sunshine Classes, Pihani. Submit your digital credentials, upload school marks, and reserve your seat instantly for the new academic session. Direct roll number allocated on admin approval!",
          keywords: "Enroll in Sunshine Classes, Admission Pihani Coaching, Online Admission Tuition, Best Classes Near Me, Register Tuition Pihani"
        };
      case '/results':
        return {
          title: "Academic Topper Results & Testimonials | Sunshine Classes Pihani",
          description: "See the outstanding results and success stories of Sunshine Classes students. High school board exam toppers, course certificates, scorecards, and testimonials from proud parents and students in Pihani, Hardoi.",
          keywords: "Sunshine Classes Results, Board Exam Toppers Pihani, Parent Testimonials Tuition, Coaching Success Hardoi, Student Scorecards"
        };
      case '/resources':
        return {
          title: "Free E-Learning Resources, Syllabus & Homework Portals | Sunshine Classes",
          description: "Access high-quality study materials, chapter-wise notes, and class assignments curated by expert teachers. Log in to the Sunshine student portal for digital homework submissions and test schedules.",
          keywords: "Coaching Study Materials, Free Syllabus Pihani, Tuitions Notes PDF, Homework Portal Sunshine, Student Learning Resources"
        };
      case '/gallery':
        return {
          title: "Coaching Infrastructure & Classroom Gallery | Sunshine Classes Pihani",
          description: "Browse images of our premium teaching infrastructure, interactive smart boards, clean student study halls, award ceremonies, and extracurricular learning activities at Sunshine Classes, Pihani.",
          keywords: "Sunshine Classes Gallery, Coaching Infrastructure Pihani, Tuition Classrooms Hardoi, Study Hall Photos, Student Activities"
        };
      case '/contact':
        return {
          title: "Contact Sunshine Classes | Phone, Email & Google Maps Location in Pihani",
          description: "Get in touch with Sunshine Classes in Pihani, Hardoi. Reach us at +91-9140411354 or contact@sunshineclasses.org. Find our physical campus address, office hours, and dynamic directions map.",
          keywords: "Contact Sunshine Classes, Phone Number Pihani Tuition, Address Coaching Pihani, Google Maps Sunshine Classes, Support Email ERP"
        };
      case '/fees':
        return {
          title: "Transparent Fee Structure & Secure Online Payment Portal | Sunshine Classes",
          description: "View our affordable monthly fee ledgers, payment schedules, and pay securely via UPI, QR, or bank transfer. Print immediate, officially signed digital receipts with instant status synchronizations.",
          keywords: "Affordable Fees Tuition, Tuition Fee Portal, Online Fee Payment Pihani, UPI QR Fees, Sunshine Classes Billing"
        };
      default:
        return {
          title: "Sunshine Classes | Best Coaching Institute & Tuitions in Pihani, Hardoi",
          description: "Sunshine Classes is the leading coaching center in Pihani, Hardoi, offering highly premium education for Classes 1 to 10. Experienced educators, personalized learning paths, weekly mock tests, and smart tech integration.",
          keywords: "Best Coaching Institute in Pihani, Coaching Classes in Pihani, Best Tuition Classes in Pihani, Top Coaching Near Me, Affordable Tuition, Board Preparation, CBSE Coaching"
        };
    }
  };

  const config = getSEOConfig(location.pathname);
  const siteUrl = ((import.meta as any).env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}${location.pathname}`;

  useEffect(() => {
    // 1. Dynamic document title
    document.title = config.title;

    // 2. Helper to set/update meta tags in the head
    const updateOrCreateMeta = (nameAttr: string, valueAttr: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${valueAttr}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, valueAttr);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update standard SEO meta tags
    updateOrCreateMeta('name', 'description', config.description);
    updateOrCreateMeta('name', 'keywords', config.keywords);
    updateOrCreateMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateOrCreateMeta('name', 'author', 'Sunshine Classes');

    // Update Open Graph (OG) social sharing tags
    updateOrCreateMeta('property', 'og:title', config.title);
    updateOrCreateMeta('property', 'og:description', config.description);
    updateOrCreateMeta('property', 'og:type', 'website');
    updateOrCreateMeta('property', 'og:url', canonicalUrl);
    updateOrCreateMeta('property', 'og:site_name', 'Sunshine Classes');
    updateOrCreateMeta('property', 'og:image', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&h=630&q=80'); // Custom classroom sharing banner
    updateOrCreateMeta('property', 'og:locale', 'en_IN');

    // Update Twitter Cards social sharing tags
    updateOrCreateMeta('name', 'twitter:card', 'summary_large_image');
    updateOrCreateMeta('name', 'twitter:title', config.title);
    updateOrCreateMeta('name', 'twitter:description', config.description);
    updateOrCreateMeta('name', 'twitter:image', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&h=630&q=80');

    // Mobile / Browser tags
    updateOrCreateMeta('name', 'apple-mobile-web-app-capable', 'yes');
    updateOrCreateMeta('name', 'apple-mobile-web-app-status-bar-style', 'black-translucent');
    updateOrCreateMeta('name', 'theme-color', '#0f172a'); // slate-900 theme color matches dark style

    // 3. Dynamic Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 4. Inject Dynamic Structured Data (JSON-LD)
    const injectJSONLD = (id: string, schema: object) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('id', id);
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema, null, 2);
    };

    // Shared Organization/Educational schemas
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "@id": `${siteUrl}/#organization`,
      "name": "Sunshine Classes",
      "url": siteUrl,
      "logo": `${siteUrl}/logo.png`,
      "image": "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      "description": "Leading coaching center in Pihani, Hardoi for Classes 1 to 10. Excellence in mathematics, sciences, and languages.",
      "telephone": "+91-9140411354",
      "email": "contact@sunshineclasses.org",
      "foundingDate": "2018",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Near Gandhi Park",
        "addressLocality": "Pihani",
        "addressRegion": "Hardoi, Uttar Pradesh",
        "postalCode": "241406",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "27.6258",
        "longitude": "80.2014"
      },
      "sameAs": [
        "https://www.facebook.com/sunshineclassespihani",
        "https://www.youtube.com/@sunshineclassespihani",
        "https://www.instagram.com/sunshineclassespihani"
      ]
    };

    const localBusinessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${siteUrl}/#localbusiness`,
      "name": "Sunshine Classes Coaching Institute",
      "image": "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80",
      "telephone": "+919140411354",
      "email": "contact@sunshineclasses.org",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Near Gandhi Park",
        "addressLocality": "Pihani",
        "addressRegion": "Hardoi, Uttar Pradesh",
        "postalCode": "241406",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "27.6258",
        "longitude": "80.2014"
      },
      "url": siteUrl,
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "08:00",
          "closes": "20:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "09:00",
          "closes": "14:00"
        }
      ],
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Pihani, Hardoi"
      }
    };

    // Breadcrumb schema
    const crumbs = [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl }
    ];
    if (location.pathname !== '/') {
      const pageName = location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);
      crumbs.push({
        "@type": "ListItem",
        "position": 2,
        "name": pageName,
        "item": `${siteUrl}${location.pathname}`
      });
    }

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs
    };

    // General WebSite & WebPage Schemas
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": siteUrl,
      "name": "Sunshine Classes",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    const webpageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      "url": canonicalUrl,
      "name": config.title,
      "description": config.description,
      "isPartOf": { "@id": `${siteUrl}/#website` }
    };

    // FAQ schema for common admissions & coaching inquiries
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Which is the best coaching institute in Pihani, Hardoi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sunshine Classes is recognized as the leading coaching institute in Pihani, Hardoi, specializing in academic tuitions and comprehensive exam preparation for students from Classes 1 to 10."
          }
        },
        {
          "@type": "Question",
          "name": "What courses/classes are offered at Sunshine Classes?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer premium tuition coaching for Classes 1 to 10 covering Mathematics, Science, English, Social Sciences, and regional subjects. Complete board prep mock exams and weekly test schedules are integral to the program."
          }
        },
        {
          "@type": "Question",
          "name": "Does Sunshine Classes offer online admission registrations?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Sunshine Classes features an easy digital enrollment portal. Parents can upload student credentials, marksheets, and reserve seats online with real-time status updates and direct roll number generation upon administrative approval."
          }
        },
        {
          "@type": "Question",
          "name": "Is the fee structure affordable?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Absolutely. We pride ourselves on delivering standard, top-tier academic coaching at highly affordable tuition prices in Hardoi. Invoices, receipt logs, and UPI QR payments can all be processed via our secure student portal."
          }
        }
      ]
    };

    // Inject all schemas
    injectJSONLD('seo-org-jsonld', organizationSchema);
    injectJSONLD('seo-localbiz-jsonld', localBusinessSchema);
    injectJSONLD('seo-breadcrumbs-jsonld', breadcrumbSchema);
    injectJSONLD('seo-website-jsonld', websiteSchema);
    injectJSONLD('seo-webpage-jsonld', webpageSchema);
    injectJSONLD('seo-faq-jsonld', faqSchema);

    // 5. Google Analytics 4 & Tag Manager Preloader Integration
    const gaMeasurementId = (import.meta as any).env.VITE_GA_MEASUREMENT_ID || "";
    const gtmId = (import.meta as any).env.VITE_GTM_ID || "";

    if (gaMeasurementId && !document.getElementById('ga-script-lib')) {
      const script1 = document.createElement('script');
      script1.id = 'ga-script-lib';
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.id = 'ga-script-init';
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaMeasurementId}', { 'page_path': '${location.pathname}' });
      `;
      document.head.appendChild(script2);
    } else if (window.gtag && gaMeasurementId) {
      window.gtag('config', gaMeasurementId, { 'page_path': location.pathname });
    }

    if (gtmId && !document.getElementById('gtm-script')) {
      const script = document.createElement('script');
      script.id = 'gtm-script';
      script.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(script);
    }

    // Always log SPA virtual pageview for Search engine compatibility analysis
    console.log(`[SEO Engine] Simulated Pageview: "${location.pathname}" - Title: "${config.title}"`);
    trackEvent({
      event: 'page_view',
      category: 'Navigation',
      action: 'View Page',
      label: location.pathname
    });

  }, [location.pathname, config.title, config.description, config.keywords, canonicalUrl]);

  return null;
}
