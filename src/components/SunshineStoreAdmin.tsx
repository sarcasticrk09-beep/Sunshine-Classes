import React, { useState, useEffect, useMemo } from 'react';
import { 
  StoreProduct, 
  StoreCategory, 
  StoreBrand, 
  StoreSetting, 
  StoreProductType, 
  PurchaseLink,
  StoreAnalyticsLog,
  StoreReview
} from '../types';
import { 
  subscribeStoreProducts, 
  getLocalStoreCategories, 
  saveLocalStoreCategories, 
  getLocalStoreBrands, 
  saveLocalStoreBrands, 
  getLocalStoreSettings, 
  saveLocalStoreSettings, 
  getLocalStoreAnalytics,
  saveLocalStoreProducts,
  getLocalStoreProducts,
  addStoreReview,
  updateStoreReview,
  deleteStoreReview,
  bulkUpdateProducts,
  bulkDeleteProducts,
  exportProductsToCSV
} from '../services/storeService';
import { db } from '../lib/firebase';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  ShoppingBag, 
  BookOpen, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  MousePointer, 
  BarChart2, 
  Settings, 
  Sparkles, 
  Check, 
  X, 
  ExternalLink, 
  Layers, 
  Tag, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Star,
  Globe,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  ThumbsUp,
  Award,
  Filter,
  AlertTriangle,
  FileText,
  CheckSquare,
  Download,
  Copy,
  RefreshCw,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  Lock
} from 'lucide-react';

