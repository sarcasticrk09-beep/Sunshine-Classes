/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Layout,
  Sliders,
  Image as ImageIcon,
  Navigation,
  FileText,
  Search,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Phone,
  Share2,
  Megaphone,
  Palette,
  Shield,
  Copy,
  ExternalLink,
  Lock,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  ShoppingBag,
  UploadCloud,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
  Folder,
  Tag,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Code
} from 'lucide-react';
import {
  WMSData,
  HomepageSection,
  HeroBanner,
  NavMenuItem,
  PopupConfig,
  PageSEOConfig,
  MediaItem,
  MediaFolder,
  AnnouncementType,
  PopupType,
  PopupDisplayRule,
  DynamicQueryMode,
  SectionType
} from '../types/wms';
import { StudyMaterial, BlogPost, StoreProduct, AuditLog, UserRole } from '../types';

interface WebsiteManagementSystemProps {
  wmsData: WMSData;
  onUpdateWMSData: (updated: WMSData) => void;
  studyMaterials?: StudyMaterial[];
  blogs?: BlogPost[];
  storeProducts?: StoreProduct[];
  auditLogs?: AuditLog[];
  onAddAuditLog?: (action: string, details: string) => void;
  currentUserRole?: UserRole;
}

export const WebsiteManagementSystem: React.FC<WebsiteManagementSystemProps> = ({
  wmsData,
  onUpdateWMSData,
  studyMaterials = [],
  blogs = [],
  storeProducts = [],
  auditLogs = [],
  onAddAuditLog,
  currentUserRole = 'SUPER_ADMIN'
}) => {
  // Navigation Tabs inside WMS
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'homepage-builder'
    | 'banners'
    | 'navigation'
    | 'footer'
    | 'announcement-bar'
    | 'popups'
    | 'theme'
    | 'seo'
    | 'media'
    | 'contact'
    | 'social'
    | 'settings'
  >('dashboard');

  // Preview device mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  // Filter/Search states
  const [mediaSearch, setMediaSearch] = useState('');
  const [selectedMediaFolder, setSelectedMediaFolder] = useState<MediaFolder | 'all'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Modals / Forms
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const [editingNav, setEditingNav] = useState<NavMenuItem | null>(null);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  const [editingPopup, setEditingPopup] = useState<PopupConfig | null>(null);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);

  const [editingSEO, setEditingSEO] = useState<PageSEOConfig | null>(null);
  const [isSEOModalOpen, setIsSEOModalOpen] = useState(false);

  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaFolder, setNewMediaFolder] = useState<MediaFolder>('images');
  const [newMediaUrl, setNewMediaUrl] = useState('');

  // Helper for audit logging
  const logChange = (action: string, details: string) => {
    if (onAddAuditLog) {
      onAddAuditLog(action, details);
    }
  };

  // Helper to copy text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // ----------------------------------------------------
  // SECTION REORDERING & MANAGERS
  // ----------------------------------------------------
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...wmsData.homepageSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIndex];
    sections[targetIndex] = temp;

    // re-assign display orders
    const updatedSections = sections.map((sec, idx) => ({ ...sec, displayOrder: idx + 1 }));
    onUpdateWMSData({ ...wmsData, homepageSections: updatedSections });
    logChange('WMS_HOMEPAGE_REORDER', `Reordered homepage sections: moved ${temp.name} ${direction}.`);
  };

  const handleToggleSection = (id: string) => {
    const updatedSections = wmsData.homepageSections.map(sec =>
      sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
    );
    onUpdateWMSData({ ...wmsData, homepageSections: updatedSections });
    logChange('WMS_HOMEPAGE_TOGGLE', `Toggled section ${id} active status.`);
  };

  const handleUpdateSectionField = (id: string, field: keyof HomepageSection, value: any) => {
    const updatedSections = wmsData.homepageSections.map(sec =>
      sec.id === id ? { ...sec, [field]: value } : sec
    );
    onUpdateWMSData({ ...wmsData, homepageSections: updatedSections });
  };

  // Banners CRUD
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    let updatedBanners: HeroBanner[];
    if (wmsData.heroBanners.some(b => b.id === editingBanner.id)) {
      updatedBanners = wmsData.heroBanners.map(b => (b.id === editingBanner.id ? editingBanner : b));
    } else {
      updatedBanners = [...wmsData.heroBanners, editingBanner];
    }

    onUpdateWMSData({ ...wmsData, heroBanners: updatedBanners });
    setIsBannerModalOpen(false);
    setEditingBanner(null);
    logChange('WMS_BANNER_SAVE', `Saved Hero Banner "${editingBanner.title}".`);
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm('Are you sure you want to delete this hero banner?')) {
      const updatedBanners = wmsData.heroBanners.filter(b => b.id !== id);
      onUpdateWMSData({ ...wmsData, heroBanners: updatedBanners });
      logChange('WMS_BANNER_DELETE', `Deleted Hero Banner ID ${id}.`);
    }
  };

  // Nav Menu CRUD
  const handleSaveNav = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNav) return;

    let updatedNav: NavMenuItem[];
    if (wmsData.navMenuItems.some(n => n.id === editingNav.id)) {
      updatedNav = wmsData.navMenuItems.map(n => (n.id === editingNav.id ? editingNav : n));
    } else {
      updatedNav = [...wmsData.navMenuItems, editingNav];
    }

    onUpdateWMSData({ ...wmsData, navMenuItems: updatedNav });
    setIsNavModalOpen(false);
    setEditingNav(null);
    logChange('WMS_NAV_SAVE', `Saved Navigation Menu Item "${editingNav.label}".`);
  };

  const handleDeleteNav = (id: string) => {
    if (window.confirm('Delete this menu item?')) {
      const updatedNav = wmsData.navMenuItems.filter(n => n.id !== id);
      onUpdateWMSData({ ...wmsData, navMenuItems: updatedNav });
      logChange('WMS_NAV_DELETE', `Deleted Navigation Item ID ${id}.`);
    }
  };

  // Popups CRUD
  const handleSavePopup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPopup) return;

    let updatedPopups: PopupConfig[];
    if (wmsData.popups.some(p => p.id === editingPopup.id)) {
      updatedPopups = wmsData.popups.map(p => (p.id === editingPopup.id ? editingPopup : p));
    } else {
      updatedPopups = [...wmsData.popups, editingPopup];
    }

    onUpdateWMSData({ ...wmsData, popups: updatedPopups });
    setIsPopupModalOpen(false);
    setEditingPopup(null);
    logChange('WMS_POPUP_SAVE', `Saved Promotional Popup "${editingPopup.title}".`);
  };

  const handleDeletePopup = (id: string) => {
    if (window.confirm('Delete this popup configuration?')) {
      const updatedPopups = wmsData.popups.filter(p => p.id !== id);
      onUpdateWMSData({ ...wmsData, popups: updatedPopups });
      logChange('WMS_POPUP_DELETE', `Deleted Popup ID ${id}.`);
    }
  };

  // SEO CRUD
  const handleSaveSEO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSEO) return;

    const updatedSEO = editingSEO.id && wmsData.pageSeoConfigs.some(s => s.id === editingSEO.id)
      ? wmsData.pageSeoConfigs.map(s => (s.id === editingSEO.id ? { ...editingSEO, updatedAt: new Date().toISOString().split('T')[0] } : s))
      : [...wmsData.pageSeoConfigs, { ...editingSEO, id: `seo-${Date.now()}`, updatedAt: new Date().toISOString().split('T')[0] }];

    onUpdateWMSData({ ...wmsData, pageSeoConfigs: updatedSEO });
    setIsSEOModalOpen(false);
    setEditingSEO(null);
    logChange('WMS_SEO_SAVE', `Updated SEO Metadata for page "${editingSEO.pageName}".`);
  };

  // Media Library Upload
  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaName || !newMediaUrl) return;

    const newItem: MediaItem = {
      id: `med-${Date.now()}`,
      name: newMediaName,
      folder: newMediaFolder,
      url: newMediaUrl,
      sizeKb: Math.floor(Math.random() * 300) + 50,
      compressionStatus: 'Optimized',
      usageCount: 1,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    onUpdateWMSData({ ...wmsData, mediaItems: [newItem, ...wmsData.mediaItems] });
    setIsAddMediaModalOpen(false);
    setNewMediaName('');
    setNewMediaUrl('');
    logChange('WMS_MEDIA_ADD', `Added new media asset "${newMediaName}" to folder ${newMediaFolder}.`);
  };

  const handleDeleteMedia = (id: string) => {
    if (window.confirm('Permanently remove this media asset?')) {
      const updatedMedia = wmsData.mediaItems.filter(m => m.id !== id);
      onUpdateWMSData({ ...wmsData, mediaItems: updatedMedia });
      logChange('WMS_MEDIA_DELETE', `Removed media asset ID ${id}.`);
    }
  };

  // SEO Audit calculations
  const missingSeoPages = wmsData.pageSeoConfigs.filter(s => !s.seoTitle || !s.metaDescription);
  const missingOgImages = wmsData.pageSeoConfigs.filter(s => !s.ogImage);

  // Store books / resources counts
  const storeBooksCount = storeProducts.filter(p => p.type === 'Book').length;
  const storeResourcesCount = storeProducts.filter(p => p.type === 'Resource').length;

  return (
    <div className="space-y-6 text-left">
      {/* HEADER BAR WITH LIVE PREVIEW TRIGGER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 rounded-3xl border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg">
            <Globe size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-xl tracking-tight">Website Management System (WMS)</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                wmsData.websiteSettings.maintenanceMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {wmsData.websiteSettings.maintenanceMode ? '🔒 Maintenance Mode' : '🌐 Website Live'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Centralized control for Sunshine Classes public homepage, navigation, banners, SEO, and store integrations.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Maintenance Toggle */}
          <button
            id="btn-wms-toggle-maintenance"
            type="button"
            onClick={() => {
              const updated = !wmsData.websiteSettings.maintenanceMode;
              onUpdateWMSData({
                ...wmsData,
                websiteSettings: { ...wmsData.websiteSettings, maintenanceMode: updated }
              });
              logChange('WMS_MAINTENANCE_TOGGLE', `Set Maintenance Mode to ${updated ? 'ENABLED' : 'DISABLED'}`);
            }}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              wmsData.websiteSettings.maintenanceMode
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Shield size={15} />
            <span>{wmsData.websiteSettings.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}</span>
          </button>

          {/* Live Preview Button */}
          <button
            id="btn-wms-live-preview"
            type="button"
            onClick={() => {
              setPreviewDevice('desktop');
              setShowLivePreviewModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Eye size={16} />
            <span>Interactive Live Preview</span>
          </button>
        </div>
      </div>

      {/* TOP SUB-MODULE NAVIGATION BAR */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none shadow-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Globe },
          { id: 'homepage-builder', label: 'Homepage Builder', icon: Layout },
          { id: 'banners', label: 'Hero Banners', icon: Sliders },
          { id: 'navigation', label: 'Navigation Menu', icon: Navigation },
          { id: 'announcement-bar', label: 'Announcement Bar', icon: Megaphone },
          { id: 'popups', label: 'Popups & Leads', icon: Sparkles },
          { id: 'footer', label: 'Footer Manager', icon: Layers },
          { id: 'theme', label: 'Theme Styling', icon: Palette },
          { id: 'seo', label: 'SEO Manager', icon: Search },
          { id: 'media', label: 'Media Library', icon: ImageIcon },
          { id: 'contact', label: 'Contact Details', icon: Phone },
          { id: 'social', label: 'Social Media', icon: Share2 },
          { id: 'settings', label: 'Settings & RBAC', icon: Settings }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-wms-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <IconComp size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WEBSITE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Published Pages</span>
                <Globe size={18} className="text-amber-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {wmsData.pageSeoConfigs.length}
              </span>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">100% SEO Indexed</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Banners & Popups</span>
                <Sliders size={18} className="text-indigo-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {wmsData.heroBanners.filter(b => b.active).length + wmsData.popups.filter(p => p.active).length}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {wmsData.heroBanners.length} Banners, {wmsData.popups.length} Popups
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Study Materials & Store</span>
                <BookOpen size={18} className="text-emerald-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {studyMaterials.length + storeProducts.length}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {studyMaterials.length} PDFs • {storeBooksCount} Books • {storeResourcesCount} Kits
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Blogs & Media Assets</span>
                <FileText size={18} className="text-blue-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {blogs.length + wmsData.mediaItems.length}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {blogs.length} Published Articles • {wmsData.mediaItems.length} Media Files
              </p>
            </div>
          </div>

          {/* Visitor Traffic & Top Pages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" />
                  <span>Website Visitor Analytics</span>
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Live Stream
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Today's Visitors</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">1,428</span>
                  <span className="text-[10px] text-emerald-500 font-bold block">↑ +14.2% vs yesterday</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Monthly Page Views</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">38,920</span>
                  <span className="text-[10px] text-emerald-500 font-bold block">↑ +22.5% vs last mo</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Avg Time on Site</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">4m 12s</span>
                  <span className="text-[10px] text-slate-400 font-bold block">High Engagement</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Bounce Rate</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">28.4%</span>
                  <span className="text-[10px] text-emerald-500 font-bold block">Optimal</span>
                </div>
              </div>
            </div>

            {/* Top Traffic Pages */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe size={16} className="text-indigo-500" />
                  <span>Top Performing Pages</span>
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { title: 'Homepage (/)', views: '18,450', pct: '47%' },
                  { title: 'Free Study Material (/study-material)', views: '9,820', pct: '25%' },
                  { title: 'Sunshine Store Books (/store)', views: '5,310', pct: '14%' },
                  { title: 'Online Admissions (/admissions)', views: '3,120', pct: '8%' },
                  { title: 'Class 10 PYQ Notes (/notes-10)', views: '2,220', pct: '6%' }
                ].map((pg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{pg.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{pg.views} page views</span>
                    </div>
                    <span className="font-mono font-black text-amber-500 text-xs">{pg.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent WMS Audit Changes */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={16} className="text-emerald-500" />
                  <span>Recent Website Updates Log</span>
                </h3>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                {auditLogs.filter(l => l.action.startsWith('WMS_')).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No recent WMS modifications logged today.</p>
                ) : (
                  auditLogs
                    .filter(l => l.action.startsWith('WMS_'))
                    .slice(0, 6)
                    .map(log => (
                      <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">{log.action}</span>
                          <span className="text-slate-400">{log.timestamp.split('T')[0]}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{log.details}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOMEPAGE BUILDER */}
      {activeTab === 'homepage-builder' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Layout size={18} className="text-amber-500" />
                  <span>Visual Homepage Layout Builder</span>
                </h3>
                <p className="text-xs text-slate-500">Reorder sections, toggle visibility, and customize titles, buttons, background styles, and automatic data querying.</p>
              </div>

              <button
                id="btn-homepage-preview-layout"
                type="button"
                onClick={() => {
                  setPreviewDevice('desktop');
                  setShowLivePreviewModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={15} />
                <span>Preview Homepage</span>
              </button>
            </div>

            {/* Reorderable Section List */}
            <div className="space-y-3">
              {wmsData.homepageSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    sec.enabled
                      ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 shadow-xs'
                      : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Move Up/Down Controls */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-1 rounded bg-white dark:bg-slate-800 text-slate-600 hover:text-amber-500 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === wmsData.homepageSections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-1 rounded bg-white dark:bg-slate-800 text-slate-600 hover:text-amber-500 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                        {sec.displayOrder}
                      </span>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{sec.name}</span>
                          {sec.dataQueryMode && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-extrabold text-[10px]">
                              Auto Query: {sec.dataQueryMode}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">{sec.subtitle}</p>
                      </div>
                    </div>

                    {/* Enable Toggle & Style Selector */}
                    <div className="flex items-center gap-3">
                      <select
                        value={sec.themeStyle}
                        onChange={e => handleUpdateSectionField(sec.id, 'themeStyle', e.target.value)}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                      >
                        <option value="light">Light Theme</option>
                        <option value="dark">Dark Theme</option>
                        <option value="card-grid">Card Grid</option>
                        <option value="minimalist">Minimalist</option>
                        <option value="accent">Accent Gold</option>
                      </select>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={() => handleToggleSection(sec.id)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>{sec.enabled ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Inline Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Section Title</label>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={e => handleUpdateSectionField(sec.id, 'title', e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Section Subtitle</label>
                      <input
                        type="text"
                        value={sec.subtitle}
                        onChange={e => handleUpdateSectionField(sec.id, 'subtitle', e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300"
                      />
                    </div>

                    {['Featured Books', 'Featured Resources', 'Study Material', 'Latest Blogs'].includes(sec.name) && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Dynamic Data Query Mode</label>
                        <select
                          value={sec.dataQueryMode || 'latest_8'}
                          onChange={e => handleUpdateSectionField(sec.id, 'dataQueryMode', e.target.value as DynamicQueryMode)}
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="latest_8">Show Latest 8 Items</option>
                          <option value="featured_only">Featured Items Only</option>
                          <option value="staff_picks">Staff Picks / Recommends</option>
                          <option value="manual">Manual Selection</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HERO BANNERS */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={18} className="text-amber-500" />
                  <span>Hero Banner Carousel Manager</span>
                </h3>
                <p className="text-xs text-slate-500">Manage multiple sliding hero banners with date scheduling and mobile responsiveness.</p>
              </div>

              <button
                id="btn-add-new-banner"
                type="button"
                onClick={() => {
                  setEditingBanner({
                    id: `ban-${Date.now()}`,
                    title: 'New Promotional Banner',
                    subtitle: 'Class 1st to 10th',
                    description: 'Enter banner description here',
                    ctaButton: 'Learn More',
                    ctaLink: '/admissions',
                    backgroundImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
                    mobileImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
                    priority: wmsData.heroBanners.length + 1,
                    startDate: '2026-07-01',
                    endDate: '2026-12-31',
                    active: true
                  });
                  setIsBannerModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Hero Banner</span>
              </button>
            </div>

            {/* Banner Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wmsData.heroBanners.map(b => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="relative h-36 rounded-xl overflow-hidden bg-slate-800">
                    <img src={b.backgroundImage} alt={b.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex flex-col justify-end text-white">
                      <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">{b.subtitle}</span>
                      <h4 className="font-extrabold text-sm">{b.title}</h4>
                    </div>
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      b.active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {b.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{b.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span>Schedule: {b.startDate} to {b.endDate}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner(b);
                          setIsBannerModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NAVIGATION MANAGER */}
      {activeTab === 'navigation' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Navigation size={18} className="text-amber-500" />
                  <span>Header Navigation & Submenus Manager</span>
                </h3>
                <p className="text-xs text-slate-500">Configure main menu links, dropdown hierarchical submenus, and mega menu support.</p>
              </div>

              <button
                id="btn-add-nav-item"
                type="button"
                onClick={() => {
                  setEditingNav({
                    id: `nav-${Date.now()}`,
                    label: 'New Link',
                    link: '/',
                    type: 'internal',
                    displayOrder: wmsData.navMenuItems.length + 1,
                    active: true
                  });
                  setIsNavModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Navigation Item</span>
              </button>
            </div>

            {/* Tree Navigation List */}
            <div className="space-y-2">
              {wmsData.navMenuItems.map((nav, idx) => (
                <div key={nav.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{nav.label}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                        {nav.link}
                      </span>
                      {nav.isMegaMenu && (
                        <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-extrabold">
                          Mega Menu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNav(nav);
                          setIsNavModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNav(nav.id)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Children Submenu Listing */}
                  {nav.children && nav.children.length > 0 && (
                    <div className="pl-8 space-y-1 border-l-2 border-amber-300 dark:border-amber-700">
                      {nav.children.map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">↳ {child.label}</span>
                          <span className="font-mono text-[10px] text-slate-400">{child.link}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENT BAR */}
      {activeTab === 'announcement-bar' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone size={18} className="text-amber-500" />
                <span>Top Announcement Bar Manager</span>
              </h3>
              <p className="text-xs text-slate-500">Customize sticky top banner alerts for Admissions, Holiday notices, New Batches, and Exams.</p>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wmsData.announcementBar.enabled}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  announcementBar: { ...wmsData.announcementBar, enabled: e.target.checked }
                })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <span>{wmsData.announcementBar.enabled ? 'Bar Enabled' : 'Bar Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Announcement Type</label>
              <select
                value={wmsData.announcementBar.type}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  announcementBar: { ...wmsData.announcementBar, type: e.target.value as AnnouncementType }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="Admission Open">Admission Open</option>
                <option value="Holiday Notice">Holiday Notice</option>
                <option value="New Batch">New Batch</option>
                <option value="Free Demo">Free Demo</option>
                <option value="Exam Updates">Exam Updates</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Background Color</label>
              <input
                type="color"
                value={wmsData.announcementBar.backgroundColor}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  announcementBar: { ...wmsData.announcementBar, backgroundColor: e.target.value }
                })}
                className="w-full h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">Announcement Text Message</label>
              <input
                type="text"
                value={wmsData.announcementBar.message}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  announcementBar: { ...wmsData.announcementBar, message: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Button Label</label>
              <input
                type="text"
                value={wmsData.announcementBar.buttonText}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  announcementBar: { ...wmsData.announcementBar, buttonText: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Button Link URL</label>
              <input
                type="text"
                value={wmsData.announcementBar.buttonLink}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  announcementBar: { ...wmsData.announcementBar, buttonLink: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: POPUPS & LEADS */}
      {activeTab === 'popups' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>Promotional Modal Popups & Lead Capture</span>
                </h3>
                <p className="text-xs text-slate-500">Manage popups for free demos, notes downloads, admissions, and batch notices with display rules.</p>
              </div>

              <button
                id="btn-add-popup"
                type="button"
                onClick={() => {
                  setEditingPopup({
                    id: `pop-${Date.now()}`,
                    title: 'New Lead Capture Popup',
                    subtitle: 'Subtitle details here',
                    type: 'Admission Popup',
                    ctaText: 'Submit Inquiry',
                    ctaLink: '/admissions',
                    displayRule: 'homepage_only',
                    delaySeconds: 5,
                    active: true
                  });
                  setIsPopupModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Popup Config</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wmsData.popups.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold">
                      {p.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${p.active ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                      {p.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{p.title}</h4>
                  <p className="text-xs text-slate-500">{p.subtitle}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span>Rule: {p.displayRule} ({p.delaySeconds}s delay)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPopup(p);
                          setIsPopupModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePopup(p.id)}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FOOTER MANAGER */}
      {activeTab === 'footer' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-amber-500" />
              <span>Global Footer Manager</span>
            </h3>
            <p className="text-xs text-slate-500">Edit central footer branding, contact addresses, copyright statement, and quick navigation links.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Campus Physical Address</label>
              <textarea
                rows={3}
                value={wmsData.footerConfig.address}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  footerConfig: { ...wmsData.footerConfig, address: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Copyright Notice Text</label>
              <textarea
                rows={3}
                value={wmsData.footerConfig.copyrightText}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  footerConfig: { ...wmsData.footerConfig, copyrightText: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Helpline Phone Numbers</label>
              <input
                type="text"
                value={wmsData.footerConfig.phone}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  footerConfig: { ...wmsData.footerConfig, phone: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Official Email Address</label>
              <input
                type="text"
                value={wmsData.footerConfig.email}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  footerConfig: { ...wmsData.footerConfig, email: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: THEME STYLING */}
      {activeTab === 'theme' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Palette size={18} className="text-amber-500" />
              <span>Theme Styling & Brand Identity</span>
            </h3>
            <p className="text-xs text-slate-500">Customize global brand colors, typography, logos, and border styles across the entire website.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 text-xs md:col-span-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Primary Color (Gold)</label>
                  <input
                    type="color"
                    value={wmsData.themeConfig.primaryColor}
                    onChange={e => onUpdateWMSData({
                      ...wmsData,
                      themeConfig: { ...wmsData.themeConfig, primaryColor: e.target.value }
                    })}
                    className="w-full h-10 rounded-xl cursor-pointer border"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Secondary (Navy/Slate)</label>
                  <input
                    type="color"
                    value={wmsData.themeConfig.secondaryColor}
                    onChange={e => onUpdateWMSData({
                      ...wmsData,
                      themeConfig: { ...wmsData.themeConfig, secondaryColor: e.target.value }
                    })}
                    className="w-full h-10 rounded-xl cursor-pointer border"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Accent Color (Emerald)</label>
                  <input
                    type="color"
                    value={wmsData.themeConfig.accentColor}
                    onChange={e => onUpdateWMSData({
                      ...wmsData,
                      themeConfig: { ...wmsData.themeConfig, accentColor: e.target.value }
                    })}
                    className="w-full h-10 rounded-xl cursor-pointer border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Primary Font Family</label>
                  <select
                    value={wmsData.themeConfig.fontFamily}
                    onChange={e => onUpdateWMSData({
                      ...wmsData,
                      themeConfig: { ...wmsData.themeConfig, fontFamily: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Button Style Preset</label>
                  <select
                    value={wmsData.themeConfig.buttonStyle}
                    onChange={e => onUpdateWMSData({
                      ...wmsData,
                      themeConfig: { ...wmsData.themeConfig, buttonStyle: e.target.value as any }
                    })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    <option value="rounded">Rounded Corners (16px)</option>
                    <option value="pill">Pill Shape (Full Rounded)</option>
                    <option value="sharp">Sharp Edges (4px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Palette Preview Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">Live Palette Preview</h4>
              <div className="space-y-2">
                <button
                  style={{ backgroundColor: wmsData.themeConfig.primaryColor }}
                  className="w-full py-2 rounded-xl text-white font-bold text-xs shadow-md"
                >
                  Primary CTA Button
                </button>

                <button
                  style={{ backgroundColor: wmsData.themeConfig.accentColor }}
                  className="w-full py-2 rounded-xl text-white font-bold text-xs shadow-md"
                >
                  Accent Emerald Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: SEO MANAGER */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          {/* SEO Audit Warning Box */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 dark:text-amber-200">
              <span className="font-extrabold block">SEO Health Audit Warning</span>
              <p>
                {missingSeoPages.length > 0 ? `${missingSeoPages.length} pages are missing SEO Meta Descriptions.` : 'All pages have SEO Titles and Meta Descriptions!'}
                {' '}
                {missingOgImages.length > 0 && `${missingOgImages.length} pages are missing Open Graph social share images.`}
              </p>
            </div>
          </div>

          {/* Page SEO List */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Search size={18} className="text-amber-500" />
                <span>Per-Page SEO & Social Metadata</span>
              </h3>

              <button
                id="btn-add-seo-page"
                type="button"
                onClick={() => {
                  setEditingSEO({
                    id: `seo-${Date.now()}`,
                    pageName: 'New Custom Page',
                    path: '/custom',
                    seoTitle: 'Page Title | Sunshine Classes',
                    metaDescription: 'Meta description for search engine listings.',
                    keywords: ['Sunshine Classes', 'Pihani'],
                    canonicalUrl: 'https://sunshineclasses.edu.in/custom',
                    ogImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
                    twitterCard: 'summary_large_image',
                    schemaJson: '{}',
                    updatedAt: new Date().toISOString().split('T')[0]
                  });
                  setIsSEOModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Page SEO</span>
              </button>
            </div>

            <div className="space-y-3">
              {wmsData.pageSeoConfigs.map(seo => (
                <div key={seo.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{seo.pageName}</span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">{seo.path}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingSEO(seo);
                        setIsSEOModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Edit size={12} />
                      <span>Edit SEO</span>
                    </button>
                  </div>

                  <p className="font-bold text-amber-600 dark:text-amber-400">{seo.seoTitle}</p>
                  <p className="text-slate-500">{seo.metaDescription}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: MEDIA LIBRARY */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={18} className="text-amber-500" />
                  <span>Central Media Library & Asset Manager</span>
                </h3>
                <p className="text-xs text-slate-500">Upload, organize into folders, copy image links, and check file optimization status.</p>
              </div>

              <button
                id="btn-upload-media-asset"
                type="button"
                onClick={() => setIsAddMediaModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud size={16} />
                <span>Upload Asset</span>
              </button>
            </div>

            {/* Folder Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                {['all', 'images', 'banners', 'logos', 'pdfs', 'videos', 'icons'].map(folder => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedMediaFolder(folder as any)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      selectedMediaFolder === folder ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {folder}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            {/* Media Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wmsData.mediaItems
                .filter(m => selectedMediaFolder === 'all' || m.folder === selectedMediaFolder)
                .filter(m => m.name.toLowerCase().includes(mediaSearch.toLowerCase()))
                .map(item => (
                  <div key={item.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 group">
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 relative">
                      {item.folder === 'pdfs' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 font-bold text-xs p-2 text-center">
                          <FileText size={28} />
                          <span className="truncate w-full mt-1">{item.name}</span>
                        </div>
                      ) : (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      )}

                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white capitalize">
                        {item.folder}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.sizeKb} KB • {item.compressionStatus}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.url)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy size={10} />
                        <span>{copiedUrl === item.url ? 'Copied!' : 'Copy Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(item.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: CONTACT DETAILS */}
      {activeTab === 'contact' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Phone size={18} className="text-amber-500" />
              <span>Centralized Campus Contact Details</span>
            </h3>
            <p className="text-xs text-slate-500">Updating contact details here automatically synchronizes across the entire public website.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Campus Physical Address</label>
              <textarea
                rows={3}
                value={wmsData.contactConfig.address}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  contactConfig: { ...wmsData.contactConfig, address: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Office Working Hours</label>
              <textarea
                rows={3}
                value={wmsData.contactConfig.officeHours}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  contactConfig: { ...wmsData.contactConfig, officeHours: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">WhatsApp Business Number</label>
              <input
                type="text"
                value={wmsData.contactConfig.whatsappNumber}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  contactConfig: { ...wmsData.contactConfig, whatsappNumber: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Google Maps Embed URL</label>
              <input
                type="text"
                value={wmsData.contactConfig.googleMapsEmbed}
                onChange={e => onUpdateWMSData({
                  ...wmsData,
                  contactConfig: { ...wmsData.contactConfig, googleMapsEmbed: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: SOCIAL MEDIA */}
      {activeTab === 'social' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 size={18} className="text-amber-500" />
              <span>Social Media Accounts Manager</span>
            </h3>
            <p className="text-xs text-slate-500">Configure public social channel links displayed in header and footer icons.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {['facebook', 'instagram', 'youtube', 'linkedin', 'telegram', 'whatsapp'].map(platform => (
              <div key={platform}>
                <label className="block text-slate-400 font-bold mb-1 capitalize">{platform} Profile URL</label>
                <input
                  type="text"
                  value={(wmsData.socialMediaConfig as any)[platform] || ''}
                  onChange={e => onUpdateWMSData({
                    ...wmsData,
                    socialMediaConfig: { ...wmsData.socialMediaConfig, [platform]: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 13: SETTINGS & RBAC */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={18} className="text-amber-500" />
                <span>Website Global Settings & Analytics</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Site Title</label>
                <input
                  type="text"
                  value={wmsData.websiteSettings.siteName}
                  onChange={e => onUpdateWMSData({
                    ...wmsData,
                    websiteSettings: { ...wmsData.websiteSettings, siteName: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Site Tagline</label>
                <input
                  type="text"
                  value={wmsData.websiteSettings.tagline}
                  onChange={e => onUpdateWMSData({
                    ...wmsData,
                    websiteSettings: { ...wmsData.websiteSettings, tagline: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Google Analytics ID</label>
                <input
                  type="text"
                  value={wmsData.websiteSettings.analyticsId}
                  onChange={e => onUpdateWMSData({
                    ...wmsData,
                    websiteSettings: { ...wmsData.websiteSettings, analyticsId: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Meta Pixel ID</label>
                <input
                  type="text"
                  value={wmsData.websiteSettings.metaPixelId}
                  onChange={e => onUpdateWMSData({
                    ...wmsData,
                    websiteSettings: { ...wmsData.websiteSettings, metaPixelId: e.target.value }
                  })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                />
              </div>
            </div>
          </div>

          {/* RBAC Matrix Overview */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Shield size={18} className="text-amber-500" />
              <span>Role-Based Permissions Matrix (RBAC)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <span className="font-black text-amber-500 block">Super Admin</span>
                <p className="text-[11px] text-slate-500 mt-1">Full control over WMS layout, settings, maintenance mode, and RBAC roles.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <span className="font-black text-indigo-500 block">Admin</span>
                <p className="text-[11px] text-slate-500 mt-1">Full website management, section reordering, media uploads, and popups.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <span className="font-black text-emerald-500 block">Content Editor</span>
                <p className="text-[11px] text-slate-500 mt-1">Can edit pages, blogs, study materials, and Sunshine Store products.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <span className="font-black text-blue-500 block">Marketing Manager</span>
                <p className="text-[11px] text-slate-500 mt-1">Controls SEO metadata, hero banners, popups, and analytics tracking.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HERO BANNER FORM */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Hero Banner Settings</h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Banner Title</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title}
                  onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Subtitle / Badge</label>
                <input
                  type="text"
                  value={editingBanner.subtitle}
                  onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingBanner.description}
                  onChange={e => setEditingBanner({ ...editingBanner, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={editingBanner.ctaButton}
                    onChange={e => setEditingBanner({ ...editingBanner, ctaButton: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">CTA Link URL</label>
                  <input
                    type="text"
                    value={editingBanner.ctaLink}
                    onChange={e => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Desktop Background Image URL</label>
                <input
                  type="text"
                  value={editingBanner.backgroundImage}
                  onChange={e => setEditingBanner({ ...editingBanner, backgroundImage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-black cursor-pointer shadow-md"
                >
                  Save Hero Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NAV MENU FORM */}
      {isNavModalOpen && editingNav && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Navigation Item Config</h3>
              <button onClick={() => setIsNavModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNav} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Menu Label</label>
                <input
                  type="text"
                  required
                  value={editingNav.label}
                  onChange={e => setEditingNav({ ...editingNav, label: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Link URL</label>
                <input
                  type="text"
                  required
                  value={editingNav.link}
                  onChange={e => setEditingNav({ ...editingNav, link: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingNav.isMegaMenu || false}
                    onChange={e => setEditingNav({ ...editingNav, isMegaMenu: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span>Enable Mega Menu Dropdown</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNavModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-black cursor-pointer shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POPUP FORM */}
      {isPopupModalOpen && editingPopup && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Promotional Popup Config</h3>
              <button onClick={() => setIsPopupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePopup} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Popup Title</label>
                <input
                  type="text"
                  required
                  value={editingPopup.title}
                  onChange={e => setEditingPopup({ ...editingPopup, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Subtitle / Body Text</label>
                <textarea
                  rows={2}
                  value={editingPopup.subtitle}
                  onChange={e => setEditingPopup({ ...editingPopup, subtitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Display Rule</label>
                  <select
                    value={editingPopup.displayRule}
                    onChange={e => setEditingPopup({ ...editingPopup, displayRule: e.target.value as PopupDisplayRule })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                  >
                    <option value="homepage_only">Homepage Only</option>
                    <option value="all_pages">All Pages</option>
                    <option value="selected_pages">Selected Pages</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Delay (Seconds)</label>
                  <input
                    type="number"
                    value={editingPopup.delaySeconds}
                    onChange={e => setEditingPopup({ ...editingPopup, delaySeconds: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPopupModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-black cursor-pointer shadow-md"
                >
                  Save Popup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGE SEO FORM */}
      {isSEOModalOpen && editingSEO && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Page SEO Metadata Config</h3>
              <button onClick={() => setIsSEOModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSEO} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Page Name</label>
                <input
                  type="text"
                  required
                  value={editingSEO.pageName}
                  onChange={e => setEditingSEO({ ...editingSEO, pageName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">SEO Title Tag (&lt;title&gt;)</label>
                <input
                  type="text"
                  required
                  value={editingSEO.seoTitle}
                  onChange={e => setEditingSEO({ ...editingSEO, seoTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingSEO.metaDescription}
                  onChange={e => setEditingSEO({ ...editingSEO, metaDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSEOModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-black cursor-pointer shadow-md"
                >
                  Save SEO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDIA UPLOAD */}
      {isAddMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Upload / Add Media Asset</h3>
              <button onClick={() => setIsAddMediaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. topper-banner-2026.jpg"
                  value={newMediaName}
                  onChange={e => setNewMediaName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Select Folder</label>
                <select
                  value={newMediaFolder}
                  onChange={e => setNewMediaFolder(e.target.value as MediaFolder)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-bold"
                >
                  <option value="images">Images</option>
                  <option value="banners">Banners</option>
                  <option value="logos">Logos</option>
                  <option value="pdfs">PDFs</option>
                  <option value="videos">Videos</option>
                  <option value="icons">Icons</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Image / Asset URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newMediaUrl}
                  onChange={e => setNewMediaUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMediaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-white font-black cursor-pointer shadow-md"
                >
                  Add Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE RESPONSIVE DEVICE PREVIEW */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 w-full max-w-6xl rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
            {/* Control Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Live Website Device Canvas</h3>
                  <p className="text-[11px] text-slate-400">Rendering active homepage sections, themes, and navigation</p>
                </div>
              </div>

              {/* Device Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  id="preview-wms-desktop"
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor size={15} />
                  <span>Desktop</span>
                </button>

                <button
                  id="preview-wms-tablet"
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'tablet' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet size={15} />
                  <span>Tablet</span>
                </button>

                <button
                  id="preview-wms-mobile"
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={15} />
                  <span>Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowLivePreviewModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Device Frame Canvas */}
            <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex items-center justify-center">
              <div
                className={`bg-white text-slate-900 transition-all duration-300 overflow-y-auto ${
                  previewDevice === 'desktop'
                    ? 'w-full max-w-5xl rounded-2xl shadow-xl border border-slate-200'
                    : previewDevice === 'tablet'
                    ? 'w-[740px] max-w-full rounded-2xl shadow-xl border border-slate-200'
                    : 'w-[375px] max-w-full rounded-[40px] shadow-2xl border-[10px] border-slate-800 relative my-4'
                }`}
              >
                {/* Announcement Bar inside preview */}
                {wmsData.announcementBar.enabled && (
                  <div
                    style={{ backgroundColor: wmsData.announcementBar.backgroundColor, color: wmsData.announcementBar.textColor }}
                    className="p-2.5 text-center text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <span>{wmsData.announcementBar.message}</span>
                    <span className="underline font-black">{wmsData.announcementBar.buttonText}</span>
                  </div>
                )}

                {/* Header Navbar */}
                <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white">
                  <div className="flex items-center gap-2 font-extrabold text-sm">
                    <Globe size={18} className="text-amber-500" />
                    <span>{wmsData.websiteSettings.siteName}</span>
                  </div>

                  <div className="hidden md:flex items-center gap-4 text-xs font-semibold">
                    {wmsData.navMenuItems.filter(n => n.active).map(nav => (
                      <span key={nav.id}>{nav.label}</span>
                    ))}
                  </div>
                </div>

                {/* Active Homepage Sections rendered in order */}
                <div className="space-y-8 p-6">
                  {wmsData.homepageSections
                    .filter(s => s.enabled)
                    .map(sec => (
                      <div key={sec.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block">
                          Section #{sec.displayOrder} • {sec.name}
                        </span>
                        <h3 className="font-extrabold text-lg text-slate-900">{sec.title}</h3>
                        <p className="text-xs text-slate-600">{sec.subtitle}</p>

                        {sec.ctaText && (
                          <button className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs">
                            {sec.ctaText}
                          </button>
                        )}
                      </div>
                    ))}
                </div>

                {/* Footer preview */}
                <div className="p-6 bg-slate-950 text-white text-xs space-y-3">
                  <p className="font-bold">{wmsData.footerConfig.address}</p>
                  <p className="text-slate-400">{wmsData.footerConfig.copyrightText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
