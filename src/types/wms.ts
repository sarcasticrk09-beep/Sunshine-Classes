/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaButton: string;
  ctaLink: string;
  backgroundImage: string;
  mobileImage: string;
  priority: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface NavMenuItem {
  id: string;
  label: string;
  link: string;
  type: 'internal' | 'external';
  icon?: string;
  displayOrder: number;
  isMegaMenu?: boolean;
  parentId?: string | null;
  children?: NavMenuItem[];
  active: boolean;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  type: 'internal' | 'external';
}

export interface FooterConfig {
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  officeHours: string;
  copyrightText: string;
  quickLinks: FooterLink[];
  coursesLinks: FooterLink[];
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
    linkedin: string;
    telegram: string;
    whatsapp: string;
  };
}

export type AnnouncementType = 'Admission Open' | 'Holiday Notice' | 'New Batch' | 'Free Demo' | 'Exam Updates';

export interface AnnouncementBarConfig {
  enabled: boolean;
  type: AnnouncementType;
  message: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  textColor: string;
  startDate: string;
  endDate: string;
}

export type PopupType = 'Admission Popup' | 'Lead Capture' | 'Free Notes' | 'Free Demo' | 'New Batch' | 'Promotional Banner';
export type PopupDisplayRule = 'homepage_only' | 'all_pages' | 'selected_pages';

export interface PopupConfig {
  id: string;
  title: string;
  subtitle: string;
  type: PopupType;
  imageUrl?: string;
  ctaText: string;
  ctaLink: string;
  displayRule: PopupDisplayRule;
  selectedPages?: string[];
  delaySeconds: number;
  active: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string;
  footerLogoUrl: string;
  faviconUrl: string;
  buttonStyle: 'rounded' | 'pill' | 'sharp';
  borderRadius: string; // e.g. "12px", "16px", "24px"
}

export interface PageSEOConfig {
  id: string;
  pageName: string;
  path: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  schemaJson: string;
  updatedAt: string;
}

export type MediaFolder = 'images' | 'videos' | 'pdfs' | 'logos' | 'banners' | 'icons';

export interface MediaItem {
  id: string;
  name: string;
  folder: MediaFolder;
  url: string;
  sizeKb: number;
  compressionStatus: 'Compressed' | 'Original' | 'Optimized';
  usageCount: number;
  uploadedAt: string;
}

export interface WebsiteContactConfig {
  address: string;
  phoneNumbers: string[];
  emails: string[];
  whatsappNumber: string;
  googleMapsEmbed: string;
  officeHours: string;
}

export interface SocialMediaConfig {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  telegram: string;
  whatsapp: string;
}

export type SectionType = 
  | 'Hero Banner'
  | 'Announcements'
  | 'Why Sunshine'
  | 'Courses'
  | 'Faculty'
  | 'Results'
  | 'Testimonials'
  | 'Study Material'
  | 'Featured Books'
  | 'Featured Resources'
  | 'Latest Blogs'
  | 'FAQs'
  | 'Contact';

export type DynamicQueryMode = 'latest_8' | 'featured_only' | 'staff_picks' | 'manual';

export interface HomepageSection {
  id: string;
  key: string;
  name: SectionType;
  enabled: boolean;
  displayOrder: number;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  themeStyle: 'light' | 'dark' | 'card-grid' | 'minimalist' | 'accent';
  dataQueryMode?: DynamicQueryMode;
  selectedItemIds?: string[];
}

export interface WebsiteSettings {
  siteName: string;
  tagline: string;
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  analyticsId: string;
  metaPixelId: string;
  copyrightText: string;
  maintenanceMode: boolean;
  cookieBannerEnabled: boolean;
  privacyPolicyUrl: string;
  termsUrl: string;
}

export interface WMSData {
  homepageSections: HomepageSection[];
  heroBanners: HeroBanner[];
  navMenuItems: NavMenuItem[];
  footerConfig: FooterConfig;
  announcementBar: AnnouncementBarConfig;
  popups: PopupConfig[];
  themeConfig: ThemeConfig;
  pageSeoConfigs: PageSEOConfig[];
  mediaItems: MediaItem[];
  contactConfig: WebsiteContactConfig;
  socialMediaConfig: SocialMediaConfig;
  websiteSettings: WebsiteSettings;
}
