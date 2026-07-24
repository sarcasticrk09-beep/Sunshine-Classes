/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WMSData } from '../types/wms';

export const SEED_WMS_DATA: WMSData = {
  homepageSections: [
    {
      id: 'sec-hero',
      key: 'hero',
      name: 'Hero Banner',
      enabled: true,
      displayOrder: 1,
      title: 'Empowering Young Minds for Excellence & Board Mastery',
      subtitle: 'Premier Coaching in Pihani for Class 1 to 10 with proven toppers, personalized faculty care, and modern study resources.',
      ctaText: 'Apply for Admission',
      ctaLink: '#admissions',
      backgroundImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
      themeStyle: 'accent'
    },
    {
      id: 'sec-announcements',
      key: 'announcements',
      name: 'Announcements',
      enabled: true,
      displayOrder: 2,
      title: 'Latest Academic Bulletins & Exam Alerts',
      subtitle: 'Stay updated with batch schedules, demo classes, and official board notices.',
      themeStyle: 'light'
    },
    {
      id: 'sec-why-sunshine',
      key: 'why-sunshine',
      name: 'Why Sunshine',
      enabled: true,
      displayOrder: 3,
      title: 'Why Parents & Students Choose Sunshine Classes',
      subtitle: 'Dedicated faculty, smart classrooms, weekly chapter tests, and parent progress tracking.',
      themeStyle: 'card-grid'
    },
    {
      id: 'sec-courses',
      key: 'courses',
      name: 'Courses',
      enabled: true,
      displayOrder: 4,
      title: 'Curriculum & Academic Batches',
      subtitle: 'Tailored programs for Class 1 to 10 with emphasis on Science, Mathematics, English, and Board Exams.',
      themeStyle: 'light'
    },
    {
      id: 'sec-faculty',
      key: 'faculty',
      name: 'Faculty',
      enabled: true,
      displayOrder: 5,
      title: 'Learn from Master Educators',
      subtitle: 'Experienced mentor team led by Founder Priyanshu Gupta and Co-Founder Rajeev Kr. Verma.',
      themeStyle: 'minimalist'
    },
    {
      id: 'sec-results',
      key: 'results',
      name: 'Results',
      enabled: true,
      displayOrder: 6,
      title: 'Our Glorious Toppers & Outstanding Results',
      subtitle: 'Celebrating board achievements and top percentile scorers in CBSE & UP Board examinations.',
      themeStyle: 'accent',
      dataQueryMode: 'featured_only'
    },
    {
      id: 'sec-testimonials',
      key: 'testimonials',
      name: 'Testimonials',
      enabled: true,
      displayOrder: 7,
      title: 'What Parents & Alumni Say About Us',
      subtitle: 'Real stories of transformation, academic growth, and character building.',
      themeStyle: 'card-grid'
    },
    {
      id: 'sec-study-material',
      key: 'study-material',
      name: 'Study Material',
      enabled: true,
      displayOrder: 8,
      title: 'Free Study Notes & Sample Papers',
      subtitle: 'Download expert notes, formula sheets, and chapterwise previous year question sets.',
      themeStyle: 'light',
      dataQueryMode: 'latest_8'
    },
    {
      id: 'sec-featured-books',
      key: 'featured-books',
      name: 'Featured Books',
      enabled: true,
      displayOrder: 9,
      title: 'Recommended Textbooks & Reference Guides',
      subtitle: 'Faculty curated textbooks with direct Amazon and official store purchase links.',
      themeStyle: 'card-grid',
      dataQueryMode: 'staff_picks'
    },
    {
      id: 'sec-featured-resources',
      key: 'featured-resources',
      name: 'Featured Resources',
      enabled: true,
      displayOrder: 10,
      title: 'Essential Learning Kits & Smart Stationery',
      subtitle: 'Top-rated tools, calculators, and exam kits recommended for active learners.',
      themeStyle: 'light',
      dataQueryMode: 'featured_only'
    },
    {
      id: 'sec-latest-blogs',
      key: 'latest-blogs',
      name: 'Latest Blogs',
      enabled: true,
      displayOrder: 11,
      title: 'Exam Preparation Tips & Educational Insights',
      subtitle: 'Articles on effective revision tactics, mental wellbeing, and career guidance.',
      themeStyle: 'minimalist',
      dataQueryMode: 'latest_8'
    },
    {
      id: 'sec-faqs',
      key: 'faqs',
      name: 'FAQs',
      enabled: true,
      displayOrder: 12,
      title: 'Frequently Asked Questions',
      subtitle: 'Answers regarding batch timings, fee concessions, transport, and admissions.',
      themeStyle: 'light'
    },
    {
      id: 'sec-contact',
      key: 'contact',
      name: 'Contact',
      enabled: true,
      displayOrder: 13,
      title: 'Visit Our Campus or Reach Out Today',
      subtitle: 'We are located at Main Market Road, Pihani, Hardoi (U.P.). Visit or call for details.',
      themeStyle: 'dark'
    }
  ],

  heroBanners: [
    {
      id: 'ban-1',
      title: 'Admissions Open for Session 2026-27',
      subtitle: 'Class 1st to 10th (CBSE & State Board)',
      description: 'Enroll today to secure early-bird fee concessions and personalized mentoring.',
      ctaButton: 'Register Now',
      ctaLink: '/admissions',
      backgroundImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
      mobileImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
      priority: 1,
      startDate: '2026-04-01',
      endDate: '2026-08-31',
      active: true
    },
    {
      id: 'ban-2',
      title: '10th Board Specialist Target Batch',
      subtitle: '100% Chapter Coverage & PYQ Drills',
      description: 'Comprehensive Science, Mathematics and Social Science preparation with weekly mock tests.',
      ctaButton: 'View Timetable',
      ctaLink: '/courses',
      backgroundImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
      mobileImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
      priority: 2,
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      active: true
    }
  ],

  navMenuItems: [
    {
      id: 'nav-home',
      label: 'Home',
      link: '/',
      type: 'internal',
      displayOrder: 1,
      active: true
    },
    {
      id: 'nav-courses',
      label: 'Courses & Batches',
      link: '/courses',
      type: 'internal',
      displayOrder: 2,
      active: true
    },
    {
      id: 'nav-study-material',
      label: 'Study Material',
      link: '/study-material',
      type: 'internal',
      displayOrder: 3,
      isMegaMenu: true,
      active: true,
      children: [
        { id: 'sub-class-10', label: 'Class 10 PYQ & Notes', link: '/study-material?class=Class+10', type: 'internal', displayOrder: 1, active: true },
        { id: 'sub-class-9', label: 'Class 9 PYQ & Notes', link: '/study-material?class=Class+9', type: 'internal', displayOrder: 2, active: true },
        { id: 'sub-class-8', label: 'Class 8 PYQ & Notes', link: '/study-material?class=Class+8', type: 'internal', displayOrder: 3, active: true }
      ]
    },
    {
      id: 'nav-store',
      label: 'Sunshine Store',
      link: '/store',
      type: 'internal',
      displayOrder: 4,
      active: true
    },
    {
      id: 'nav-blogs',
      label: 'Blogs & News',
      link: '/blogs',
      type: 'internal',
      displayOrder: 5,
      active: true
    },
    {
      id: 'nav-about',
      label: 'About & Faculty',
      link: '/about',
      type: 'internal',
      displayOrder: 6,
      active: true
    },
    {
      id: 'nav-contact',
      label: 'Contact Us',
      link: '/contact',
      type: 'internal',
      displayOrder: 7,
      active: true
    }
  ],

  footerConfig: {
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
    address: 'Near Town Hall, Main Market Road, Pihani, Hardoi, Uttar Pradesh - 241406',
    phone: '+91 9999900000 / +91 9999900001',
    email: 'sunshineclassespihani@gmail.com',
    whatsapp: '+91 9999900000',
    officeHours: 'Mon - Sat: 07:00 AM - 07:00 PM | Sun: Closed',
    copyrightText: '© 2026 Sunshine Classes Pihani. All rights reserved. Built with pride for excellence in education.',
    quickLinks: [
      { id: 'fl-1', label: 'Online Admission Portal', url: '/admissions', type: 'internal' },
      { id: 'fl-2', label: 'Verify Fee Receipt', url: '/verify-receipt', type: 'internal' },
      { id: 'fl-3', label: 'Free Notes & Question Bank', url: '/study-material', type: 'internal' },
      { id: 'fl-4', label: 'Sunshine Store Recommended Books', url: '/store', type: 'internal' },
      { id: 'fl-5', label: 'Student Portal Login', url: '/student/login', type: 'internal' }
    ],
    coursesLinks: [
      { id: 'fc-1', label: 'Class 10th Board Specialist', url: '/courses#class-10', type: 'internal' },
      { id: 'fc-2', label: 'Class 9th Foundation Program', url: '/courses#class-9', type: 'internal' },
      { id: 'fc-3', label: 'Class 6th-8th Middle Wing', url: '/courses#middle-wing', type: 'internal' },
      { id: 'fc-4', label: 'Class 1st-5th Primary Wing', url: '/courses#primary-wing', type: 'internal' }
    ],
    socialLinks: {
      facebook: 'https://facebook.com/sunshineclassespihani',
      instagram: 'https://instagram.com/sunshineclassespihani',
      youtube: 'https://youtube.com/@sunshineclassespihani',
      linkedin: 'https://linkedin.com/company/sunshineclassespihani',
      telegram: 'https://t.me/sunshineclassespihani',
      whatsapp: 'https://wa.me/919999900000'
    }
  },

  announcementBar: {
    enabled: true,
    type: 'Admission Open',
    message: '🎉 Admissions Open for New Session 2026-27! Register today to claim your early bird demo seat.',
    buttonText: 'Apply Online ➔',
    buttonLink: '/admissions',
    backgroundColor: '#d97706',
    textColor: '#ffffff',
    startDate: '2026-04-01',
    endDate: '2026-09-30'
  },

  popups: [
    {
      id: 'pop-1',
      title: 'Join Sunshine Demo Classes For Free!',
      subtitle: 'Experience our master faculty, smart notes & interactive batch teaching for 3 days with zero commitment.',
      type: 'Free Demo',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
      ctaText: 'Book Free Demo Seat',
      ctaLink: '/admissions',
      displayRule: 'homepage_only',
      delaySeconds: 3,
      active: true
    },
    {
      id: 'pop-2',
      title: 'Download Free Class 10th Board Formula Sheet',
      subtitle: 'All crucial Physics, Chemistry & Maths formulas in one high-yield 12-page PDF booklet.',
      type: 'Free Notes',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600',
      ctaText: 'Download Notes PDF',
      ctaLink: '/study-material',
      displayRule: 'all_pages',
      delaySeconds: 10,
      active: false
    }
  ],

  themeConfig: {
    primaryColor: '#f59e0b', // Sunshine Gold
    secondaryColor: '#0f172a', // Deep Slate / Navy
    accentColor: '#10b981', // Emerald
    fontFamily: 'Plus Jakarta Sans',
    logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
    footerLogoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
    faviconUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=64',
    buttonStyle: 'rounded',
    borderRadius: '16px'
  },

  pageSeoConfigs: [
    {
      id: 'seo-home',
      pageName: 'Homepage',
      path: '/',
      seoTitle: 'Sunshine Classes Pihani | Best Coaching for Class 1 to 10 in Hardoi',
      metaDescription: 'Sunshine Classes is Pihani\'s premier coaching institute for Class 1 to 10. Master Science, Maths and English with expert faculty, weekly tests and topper results.',
      keywords: ['Sunshine Classes Pihani', 'Coaching in Pihani', 'Best Tuition Pihani', 'Class 10 CBSE Coaching Hardoi', 'Priyanshu Gupta Sunshine'],
      canonicalUrl: 'https://sunshineclasses.edu.in/',
      ogImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
      twitterCard: 'summary_large_image',
      schemaJson: '{\n  "@context": "https://schema.org",\n  "@type": "EducationalOrganization",\n  "name": "Sunshine Classes Pihani",\n  "address": "Pihani, Hardoi, Uttar Pradesh"\n}',
      updatedAt: '2026-07-24'
    },
    {
      id: 'seo-store',
      pageName: 'Sunshine Store',
      path: '/store',
      seoTitle: 'Sunshine Store | Faculty Recommended Books & Study Resources',
      metaDescription: 'Explore expert recommended textbooks, reference guides, PYQ books and stationery for Class 1 to 10 students.',
      keywords: ['Sunshine Store', 'Class 10 RD Sharma', 'Class 10 NCERT Solutions', 'Best Books for CBSE Class 10'],
      canonicalUrl: 'https://sunshineclasses.edu.in/store',
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200',
      twitterCard: 'summary_large_image',
      schemaJson: '{\n  "@context": "https://schema.org",\n  "@type": "Store",\n  "name": "Sunshine Store"\n}',
      updatedAt: '2026-07-24'
    },
    {
      id: 'seo-study-material',
      pageName: 'Study Material CMS',
      path: '/study-material',
      seoTitle: 'Free Study Material, Question Banks & Practice Sets | Sunshine Classes',
      metaDescription: 'Download free PDF study notes, chapter summaries, formula sheets and sample papers for Class 1st to 10th.',
      keywords: ['Free Study Material', 'Class 10 Science Notes', 'Maths Formula Sheet PDF', 'Board Sample Papers'],
      canonicalUrl: 'https://sunshineclasses.edu.in/study-material',
      ogImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
      twitterCard: 'summary_large_image',
      schemaJson: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Study Material"\n}',
      updatedAt: '2026-07-24'
    }
  ],

  mediaItems: [
    { id: 'm-1', name: 'campus-hero.jpg', folder: 'banners', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200', sizeKb: 245, compressionStatus: 'Optimized', usageCount: 2, uploadedAt: '2026-07-10' },
    { id: 'm-2', name: 'sunshine-logo.png', folder: 'logos', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200', sizeKb: 48, compressionStatus: 'Compressed', usageCount: 5, uploadedAt: '2026-06-15' },
    { id: 'm-3', name: 'class10-syllabus-guide.pdf', folder: 'pdfs', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', sizeKb: 850, compressionStatus: 'Original', usageCount: 3, uploadedAt: '2026-07-01' },
    { id: 'm-4', name: 'rd-sharma-maths-cover.jpg', folder: 'images', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600', sizeKb: 120, compressionStatus: 'Optimized', usageCount: 1, uploadedAt: '2026-07-20' }
  ],

  contactConfig: {
    address: 'Near Town Hall, Main Market Road, Pihani, Hardoi, Uttar Pradesh - 241406',
    phoneNumbers: ['+91 9999900000', '+91 9999900001'],
    emails: ['sunshineclassespihani@gmail.com', 'info@sunshineclasses.edu.in'],
    whatsappNumber: '+91 9999900000',
    googleMapsEmbed: 'https://maps.google.com/maps?q=Pihani+Hardoi&t=&z=13&ie=UTF8&iwloc=&output=embed',
    officeHours: 'Mon - Sat: 07:00 AM - 07:00 PM | Sun: Closed'
  },

  socialMediaConfig: {
    facebook: 'https://facebook.com/sunshineclassespihani',
    instagram: 'https://instagram.com/sunshineclassespihani',
    youtube: 'https://youtube.com/@sunshineclassespihani',
    linkedin: 'https://linkedin.com/company/sunshineclassespihani',
    telegram: 'https://t.me/sunshineclassespihani',
    whatsapp: 'https://wa.me/919999900000'
  },

  websiteSettings: {
    siteName: 'Sunshine Classes Pihani',
    tagline: 'Empowering Young Minds For Academic Excellence',
    defaultSeoTitle: 'Sunshine Classes Pihani | Premier Coaching Institute',
    defaultMetaDescription: 'Official website of Sunshine Classes Pihani. Access courses, study materials, store recommendations, and student admission portal.',
    analyticsId: 'G-SUNSHINE2026',
    metaPixelId: 'PIXEL-8839201',
    copyrightText: '© 2026 Sunshine Classes Pihani. All rights reserved.',
    maintenanceMode: false,
    cookieBannerEnabled: true,
    privacyPolicyUrl: '/privacy-policy',
    termsUrl: '/terms-and-conditions'
  }
};