export const SunshineStoreAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTS' | 'CATEGORIES' | 'BRANDS' | 'REVIEWS' | 'SETTINGS'>('DASHBOARD');

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [brands, setBrands] = useState<StoreBrand[]>([]);
  const [settings, setSettings] = useState<StoreSetting>(getLocalStoreSettings());
  const [analyticsLogs, setAnalyticsLogs] = useState<StoreAnalyticsLog[]>([]);

  // Search/Filter state for admin product list
  const [productSearch, setProductSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Book' | 'Resource'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL');
  const [qualityFilter, setQualityFilter] = useState<'ALL' | 'MISSING_IMAGE' | 'MISSING_SEO' | 'MISSING_LINKS' | 'MISSING_RECOMMENDATION'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  // Bulk Selection & Operations
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState('');
  const [isBulkBrandModalOpen, setIsBulkBrandModalOpen] = useState(false);
  const [bulkTargetBrandId, setBulkTargetBrandId] = useState('');

  // CSV Import Modal & Toast Notification
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importSummary, setImportSummary] = useState<{ imported: number; errors: string[] } | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editor helper inputs
  const [tagInput, setTagInput] = useState('');
  const [keyFeatureInput, setKeyFeatureInput] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal State for Product Editing/Creation
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProduct> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Device Preview Modal State
  const [previewProduct, setPreviewProduct] = useState<Partial<StoreProduct> | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Modal State for Category
  const [editingCategory, setEditingCategory] = useState<Partial<StoreCategory> | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Modal State for Brand
  const [editingBrand, setEditingBrand] = useState<Partial<StoreBrand> | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Review State & Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetProductId, setReviewTargetProductId] = useState<string>('');
  const [editingReview, setEditingReview] = useState<Partial<StoreReview> | null>(null);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewProductFilter, setReviewProductFilter] = useState('ALL');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number>(0);

  // Flatten all reviews with product reference
  const allProductReviews = useMemo(() => {
    const list: { product: StoreProduct; review: StoreReview }[] = [];
    products.forEach(p => {
      if (p.reviews && p.reviews.length > 0) {
        p.reviews.forEach(r => {
          list.push({ product: p, review: r });
        });
      }
    });
    return list;
  }, [products]);

  const filteredReviews = useMemo(() => {
    return allProductReviews.filter(({ product, review }) => {
      if (reviewProductFilter !== 'ALL' && product.id !== reviewProductFilter) return false;
      if (reviewRatingFilter > 0 && review.rating !== reviewRatingFilter) return false;
      if (reviewSearch) {
        const q = reviewSearch.toLowerCase();
        const matchName = review.reviewerName.toLowerCase().includes(q);
        const matchComment = review.comment.toLowerCase().includes(q);
        const matchRole = (review.reviewerRole || '').toLowerCase().includes(q);
        const matchProd = product.title.toLowerCase().includes(q);
        return matchName || matchComment || matchRole || matchProd;
      }
      return true;
    });
  }, [allProductReviews, reviewProductFilter, reviewRatingFilter, reviewSearch]);

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetProductId || !editingReview?.reviewerName || !editingReview?.comment) return;

    if (editingReview.id) {
      const updatedProds = await updateStoreReview(reviewTargetProductId, editingReview.id, {
        reviewerName: editingReview.reviewerName,
        reviewerRole: editingReview.reviewerRole || 'Verified Aspirant',
        rating: editingReview.rating || 5,
        comment: editingReview.comment,
        date: editingReview.date || new Date().toISOString().split('T')[0],
        isVerifiedBuyer: editingReview.isVerifiedBuyer !== undefined ? editingReview.isVerifiedBuyer : true
      });
      setProducts(updatedProds);
      // Also update editingProduct if currently open in product modal
      if (editingProduct && editingProduct.id === reviewTargetProductId) {
        const updated = updatedProds.find(p => p.id === reviewTargetProductId);
        if (updated) setEditingProduct(updated);
      }
    } else {
      const updatedProds = await addStoreReview(reviewTargetProductId, {
        reviewerName: editingReview.reviewerName,
        reviewerRole: editingReview.reviewerRole || 'Verified Aspirant',
        rating: editingReview.rating || 5,
        comment: editingReview.comment,
        date: editingReview.date || new Date().toISOString().split('T')[0],
        isVerifiedBuyer: editingReview.isVerifiedBuyer !== undefined ? editingReview.isVerifiedBuyer : true
      });
      setProducts(updatedProds);
      if (editingProduct && editingProduct.id === reviewTargetProductId) {
        const updated = updatedProds.find(p => p.id === reviewTargetProductId);
        if (updated) setEditingProduct(updated);
      }
    }

    setIsReviewModalOpen(false);
    setEditingReview(null);
    setReviewTargetProductId('');
  };

  const handleDeleteReview = async (productId: string, reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    const updatedProds = await deleteStoreReview(productId, reviewId);
    setProducts(updatedProds);
    if (editingProduct && editingProduct.id === productId) {
      const updated = updatedProds.find(p => p.id === productId);
      if (updated) setEditingProduct(updated);
    }
  };

  useEffect(() => {
    const unsub = subscribeStoreProducts((data) => {
      setProducts(data);
    });
    setCategories(getLocalStoreCategories());
    setBrands(getLocalStoreBrands());
    setSettings(getLocalStoreSettings());
    setAnalyticsLogs(getLocalStoreAnalytics());

    return () => unsub();
  }, []);

  // Compute Quality Metrics
  const qualityMetrics = useMemo(() => {
    const missingImage = products.filter(p => !p.featuredImage || p.featuredImage.trim() === '' || p.featuredImage.includes('placeholder')).length;
    const missingSeo = products.filter(p => !p.seoTitle || !p.metaDescription || p.seoTitle.trim() === '' || p.metaDescription.trim() === '').length;
    const missingLinks = products.filter(p => !p.purchaseLinks || p.purchaseLinks.length === 0 || !p.purchaseLinks.some(l => l.url)).length;
    const missingRec = products.filter(p => !p.whySunshineRecommends || p.whySunshineRecommends.trim() === '').length;
    return { missingImage, missingSeo, missingLinks, missingRec };
  }, [products]);

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = exportProductsToCSV(products);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sunshine-store-products-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Products exported to CSV file successfully!');
  };

  const handleExportSelectedCSV = () => {
    const selected = products.filter(p => selectedProductIds.includes(p.id));
    if (selected.length === 0) return;
    const csvContent = exportProductsToCSV(selected);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sunshine-store-selected-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selected.length} selected products to CSV!`);
  };

  // Import CSV
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvText.trim()) return;

    const lines = importCsvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      setImportSummary({ imported: 0, errors: ['CSV content is empty or contains only header row.'] });
      return;
    }

    const errors: string[] = [];
    const newProducts: StoreProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 2 || !cols[1]) {
        errors.push(`Row ${i + 1}: Title is required.`);
        continue;
      }

      const title = cols[1];
      const prodType = (cols[3] === 'Resource' ? 'Resource' : 'Book') as StoreProductType;
      const pid = cols[0] || ('prod-imp-' + Date.now() + '-' + i);
      const slug = cols[2] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const importedProd: StoreProduct = {
        id: pid,
        title,
        slug,
        type: prodType,
        shortDescription: 'Imported educational resource.',
        fullDescription: 'Imported via CSV batch management.',
        featuredImage: cols[13] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        categoryId: categories[0]?.id || 'cat-1',
        categoryName: cols[4] || categories[0]?.name || 'General',
        brandName: cols[5] || '',
        publisher: cols[6] || '',
        author: cols[7] || '',
        class: cols[8] || '',
        subject: cols[9] || '',
        tags: ['imported'],
        whySunshineRecommends: 'Recommended study material for board & competitive exams.',
        purchaseLinks: [{ id: 'link-1', platform: 'Amazon', url: 'https://amazon.in', displayOrder: 1, active: true }],
        status: (cols[10] === 'DRAFT' || cols[10] === 'ARCHIVED') ? cols[10] : 'PUBLISHED',
        viewsCount: 0,
        totalClicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newProducts.push(importedProd);
    }

    if (newProducts.length > 0) {
      const merged = [...newProducts, ...products];
      saveLocalStoreProducts(merged);
      setProducts(merged);
      for (const p of newProducts) {
        try {
          await setDoc(doc(db, 'store_products', p.id), p, { merge: true });
        } catch (e) {}
      }
    }

    setImportSummary({ imported: newProducts.length, errors });
    if (newProducts.length > 0) {
      showToast(`Successfully imported ${newProducts.length} products!`);
    }
  };

  // Bulk Operations
  const handleBulkPublish = async () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    const updated = await bulkUpdateProducts(selectedProductIds, { status: 'PUBLISHED' });
    setProducts(updated);
    setSelectedProductIds([]);
    showToast(`Published ${count} products successfully!`);
  };

  const handleBulkArchive = async () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    const updated = await bulkUpdateProducts(selectedProductIds, { status: 'ARCHIVED' });
    setProducts(updated);
    setSelectedProductIds([]);
    showToast(`Archived ${count} products!`);
  };

  const handleBulkDraft = async () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    const updated = await bulkUpdateProducts(selectedProductIds, { status: 'DRAFT' });
    setProducts(updated);
    setSelectedProductIds([]);
    showToast(`Set ${count} products to Draft!`);
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    if (!window.confirm(`Are you sure you want to delete ${count} selected products?`)) return;
    const remaining = await bulkDeleteProducts(selectedProductIds);
    setProducts(remaining);
    setSelectedProductIds([]);
    showToast(`Deleted ${count} products!`);
  };

  const handleBulkSetCategory = async () => {
    if (selectedProductIds.length === 0 || !bulkTargetCategoryId) return;
    const cat = categories.find(c => c.id === bulkTargetCategoryId);
    if (!cat) return;
    const count = selectedProductIds.length;
    const updated = await bulkUpdateProducts(selectedProductIds, { categoryId: cat.id, categoryName: cat.name });
    setProducts(updated);
    setIsBulkCategoryModalOpen(false);
    setSelectedProductIds([]);
    showToast(`Set category for ${count} products!`);
  };

  const handleBulkSetBrand = async () => {
    if (selectedProductIds.length === 0 || !bulkTargetBrandId) return;
    const brand = brands.find(b => b.id === bulkTargetBrandId);
    if (!brand) return;
    const count = selectedProductIds.length;
    const updated = await bulkUpdateProducts(selectedProductIds, { brandId: brand.id, brandName: brand.name });
    setProducts(updated);
    setIsBulkBrandModalOpen(false);
    setSelectedProductIds([]);
    showToast(`Set brand for ${count} products!`);
  };
  const totalProducts = products.length;
  const totalBooks = products.filter(p => p.type === 'Book').length;
  const totalResources = products.filter(p => p.type === 'Resource').length;
  const totalFeatured = products.filter(p => p.isFeatured || p.isMostRecommended).length;
  const totalPublished = products.filter(p => p.status === 'PUBLISHED').length;
  const totalDraft = products.filter(p => p.status === 'DRAFT').length;

  const totalViews = useMemo(() => products.reduce((acc, p) => acc + (p.viewsCount || 0), 0), [products]);
  const totalClicks = useMemo(() => products.reduce((acc, p) => acc + (p.totalClicks || 0), 0), [products]);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

  const topPerformingProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0)).slice(0, 5);
  }, [products]);

  // Click Heatmap Platform Breakdown
  const platformClickData = useMemo(() => {
    const stats: Record<string, { clicks: number; linksCount: number }> = {
      Amazon: { clicks: 0, linksCount: 0 },
      Flipkart: { clicks: 0, linksCount: 0 },
      Publisher: { clicks: 0, linksCount: 0 },
      'Official Website': { clicks: 0, linksCount: 0 },
      Custom: { clicks: 0, linksCount: 0 }
    };

    products.forEach(p => {
      if (p.purchaseLinks) {
        p.purchaseLinks.forEach(link => {
          const plat = link.platform || 'Custom';
          if (!stats[plat]) stats[plat] = { clicks: 0, linksCount: 0 };
          const linkClick = link.clickCount !== undefined ? link.clickCount : (p.totalClicks ? Math.round(p.totalClicks / Math.max(1, p.purchaseLinks.length)) : 0);
          stats[plat].clicks += linkClick;
          stats[plat].linksCount += 1;
        });
      }
    });

    const grandTotal = Object.values(stats).reduce((acc, curr) => acc + curr.clicks, 0) || 1;

    return Object.entries(stats).map(([platform, data]) => ({
      platform,
      clicks: data.clicks,
      linksCount: data.linksCount,
      percentage: Math.round((data.clicks / grandTotal) * 100)
    })).sort((a, b) => b.clicks - a.clicks);
  }, [products]);

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title) return;

    const isNew = !editingProduct.id;
    const prodId = editingProduct.id || 'prod-' + Date.now();
    const slug = editingProduct.slug || editingProduct.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const completeProduct: StoreProduct = {
      id: prodId,
      type: editingProduct.type || 'Book',
      title: editingProduct.title,
      slug: slug,
      shortDescription: editingProduct.shortDescription || '',
      fullDescription: editingProduct.fullDescription || '',
      featuredImage: editingProduct.featuredImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      gallery: editingProduct.gallery || [],
      categoryId: editingProduct.categoryId || categories[0]?.id || 'cat-1',
      categoryName: editingProduct.categoryName || categories.find(c => c.id === editingProduct.categoryId)?.name || 'General',
      brandId: editingProduct.brandId || '',
      brandName: editingProduct.brandName || '',
      publisher: editingProduct.publisher || '',
      author: editingProduct.author || '',
      class: editingProduct.class || '',
      subject: editingProduct.subject || '',
      tags: editingProduct.tags || [],
      whySunshineRecommends: editingProduct.whySunshineRecommends || '',
      keyFeatures: editingProduct.keyFeatures || [],
      specifications: editingProduct.specifications || {},
      isFeatured: editingProduct.isFeatured || false,
      isTrending: editingProduct.isTrending || false,
      isStaffPick: editingProduct.isStaffPick || false,
      isNewArrival: editingProduct.isNewArrival || false,
      isMostRecommended: editingProduct.isMostRecommended || false,
      purchaseLinks: editingProduct.purchaseLinks || [
        { id: 'link-1', platform: 'Amazon', url: 'https://amazon.in', displayOrder: 1, active: true }
      ],
      seoTitle: editingProduct.seoTitle || editingProduct.title,
      metaDescription: editingProduct.metaDescription || editingProduct.shortDescription,
      keywords: editingProduct.keywords || [],
      status: editingProduct.status || 'PUBLISHED',
      viewsCount: editingProduct.viewsCount || 0,
      totalClicks: editingProduct.totalClicks || 0,
      createdAt: editingProduct.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update Local + Firestore
    const updatedList = isNew ? [completeProduct, ...products] : products.map(p => p.id === prodId ? completeProduct : p);
    saveLocalStoreProducts(updatedList);
    setProducts(updatedList);

    try {
      await setDoc(doc(db, 'store_products', prodId), completeProduct, { merge: true });
    } catch (e) {
      console.warn('Firestore update store_products failed:', e);
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store product?')) return;
    const updatedList = products.filter(p => p.id !== id);
    saveLocalStoreProducts(updatedList);
    setProducts(updatedList);

    try {
      await deleteDoc(doc(db, 'store_products', id));
    } catch (e) {
      console.warn('Delete from firestore failed:', e);
    }
  };

  // Handle Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    const isNew = !editingCategory.id;
    const catId = editingCategory.id || 'cat-' + Date.now();
    const slug = editingCategory.slug || editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const completeCategory: StoreCategory = {
      id: catId,
      name: editingCategory.name,
      slug: slug,
      productType: editingCategory.productType || 'Book',
      description: editingCategory.description || '',
      displayOrder: editingCategory.displayOrder || 1,
      isActive: editingCategory.isActive !== undefined ? editingCategory.isActive : true
    };

    const updated = isNew ? [...categories, completeCategory] : categories.map(c => c.id === catId ? completeCategory : c);
    saveLocalStoreCategories(updated);
    setCategories(updated);

    try {
      await setDoc(doc(db, 'store_categories', catId), completeCategory, { merge: true });
    } catch (e) {}

    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // Handle Save Brand
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand?.name) return;

    const isNew = !editingBrand.id;
    const brandId = editingBrand.id || 'brand-' + Date.now();
    const slug = editingBrand.slug || editingBrand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const completeBrand: StoreBrand = {
      id: brandId,
      name: editingBrand.name,
      slug: slug,
      type: editingBrand.type || 'BOTH',
      website: editingBrand.website || '',
      description: editingBrand.description || '',
      isActive: editingBrand.isActive !== undefined ? editingBrand.isActive : true
    };

    const updated = isNew ? [...brands, completeBrand] : brands.map(b => b.id === brandId ? completeBrand : b);
    saveLocalStoreBrands(updated);
    setBrands(updated);

    try {
      await setDoc(doc(db, 'store_brands', brandId), completeBrand, { merge: true });
    } catch (e) {}

    setIsBrandModalOpen(false);
    setEditingBrand(null);
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    saveLocalStoreSettings(settings);
    try {
      await setDoc(doc(db, 'store_settings', 'main'), settings, { merge: true });
      alert('Store settings saved successfully!');
    } catch (e) {
      alert('Settings saved locally.');
    }
  };

  // Filtered product table
  const filteredAdminProducts = products.filter(p => {
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter && p.categoryName !== categoryFilter) return false;
    if (brandFilter !== 'ALL' && p.brandId !== brandFilter && p.brandName !== brandFilter && p.publisher !== brandFilter) return false;

    if (qualityFilter === 'MISSING_IMAGE') {
      if (p.featuredImage && p.featuredImage.trim() !== '' && !p.featuredImage.includes('placeholder')) return false;
    } else if (qualityFilter === 'MISSING_SEO') {
      if (p.seoTitle && p.metaDescription && p.seoTitle.trim() !== '' && p.metaDescription.trim() !== '') return false;
    } else if (qualityFilter === 'MISSING_LINKS') {
      if (p.purchaseLinks && p.purchaseLinks.length > 0 && p.purchaseLinks.some(l => l.url)) return false;
    } else if (qualityFilter === 'MISSING_RECOMMENDATION') {
      if (p.whySunshineRecommends && p.whySunshineRecommends.trim() !== '') return false;
    }

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAuthor = p.author?.toLowerCase().includes(q);
      const matchPublisher = p.publisher?.toLowerCase().includes(q);
      const matchClass = p.class?.toLowerCase().includes(q);
      const matchSubject = p.subject?.toLowerCase().includes(q);
      const matchTags = p.tags?.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchAuthor || matchPublisher || matchClass || matchSubject || matchTags;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg text-xs font-bold text-white transition-all ${
          toastMessage.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          <div className="flex items-center gap-2">
            <Check size={18} />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Module Title Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white font-display">Sunshine Store Admin</h1>
            <p className="text-xs text-slate-500">Curated book & educational resource recommendations manager</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            title="Export all store products to CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-import-csv"
            onClick={() => {
              setImportCsvText('');
              setImportSummary(null);
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            title="Import products batch from CSV text"
          >
            <Upload size={15} />
            <span>Import CSV</span>
          </button>

          <button
            id="btn-add-product"
            onClick={() => {
              setEditingProduct({
                type: 'Book',
                status: 'PUBLISHED',
                purchaseLinks: [{ id: 'link-1', platform: 'Amazon', url: '', displayOrder: 1, active: true }]
              });
              setTagInput('');
              setKeyFeatureInput('');
              setGalleryUrlInput('');
              setIsProductModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {[
          { id: 'DASHBOARD', label: 'Dashboard Overview', icon: BarChart2 },
          { id: 'PRODUCTS', label: `Products (${products.length})`, icon: Package },
          { id: 'CATEGORIES', label: `Categories (${categories.length})`, icon: Layers },
          { id: 'BRANDS', label: `Brands & Publishers (${brands.length})`, icon: Globe },
          { id: 'REVIEWS', label: `Reviews (${allProductReviews.length})`, icon: MessageSquare },
          { id: 'SETTINGS', label: 'Store Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border-b-2 ${
                isActive
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalProducts}</p>
              <span className="text-[11px] text-slate-500">{totalBooks} Books • {totalResources} Resources</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Published</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalPublished}</p>
              <span className="text-[11px] text-slate-500">{totalDraft} Drafts</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Featured</span>
              <p className="text-2xl font-black text-amber-500">{totalFeatured}</p>
              <span className="text-[11px] text-slate-500">Top Picks</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Views</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalViews}</p>
              <span className="text-[11px] text-slate-500">Across Store</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affiliate Clicks</span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalClicks}</p>
              <span className="text-[11px] text-slate-500">External Links</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Click Through CTR</span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{ctr}%</p>
              <span className="text-[11px] text-slate-500">Conversion Rate</span>
            </div>
          </div>

          {/* Content Quality Warnings Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>Product Quality Indicators & Warnings</span>
              </h3>
              <span className="text-[11px] text-slate-400">Click a card to review affected catalog items</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                id="quality-card-missing-image"
                onClick={() => {
                  setQualityFilter('MISSING_IMAGE');
                  setActiveTab('PRODUCTS');
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">Missing Image</span>
                  <ImageIcon size={14} className="text-amber-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{qualityMetrics.missingImage}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Needs featured thumbnail</span>
              </button>

              <button
                id="quality-card-missing-seo"
                onClick={() => {
                  setQualityFilter('MISSING_SEO');
                  setActiveTab('PRODUCTS');
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">Incomplete SEO</span>
                  <Search size={14} className="text-amber-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{qualityMetrics.missingSeo}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Needs Title / Meta</span>
              </button>

              <button
                id="quality-card-missing-links"
                onClick={() => {
                  setQualityFilter('MISSING_LINKS');
                  setActiveTab('PRODUCTS');
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">No Purchase Links</span>
                  <ExternalLink size={14} className="text-amber-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{qualityMetrics.missingLinks}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Missing affiliate URLs</span>
              </button>

              <button
                id="quality-card-missing-rec"
                onClick={() => {
                  setQualityFilter('MISSING_RECOMMENDATION');
                  setActiveTab('PRODUCTS');
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/80 text-left transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-[11px] font-bold">Missing Faculty Note</span>
                  <Sparkles size={14} className="text-amber-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{qualityMetrics.missingRec}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Needs Sunshine endorsement</span>
              </button>
            </div>
          </div>

          {/* Click Heatmap & Platform Performance Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 size={16} className="text-amber-500" />
                  <span>Click Heatmap & Purchase Link Analytics</span>
                </h3>
                <p className="text-[11px] text-slate-400">Helps decide which purchase links perform best for board students</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-extrabold text-[10px]">
                {totalClicks} Total Affiliate Clicks
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {platformClickData.map(item => {
                let colorBg = 'bg-amber-500';
                if (item.platform === 'Amazon') colorBg = 'bg-amber-500';
                else if (item.platform === 'Flipkart') colorBg = 'bg-blue-600';
                else if (item.platform === 'Publisher') colorBg = 'bg-emerald-600';
                else if (item.platform === 'Official Website') colorBg = 'bg-indigo-600';
                else colorBg = 'bg-purple-600';

                return (
                  <div key={item.platform} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">{item.platform}</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.linksCount} links</span>
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-black text-slate-900 dark:text-white">{item.clicks} <span className="text-[10px] font-bold text-slate-400 uppercase">Clicks</span></p>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">{item.percentage}%</span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${colorBg} transition-all duration-500`} style={{ width: `${Math.max(4, item.percentage)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Performing & Recently Added Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Clicked Affiliate Items */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-500" />
                <span>Top Performing Affiliate Items</span>
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {topPerformingProducts.map(p => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={p.featuredImage} alt={p.title} className="w-9 h-9 rounded-lg object-contain bg-slate-50 p-0.5 border border-slate-200 dark:border-slate-700" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-400">{p.publisher || p.brandName}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">{p.totalClicks || 0} clicks</span>
                      <p className="text-[10px] text-slate-400">{p.viewsCount || 0} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Categories Overview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-amber-500" />
                <span>Category Breakdown</span>
              </h3>
              <div className="space-y-2 text-xs">
                {categories.map(c => {
                  const count = products.filter(p => p.categoryId === c.id || p.categoryName === c.name).length;
                  return (
                    <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                        {count} items
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PRODUCTS TABLE */}
      {activeTab === 'PRODUCTS' && (
        <div className="space-y-4">
          
          {/* Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Search by title, author, publisher, subject, class, or tag..."
                  className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium"
                />
                {productSearch && (
                  <button onClick={() => setProductSearch('')} className="text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e: any) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="Book">Books Only</option>
                  <option value="Resource">Resources Only</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e: any) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none max-w-[160px] truncate"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={brandFilter}
                  onChange={(e: any) => setBrandFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-200 outline-none max-w-[160px] truncate"
                >
                  <option value="ALL">All Brands/Publishers</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>

                <select
                  value={qualityFilter}
                  onChange={(e: any) => setQualityFilter(e.target.value)}
                  className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 font-extrabold text-amber-900 dark:text-amber-200 outline-none"
                >
                  <option value="ALL">All Quality Checks</option>
                  <option value="MISSING_IMAGE">⚠️ Missing Image ({qualityMetrics.missingImage})</option>
                  <option value="MISSING_SEO">⚠️ Incomplete SEO ({qualityMetrics.missingSeo})</option>
                  <option value="MISSING_LINKS">⚠️ No Purchase Links ({qualityMetrics.missingLinks})</option>
                  <option value="MISSING_RECOMMENDATION">⚠️ Missing Faculty Note ({qualityMetrics.missingRec})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar (when 1 or more products selected) */}
          {selectedProductIds.length > 0 && (
            <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold">
                <CheckSquare size={18} />
                <span>{selectedProductIds.length} product(s) selected</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-bulk-publish"
                  onClick={handleBulkPublish}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer"
                >
                  Publish Selected
                </button>

                <button
                  id="btn-bulk-draft"
                  onClick={handleBulkDraft}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer"
                >
                  Set Draft
                </button>

                <button
                  id="btn-bulk-archive"
                  onClick={handleBulkArchive}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer"
                >
                  Archive Selected
                </button>

                <button
                  id="btn-bulk-category"
                  onClick={() => setIsBulkCategoryModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer"
                >
                  Set Category
                </button>

                <button
                  id="btn-bulk-brand"
                  onClick={() => setIsBulkBrandModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer"
                >
                  Set Brand
                </button>

                <button
                  id="btn-bulk-export"
                  onClick={handleExportSelectedCSV}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>

                <button
                  id="btn-bulk-delete"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => setSelectedProductIds([])}
                  className="px-2 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white/90 font-bold"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredAdminProducts.length > 0 && selectedProductIds.length === filteredAdminProducts.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedProductIds(filteredAdminProducts.map(p => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="rounded text-amber-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Type & Category</th>
                    <th className="p-3.5">Publisher/Brand</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Views / Clicks</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredAdminProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No products match the selected filters or search terms.
                      </td>
                    </tr>
                  ) : filteredAdminProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedProductIds([...selectedProductIds, p.id]);
                            } else {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded text-amber-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.featuredImage} alt={p.title} className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-0.5" />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                            <span className="text-[10px] text-slate-400">/{p.slug}</span>
                            {p.internalNotes && (
                              <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-[10px] text-amber-800 dark:text-amber-300 font-semibold max-w-xs truncate" title={p.internalNotes}>
                                <Lock size={10} className="text-amber-500 shrink-0" />
                                <span className="truncate">Note: {p.internalNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{p.type}</span>
                        <span className="text-[11px] text-slate-500">{p.categoryName}</span>
                      </td>

                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {p.publisher || p.brandName || '-'}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          p.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          p.status === 'DRAFT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-bold">
                        <span className="text-blue-600 dark:text-blue-400">{p.viewsCount || 0}</span> / <span className="text-purple-600 dark:text-purple-400">{p.totalClicks || 0}</span>
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          id={`btn-preview-product-${p.id}`}
                          onClick={() => {
                            setPreviewProduct(p);
                            setPreviewDevice('desktop');
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                          title="Preview Product (Desktop/Tablet/Mobile)"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Categories Management</h3>
            <button
              onClick={() => {
                setEditingCategory({ productType: 'Book', isActive: true, displayOrder: categories.length + 1 });
                setIsCategoryModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold">{cat.productType}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'No description'}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-amber-600 cursor-pointer"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BRANDS */}
      {activeTab === 'BRANDS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Brands & Publishers Directory</h3>
            <button
              onClick={() => {
                setEditingBrand({ type: 'BOTH', isActive: true });
                setIsBrandModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Brand / Publisher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map(b => (
              <div key={b.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">{b.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold">{b.type}</span>
                </div>
                <button
                  onClick={() => {
                    setEditingBrand(b);
                    setIsBrandModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-amber-600 cursor-pointer"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-w-3xl">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Store Configuration & Default SEO</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Store Description</label>
              <textarea
                rows={3}
                value={settings.storeDescription}
                onChange={e => setSettings({ ...settings, storeDescription: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Affiliate Disclosure Statement</label>
              <textarea
                rows={3}
                value={settings.affiliateDisclosure}
                onChange={e => setSettings({ ...settings, affiliateDisclosure: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Save Settings
          </button>
        </form>
      )}

      {/* TAB: REVIEWS MANAGEMENT */}
      {activeTab === 'REVIEWS' && (
        <div className="space-y-6">
          {/* Metrics summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Reviews</span>
                <MessageSquare size={18} className="text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{allProductReviews.length}</p>
              <span className="text-[11px] text-slate-500">Across all catalog products</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
                <Star size={18} className="text-amber-500 fill-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-500">
                {allProductReviews.length > 0 
                  ? (allProductReviews.reduce((sum, item) => sum + item.review.rating, 0) / allProductReviews.length).toFixed(1)
                  : '5.0'} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </p>
              <span className="text-[11px] text-slate-500">Overall rating average</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">5-Star Reviews</span>
                <Award size={18} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {allProductReviews.filter(i => i.review.rating === 5).length}
              </p>
              <span className="text-[11px] text-slate-500">Top rating count</span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Verified Buyers</span>
                <ShieldCheck size={18} className="text-blue-500" />
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {allProductReviews.filter(i => i.review.isVerifiedBuyer).length}
              </p>
              <span className="text-[11px] text-slate-500">Verified student/parent reviews</span>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reviewSearch}
                  onChange={e => setReviewSearch(e.target.value)}
                  placeholder="Search review by name, role or text..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              {/* Product Filter */}
              <select
                value={reviewProductFilter}
                onChange={e => setReviewProductFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="ALL">All Products</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              {/* Rating Filter */}
              <select
                value={reviewRatingFilter}
                onChange={e => setReviewRatingFilter(Number(e.target.value))}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value={0}>All Ratings</option>
                <option value={5}>5 Stars ★★★★★</option>
                <option value={4}>4 Stars ★★★★☆</option>
                <option value={3}>3 Stars ★★★☆☆</option>
                <option value={2}>2 Stars ★★☆☆☆</option>
                <option value={1}>1 Star ★☆☆☆☆</option>
              </select>
            </div>

            {/* Add Review Button */}
            <button
              id="btn-add-review-admin"
              onClick={() => {
                const defaultProdId = products[0]?.id || '';
                setReviewTargetProductId(defaultProdId);
                setEditingReview({
                  reviewerName: '',
                  reviewerRole: 'Class 10 Student',
                  rating: 5,
                  comment: '',
                  date: new Date().toISOString().split('T')[0],
                  isVerifiedBuyer: true
                });
                setIsReviewModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Review</span>
            </button>
          </div>

          {/* Reviews Table / Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <MessageSquare size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No reviews found</h4>
                <p className="text-xs text-slate-400">Click "Add Review" to create student or faculty reviews for products.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredReviews.map(({ product, review }) => (
                  <div key={review.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Product & Reviewer column */}
                    <div className="md:col-span-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {review.reviewerName}
                        </span>
                        {review.isVerifiedBuyer && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <ShieldCheck size={11} />
                            Verified
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        {review.reviewerRole || 'Verified Aspirant'}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate max-w-full flex items-center gap-1 pt-0.5">
                        <Package size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate font-medium">{product.title}</span>
                      </div>
                    </div>

                    {/* Rating & Comment Column */}
                    <div className="md:col-span-6 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={13} 
                              className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} 
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                          {review.rating}.0 / 5.0
                        </span>
                        <span className="text-[10px] text-slate-400">• {review.date}</span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        "{review.comment}"
                      </p>
                    </div>

                    {/* Action Column */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <button
                        id={`btn-edit-review-${review.id}`}
                        onClick={() => {
                          setReviewTargetProductId(product.id);
                          setEditingReview(review);
                          setIsReviewModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/50 text-slate-600 hover:text-amber-600 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>

                      <button
                        id={`btn-delete-review-${review.id}`}
                        onClick={() => handleDeleteReview(product.id, review.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl my-8 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingProduct.id ? `Edit Product: ${editingProduct.title || 'Untitled'}` : 'Add New Store Product'}
                </h3>
                <p className="text-[11px] text-slate-400">Complete rich details, SEO metadata, purchase links, and faculty endorsements</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-modal-preview-product"
                  type="button"
                  onClick={() => {
                    setPreviewProduct(editingProduct);
                    setPreviewDevice('desktop');
                    setIsPreviewModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={15} />
                  <span>Preview Product</span>
                </button>
                <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Quality Check Alert Box inside Modal */}
            {(!editingProduct.featuredImage || !editingProduct.seoTitle || !editingProduct.metaDescription || !editingProduct.purchaseLinks || editingProduct.purchaseLinks.length === 0 || !editingProduct.whySunshineRecommends) && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold">Quality Checklist Warnings for this Item:</p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-800 dark:text-amber-300">
                    {!editingProduct.featuredImage && <li>Missing Featured Image URL thumbnail</li>}
                    {(!editingProduct.seoTitle || !editingProduct.metaDescription) && <li>Missing SEO Title or Meta Description for search engines</li>}
                    {(!editingProduct.purchaseLinks || editingProduct.purchaseLinks.length === 0) && <li>Missing affiliate purchase link for students</li>}
                    {!editingProduct.whySunshineRecommends && <li>Missing Faculty Endorsement Note ("Why Sunshine Recommends")</li>}
                  </ul>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              
              {/* Basic Info */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">1. Core Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Product Type *</label>
                    <select
                      value={editingProduct.type || 'Book'}
                      onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value as StoreProductType })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="Book">Book</option>
                      <option value="Resource">Resource</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Publication Status *</label>
                    <select
                      value={editingProduct.status || 'PUBLISHED'}
                      onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Category *</label>
                    <select
                      value={editingProduct.categoryId || ''}
                      onChange={e => {
                        const c = categories.find(cat => cat.id === e.target.value);
                        setEditingProduct({ ...editingProduct, categoryId: e.target.value, categoryName: c?.name || '' });
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.productType})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.title || ''}
                      onChange={e => {
                        const title = e.target.value;
                        const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        setEditingProduct({
                          ...editingProduct,
                          title,
                          slug: editingProduct.slug ? editingProduct.slug : autoSlug,
                          seoTitle: editingProduct.seoTitle ? editingProduct.seoTitle : title
                        });
                      }}
                      placeholder="e.g. Class 10 RD Sharma Mathematics Reference Book"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">URL Slug (e.g., class-10-rd-sharma)</label>
                    <input
                      type="text"
                      value={editingProduct.slug || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                      placeholder="e.g. class-10-rd-sharma"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Class / Grade</label>
                    <input
                      type="text"
                      value={editingProduct.class || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, class: e.target.value })}
                      placeholder="e.g. Class 10"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Subject</label>
                    <input
                      type="text"
                      value={editingProduct.subject || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Publisher</label>
                    <input
                      type="text"
                      value={editingProduct.publisher || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, publisher: e.target.value })}
                      placeholder="e.g. Dhanpat Rai"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Author / Brand</label>
                    <input
                      type="text"
                      value={editingProduct.author || editingProduct.brandName || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, author: e.target.value, brandName: e.target.value })}
                      placeholder="e.g. Dr. RD Sharma"
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Endorsements & Descriptions */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">2. Descriptions & Faculty Recommendation</h4>

                <div>
                  <label className="block font-bold mb-1 flex items-center justify-between">
                    <span>Why Sunshine Recommends This (Faculty Note)</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Crucial for student trust</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.whySunshineRecommends || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, whySunshineRecommends: e.target.value })}
                    placeholder="e.g. Highly recommended by Sunshine senior faculty for Class 10 CBSE Board aspirants who want 95%+ in mathematics..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Short Description</label>
                    <textarea
                      rows={3}
                      value={editingProduct.shortDescription || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                      placeholder="Brief card summary..."
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Full Description</label>
                    <textarea
                      rows={3}
                      value={editingProduct.fullDescription || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                      placeholder="Detailed overview and syllabus breakdown..."
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Media & Image Gallery */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">3. Media & Product Gallery</h4>

                <div>
                  <label className="block font-bold mb-1">Featured Thumbnail Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingProduct.featuredImage || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, featuredImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    {editingProduct.featuredImage && (
                      <img src={editingProduct.featuredImage} alt="Thumbnail preview" className="w-10 h-10 object-contain bg-white rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Gallery Images List</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={galleryUrlInput}
                      onChange={e => setGalleryUrlInput(e.target.value)}
                      placeholder="Add supplementary image URL..."
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (galleryUrlInput.trim()) {
                          const gallery = editingProduct.galleryImages || [];
                          setEditingProduct({ ...editingProduct, galleryImages: [...gallery, galleryUrlInput.trim()] });
                          setGalleryUrlInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold"
                    >
                      + Add Gallery Image
                    </button>
                  </div>

                  {editingProduct.galleryImages && editingProduct.galleryImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editingProduct.galleryImages.map((url, i) => (
                        <div key={i} className="relative group border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white p-1 flex items-center gap-1">
                          <img src={url} alt={`Gallery ${i}`} className="w-8 h-8 object-contain rounded" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingProduct.galleryImages || []).filter((_, idx) => idx !== i);
                              setEditingProduct({ ...editingProduct, galleryImages: updated });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Links & Badges */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">4. Purchase Links & Merchandising Badges</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const links = editingProduct.purchaseLinks || [];
                      setEditingProduct({
                        ...editingProduct,
                        purchaseLinks: [...links, { id: 'link-' + Date.now(), platform: 'Amazon', url: '', displayOrder: links.length + 1, active: true }]
                      });
                    }}
                    className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Add Purchase Link</span>
                  </button>
                </div>

                {editingProduct.purchaseLinks?.map((link, idx) => (
                  <div key={link.id || idx} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center">
                    <select
                      value={link.platform}
                      onChange={e => {
                        const updated = [...(editingProduct.purchaseLinks || [])];
                        updated[idx].platform = e.target.value as any;
                        setEditingProduct({ ...editingProduct, purchaseLinks: updated });
                      }}
                      className="col-span-3 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                    >
                      <option value="Amazon">Amazon</option>
                      <option value="Flipkart">Flipkart</option>
                      <option value="Official Website">Official Website</option>
                      <option value="Publisher">Publisher</option>
                      <option value="Custom">Custom Link</option>
                    </select>

                    <input
                      type="url"
                      value={link.url}
                      onChange={e => {
                        const updated = [...(editingProduct.purchaseLinks || [])];
                        updated[idx].url = e.target.value;
                        setEditingProduct({ ...editingProduct, purchaseLinks: updated });
                      }}
                      placeholder="https://amazon.in/dp/..."
                      className="col-span-8 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updated = (editingProduct.purchaseLinks || []).filter((_, i) => i !== idx);
                        setEditingProduct({ ...editingProduct, purchaseLinks: updated });
                      }}
                      className="col-span-1 text-rose-500 hover:text-rose-700 flex justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {/* Flags & Badges */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFeatured || false}
                      onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>Featured Product</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isMostRecommended || false}
                      onChange={e => setEditingProduct({ ...editingProduct, isMostRecommended: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>Faculty Top Pick</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isBestseller || false}
                      onChange={e => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>Bestseller Tag</span>
                  </label>
                </div>
              </div>

              {/* Tags & Key Features */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">5. Tags & Bullet Highlights</h4>

                <div>
                  <label className="block font-bold mb-1">Search Tags (Press Enter or Click Add)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagInput.trim()) {
                            const tags = editingProduct.tags || [];
                            if (!tags.includes(tagInput.trim())) {
                              setEditingProduct({ ...editingProduct, tags: [...tags, tagInput.trim()] });
                            }
                            setTagInput('');
                          }
                        }
                      }}
                      placeholder="Add tag (e.g., Board Exams, Reference, Practice)..."
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim()) {
                          const tags = editingProduct.tags || [];
                          if (!tags.includes(tagInput.trim())) {
                            setEditingProduct({ ...editingProduct, tags: [...tags, tagInput.trim()] });
                          }
                          setTagInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold"
                    >
                      + Add Tag
                    </button>
                  </div>

                  {editingProduct.tags && editingProduct.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {editingProduct.tags.map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold text-[11px] flex items-center gap-1">
                          <span>#{t}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingProduct.tags || []).filter(item => item !== t);
                              setEditingProduct({ ...editingProduct, tags: updated });
                            }}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-1">Key Highlight Bullets</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keyFeatureInput}
                      onChange={e => setKeyFeatureInput(e.target.value)}
                      placeholder="Add feature bullet (e.g. 1000+ solved board practice problems)..."
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (keyFeatureInput.trim()) {
                          const features = editingProduct.keyFeatures || [];
                          setEditingProduct({ ...editingProduct, keyFeatures: [...features, keyFeatureInput.trim()] });
                          setKeyFeatureInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold"
                    >
                      + Add Bullet
                    </button>
                  </div>

                  {editingProduct.keyFeatures && editingProduct.keyFeatures.length > 0 && (
                    <ul className="space-y-1">
                      {editingProduct.keyFeatures.map((feat, i) => (
                        <li key={i} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                          <span>• {feat}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingProduct.keyFeatures || []).filter((_, idx) => idx !== i);
                              setEditingProduct({ ...editingProduct, keyFeatures: updated });
                            }}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Rich SEO & Live Google SERP Snippet Preview */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-850 border border-amber-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-amber-900 dark:text-amber-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Globe size={14} className="text-amber-500" />
                    <span>6. Search Engine Optimization (SEO) & Social Sharing Metadata</span>
                  </h4>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Google SERP Simulator</span>
                </div>

                {/* Google Search Live Snippet Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm font-sans">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-[9px]">S</div>
                    <span>sunshineclasses.edu.in › store › {editingProduct.type?.toLowerCase() || 'book'} › <span className="font-mono text-slate-800 dark:text-slate-200">{editingProduct.slug || 'product-slug'}</span></span>
                  </div>
                  <h5 className="text-base font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                    {editingProduct.seoTitle || editingProduct.title || 'Product Title - Sunshine Classes Store'}
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {editingProduct.metaDescription || editingProduct.shortDescription || 'Educational book recommended by Sunshine Classes faculty for students.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 flex justify-between">
                      <span>SEO Title Tag</span>
                      <span className={`text-[10px] ${(editingProduct.seoTitle?.length || 0) > 60 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                        {editingProduct.seoTitle?.length || 0} / 60 chars
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editingProduct.seoTitle || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, seoTitle: e.target.value })}
                      placeholder="Title tag for Google results..."
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Keywords (Comma Separated)</label>
                    <input
                      type="text"
                      value={editingProduct.keywords || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, keywords: e.target.value })}
                      placeholder="cbse class 10, rd sharma, math reference..."
                      className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 flex justify-between">
                    <span>Meta Description</span>
                    <span className={`text-[10px] ${(editingProduct.metaDescription?.length || 0) > 160 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                      {editingProduct.metaDescription?.length || 0} / 160 chars
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.metaDescription || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, metaDescription: e.target.value })}
                    placeholder="Search snippet description shown under Google result..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Lock size={13} className="text-amber-500" />
                    <span>5. Internal Notes (Only Visible to Admin)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold">🔒 Hidden from store visitors</span>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={editingProduct.internalNotes || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, internalNotes: e.target.value })}
                    placeholder="Example: Need better cover image. Waiting for Amazon link. Replace after CBSE update."
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-400">Quick Examples:</span>
                  {[
                    "Need better cover image.",
                    "Waiting for Amazon link.",
                    "Replace after CBSE update.",
                    "Faculty review pending."
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const current = editingProduct.internalNotes?.trim() || '';
                        const updated = current ? `${current} ${preset}` : preset;
                        setEditingProduct({ ...editingProduct, internalNotes: updated });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Related Products Selection */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-amber-600 dark:text-amber-400">7. Cross-Sells & Related Products</h4>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={editingProduct.autoRelatedEnabled !== false}
                      onChange={e => setEditingProduct({ ...editingProduct, autoRelatedEnabled: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>Auto-Suggest Category & Class Related Items</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold mb-1">Manual Related Items Selection</label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {products.filter(p => p.id !== editingProduct.id).map(other => {
                      const isSelected = editingProduct.relatedProductIds?.includes(other.id);
                      return (
                        <label key={other.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer text-[11px]">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={e => {
                                const current = editingProduct.relatedProductIds || [];
                                const updated = e.target.checked ? [...current, other.id] : current.filter(id => id !== other.id);
                                setEditingProduct({ ...editingProduct, relatedProductIds: updated });
                              }}
                              className="rounded text-amber-500"
                            />
                            <span className="font-bold text-slate-900 dark:text-white">{other.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{other.categoryName} • {other.class}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Product Reviews Section in Product Modal */}
              {editingProduct.id && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-amber-500" />
                      <span>Product Reviews ({editingProduct.reviews?.length || 0})</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewTargetProductId(editingProduct.id!);
                        setEditingReview({
                          reviewerName: '',
                          reviewerRole: 'Class 10 Student',
                          rating: 5,
                          comment: '',
                          date: new Date().toISOString().split('T')[0],
                          isVerifiedBuyer: true
                        });
                        setIsReviewModalOpen(true);
                      }}
                      className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                    >
                      + Add Review
                    </button>
                  </div>

                  {(!editingProduct.reviews || editingProduct.reviews.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">No reviews added for this product yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {editingProduct.reviews.map((rev) => (
                        <div key={rev.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between gap-3 text-[11px]">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{rev.reviewerName}</span>
                              <span className="text-[10px] text-amber-500 font-bold">{rev.rating}★</span>
                              <span className="text-[10px] text-slate-400">({rev.reviewerRole})</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 truncate italic">"{rev.comment}"</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewTargetProductId(editingProduct.id!);
                                setEditingReview(rev);
                                setIsReviewModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(editingProduct.id!, rev.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md cursor-pointer"
                >
                  Save Product
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: CATEGORY EDIT */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {editingCategory.id ? 'Edit Category' : 'Add Category'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Product Type</label>
                <select
                  value={editingCategory.productType || 'Book'}
                  onChange={e => setEditingCategory({ ...editingCategory, productType: e.target.value as StoreProductType })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Book">Book</option>
                  <option value="Resource">Resource</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BRAND EDIT */}
      {isBrandModalOpen && editingBrand && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {editingBrand.id ? 'Edit Brand / Publisher' : 'Add Brand / Publisher'}
            </h3>

            <form onSubmit={handleSaveBrand} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingBrand.name || ''}
                  onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Type</label>
                <select
                  value={editingBrand.type || 'BOTH'}
                  onChange={e => setEditingBrand({ ...editingBrand, type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="PUBLISHER">Publisher</option>
                  <option value="BRAND">Brand</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Official Website</label>
                <input
                  type="url"
                  value={editingBrand.website || ''}
                  onChange={e => setEditingBrand({ ...editingBrand, website: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT REVIEW */}
      {isReviewModalOpen && editingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-amber-500" />
                <span>{editingReview.id ? 'Edit Product Review' : 'Add Product Review'}</span>
              </h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Target Product</label>
                <select
                  value={reviewTargetProductId}
                  onChange={e => setReviewTargetProductId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="" disabled>-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    required
                    value={editingReview.reviewerName || ''}
                    onChange={e => setEditingReview({ ...editingReview, reviewerName: e.target.value })}
                    placeholder="e.g. Aarav Gupta"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={editingReview.reviewerRole || ''}
                    onChange={e => setEditingReview({ ...editingReview, reviewerRole: e.target.value })}
                    placeholder="e.g. Class 10 Student (98.2%)"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold mb-1">Star Rating (1 to 5)</label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setEditingReview({ ...editingReview, rating: star })}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star 
                          size={20} 
                          className={(editingReview.rating || 5) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Review Date</label>
                  <input
                    type="date"
                    value={editingReview.date || new Date().toISOString().split('T')[0]}
                    onChange={e => setEditingReview({ ...editingReview, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Review Comment</label>
                <textarea
                  rows={3}
                  required
                  value={editingReview.comment || ''}
                  onChange={e => setEditingReview({ ...editingReview, comment: e.target.value })}
                  placeholder="Enter detailed feedback or endorsement for this product..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-verified-buyer"
                  checked={editingReview.isVerifiedBuyer !== false}
                  onChange={e => setEditingReview({ ...editingReview, isVerifiedBuyer: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <label htmlFor="chk-verified-buyer" className="font-bold cursor-pointer text-slate-700 dark:text-slate-300">
                  Mark as Verified Student / Buyer Review
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold">
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT DEVICE PREVIEW */}
      {isPreviewModalOpen && previewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 w-full max-w-5xl rounded-3xl border border-slate-800 shadow-2xl flex flex-col my-6 max-h-[92vh] overflow-hidden">
            
            {/* Preview Top Control Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Preview Product: {previewProduct.title || 'Untitled Item'}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      previewProduct.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {previewProduct.status || 'DRAFT'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Responsive preview before publishing to students</p>
                </div>
              </div>

              {/* Device Switcher Controls */}
              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  id="preview-device-desktop"
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
                  id="preview-device-tablet"
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
                  id="preview-device-mobile"
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
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Device Canvas Frame Container */}
            <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex items-center justify-center">
              <div
                className={`bg-white dark:bg-slate-900 transition-all duration-300 overflow-y-auto ${
                  previewDevice === 'desktop'
                    ? 'w-full max-w-4xl rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800'
                    : previewDevice === 'tablet'
                    ? 'w-[720px] max-w-full rounded-2xl shadow-xl p-5 border border-slate-200 dark:border-slate-800'
                    : 'w-[375px] max-w-full rounded-[40px] shadow-2xl p-4 border-[10px] border-slate-800 relative my-4'
                }`}
              >
                {/* Mobile Notch simulation */}
                {previewDevice === 'mobile' && (
                  <div className="w-28 h-4 bg-slate-800 rounded-b-xl mx-auto -mt-4 mb-4" />
                )}

                {/* Internal Notes Admin Indicator inside preview */}
                {previewProduct.internalNotes && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Internal Admin Note (Admin View Only)
                      </span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{previewProduct.internalNotes}</p>
                    </div>
                  </div>
                )}

                {/* Live Mockup of Public Detail Page */}
                <div className="space-y-6">
                  {/* Header info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px]">
                        {previewProduct.type || 'Book'}
                      </span>
                      {previewProduct.categoryName && (
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                          {previewProduct.categoryName}
                        </span>
                      )}
                      {previewProduct.class && (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-[10px]">
                          {previewProduct.class}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {previewProduct.title || 'Product Title Placeholder'}
                    </h2>

                    <p className="text-xs text-slate-500">
                      {previewProduct.publisher ? `Publisher: ${previewProduct.publisher}` : ''} 
                      {previewProduct.author ? ` • Author: ${previewProduct.author}` : ''}
                    </p>
                  </div>

                  {/* Featured Image & Links layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3">
                      <img
                        src={previewProduct.featuredImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                        alt={previewProduct.title}
                        className="w-full h-64 object-contain rounded-2xl bg-slate-50 dark:bg-slate-850 p-2 border border-slate-200 dark:border-slate-800"
                      />

                      {/* Gallery preview */}
                      {previewProduct.gallery && previewProduct.gallery.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {previewProduct.gallery.map((img, idx) => (
                            <img key={idx} src={img} alt="Gallery" className="w-12 h-12 rounded-lg object-contain bg-slate-50 border p-1 border-slate-200 dark:border-slate-700 shrink-0" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Faculty Endorsement Box */}
                      {previewProduct.whySunshineRecommends && (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                            <Sparkles size={16} />
                            <span>Why Sunshine Recommends This</span>
                          </div>
                          <p className="text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed italic">
                            "{previewProduct.whySunshineRecommends}"
                          </p>
                        </div>
                      )}

                      {/* Purchase Links */}
                      <div className="space-y-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">Available Purchase Links:</span>
                        {(!previewProduct.purchaseLinks || previewProduct.purchaseLinks.length === 0) ? (
                          <p className="text-xs text-slate-400 italic">No purchase links attached yet.</p>
                        ) : (
                          previewProduct.purchaseLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-between transition-all shadow-xs"
                            >
                              <div className="flex items-center gap-2">
                                <ShoppingBag size={16} />
                                <span>Buy on {link.platform}</span>
                              </div>
                              <ExternalLink size={14} />
                            </a>
                          ))
                        )}
                      </div>

                      {/* Key features bullets */}
                      {previewProduct.keyFeatures && previewProduct.keyFeatures.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">Key Features & Syllabus Coverage:</span>
                          <ul className="space-y-1">
                            {previewProduct.keyFeatures.map((feat, idx) => (
                              <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                <span className="text-amber-500 font-black">•</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {(previewProduct.shortDescription || previewProduct.fullDescription) && (
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">Product Overview</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {previewProduct.fullDescription || previewProduct.shortDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
