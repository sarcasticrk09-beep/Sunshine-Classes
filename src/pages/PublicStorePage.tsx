import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StoreProduct, StoreCategory, StoreBrand, StoreProductType } from '../types';
import { ProductCard } from '../components/ProductCard';
import { 
  subscribeStoreProducts, 
  getLocalStoreCategories, 
  getLocalStoreBrands, 
  getLocalStoreSettings,
  recordStoreEvent
} from '../services/storeService';
import { 
  BookOpen, 
  Package, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Layers, 
  X, 
  ChevronRight, 
  Star, 
  Award,
  CheckCircle2,
  SlidersHorizontal,
  Grid,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicStorePageProps {
  initialType: StoreProductType; // 'Book' | 'Resource'
}

export const PublicStorePage: React.FC<PublicStorePageProps> = ({ initialType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [brands, setBrands] = useState<StoreBrand[]>([]);
  const storeSettings = useMemo(() => getLocalStoreSettings(), []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  // Selected Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPublisherOrBrand, setSelectedPublisherOrBrand] = useState<string>('ALL');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('ALL');
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'LATEST' | 'AZ' | 'ZA'>('RECOMMENDED');

  // Active view type ('Book' vs 'Resource')
  const isBookView = initialType === 'Book';

  useEffect(() => {
    const unsub = subscribeStoreProducts((data) => {
      setProducts(data.filter(p => p.status === 'PUBLISHED'));
    });
    setCategories(getLocalStoreCategories().filter(c => c.isActive && c.productType === initialType));
    setBrands(getLocalStoreBrands().filter(b => b.isActive));

    return () => unsub();
  }, [initialType]);

  // Record Search event when user stops typing
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timer = setTimeout(() => {
        recordStoreEvent({
          eventType: 'SEARCH',
          searchQuery: searchQuery.trim(),
          productType: initialType
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, initialType]);

  // Derived filter options
  const classOptions = useMemo(() => {
    const classes = new Set<string>();
    products.forEach(p => {
      if (p.type === initialType && p.class) classes.add(p.class);
    });
    return Array.from(classes).sort();
  }, [products, initialType]);

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>();
    products.forEach(p => {
      if (p.type === initialType && p.subject) subjects.add(p.subject);
    });
    return Array.from(subjects).sort();
  }, [products, initialType]);

  const publisherOrBrandOptions = useMemo(() => {
    const items = new Set<string>();
    products.forEach(p => {
      if (p.type === initialType) {
        if (p.publisher) items.add(p.publisher);
        if (p.brandName) items.add(p.brandName);
      }
    });
    return Array.from(items).sort();
  }, [products, initialType]);

  const authorOptions = useMemo(() => {
    const items = new Set<string>();
    products.forEach(p => {
      if (p.type === 'Book' && p.author) items.add(p.author);
    });
    return Array.from(items).sort();
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.type !== initialType) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDesc = p.shortDescription.toLowerCase().includes(q) || p.fullDescription.toLowerCase().includes(q);
        const matchesAuthor = p.author?.toLowerCase().includes(q);
        const matchesPublisher = p.publisher?.toLowerCase().includes(q) || p.brandName?.toLowerCase().includes(q);
        const matchesClass = p.class?.toLowerCase().includes(q);
        const matchesSubject = p.subject?.toLowerCase().includes(q);
        const matchesTags = p.tags?.some(t => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesPublisher && !matchesClass && !matchesSubject && !matchesTags) {
          return false;
        }
      }

      // Class
      if (selectedClass !== 'ALL' && p.class !== selectedClass) return false;

      // Subject
      if (selectedSubject !== 'ALL' && p.subject !== selectedSubject) return false;

      // Category
      if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory && p.categoryName !== selectedCategory) return false;

      // Publisher / Brand
      if (selectedPublisherOrBrand !== 'ALL') {
        if (p.publisher !== selectedPublisherOrBrand && p.brandName !== selectedPublisherOrBrand) return false;
      }

      // Author
      if (selectedAuthor !== 'ALL' && p.author !== selectedAuthor) return false;

      // Featured
      if (featuredOnly && !p.isFeatured && !p.isMostRecommended) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'LATEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'AZ') return a.title.localeCompare(b.title);
      if (sortBy === 'ZA') return b.title.localeCompare(a.title);
      // Recommended: Featured + views
      return (b.viewsCount + (b.isFeatured ? 500 : 0)) - (a.viewsCount + (a.isFeatured ? 500 : 0));
    });
  }, [
    products, 
    initialType, 
    searchQuery, 
    selectedClass, 
    selectedSubject, 
    selectedCategory, 
    selectedPublisherOrBrand, 
    selectedAuthor, 
    featuredOnly, 
    sortBy
  ]);

  // Instant Search Suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.type === initialType && (
      p.title.toLowerCase().includes(q) ||
      p.author?.toLowerCase().includes(q) ||
      p.publisher?.toLowerCase().includes(q)
    )).slice(0, 5);
  }, [products, initialType, searchQuery]);

  // Section Groupings
  const featuredProducts = useMemo(() => products.filter(p => p.type === initialType && (p.isFeatured || p.isMostRecommended)), [products, initialType]);
  const newArrivals = useMemo(() => products.filter(p => p.type === initialType && (p.isNewArrival || p.isTrending)), [products, initialType]);
  const mostRecommended = useMemo(() => products.filter(p => p.type === initialType && p.isMostRecommended), [products, initialType]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClass('ALL');
    setSelectedSubject('ALL');
    setSelectedCategory('ALL');
    setSelectedPublisherOrBrand('ALL');
    setSelectedAuthor('ALL');
    setFeaturedOnly(false);
    setSortBy('RECOMMENDED');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button onClick={() => navigate('/')} className="hover:text-amber-600 transition-colors">Home</button>
          <ChevronRight size={14} />
          <span className="text-slate-900 dark:text-white font-bold">{isBookView ? 'Books' : 'Resources'}</span>
        </nav>

        {/* Hero Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 shadow-2xl border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,158,11,0.15),transparent_60%)]"></div>
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles size={14} />
              <span>Sunshine Classes Curated Recommendations</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white leading-tight">
              {isBookView ? (
                <>Curated <span className="text-amber-400">Textbooks & Guidebooks</span> for Board Tops</>
              ) : (
                <>Essential <span className="text-amber-400">Study Setup & Accessories</span> for Maximum Focus</>
              )}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {isBookView 
                ? 'Handpicked NCERT solutions, RD Sharma mathematics references, Arihant all-in-one guides & board exam question banks tested by Sunshine faculty.'
                : 'Ergonomic study desk lamps, Casio scientific calculators, Apsara board exam geometry kits, and study timers engineered for high score productivity.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>100% Faculty Verified</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Direct Amazon & Flipkart Deals</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Zero Price Markups</span>
              </span>
            </div>
          </div>
        </div>

        {/* Global Search & Instant Suggestion Bar */}
        <div className="relative max-w-3xl mx-auto">
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 focus-within:border-amber-500 transition-all">
            <Search className="ml-4 text-slate-400 shrink-0" size={20} />
            <input 
              id="store-global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              placeholder={isBookView 
                ? "Search books by title, author (RD Sharma), publisher (Arihant, S. Chand), class or subject..." 
                : "Search study resources by product, brand (Casio, Wipro), category..."}
              className="w-full py-4 px-3 text-sm bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Instant Search Suggestions Popup */}
          <AnimatePresence>
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800"
              >
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
                  <span>Suggested Matches ({searchSuggestions.length})</span>
                  <button onClick={() => setShowSearchSuggestions(false)} className="text-amber-600 hover:underline">Close</button>
                </div>
                {searchSuggestions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setShowSearchSuggestions(false);
                      navigate(s.type === 'Book' ? `/book/${s.slug}` : `/resource/${s.slug}`);
                    }}
                    className="p-3.5 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <img src={s.featuredImage} alt={s.title} className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.class ? `${s.class} • ` : ''}{s.publisher || s.brandName}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            id="cat-chip-all"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            All {isBookView ? 'Books' : 'Resources'}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              id={`cat-chip-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Featured Section (if no query or filters) */}
        {!searchQuery && selectedCategory === 'ALL' && selectedClass === 'ALL' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  <span>{isBookView ? 'Top Recommended Board Books' : 'Must-Have Study Essentials'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Handpicked by Priyanshu Sir and board toppers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Filters & Sorting Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <SlidersHorizontal size={18} className="text-amber-500" />
              <span>Filter & Sort {isBookView ? 'Books' : 'Resources'}</span>
              <span className="text-xs font-normal text-slate-500">({filteredProducts.length} items found)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-toggle-featured-filter"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  featuredOnly
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                ★ Faculty Picks Only
              </button>

              <div className="flex items-center gap-1 text-xs">
                <ArrowUpDown size={14} className="text-slate-400" />
                <select
                  id="select-store-sort"
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="RECOMMENDED">Most Recommended</option>
                  <option value="LATEST">Latest Added</option>
                  <option value="AZ">Alphabetical (A–Z)</option>
                  <option value="ZA">Alphabetical (Z–A)</option>
                </select>
              </div>

              {(searchQuery || selectedClass !== 'ALL' || selectedSubject !== 'ALL' || selectedCategory !== 'ALL' || selectedPublisherOrBrand !== 'ALL' || selectedAuthor !== 'ALL' || featuredOnly) && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            {/* Class Filter */}
            {isBookView && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Browse Class</label>
                <select
                  id="filter-select-class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-medium outline-none"
                >
                  <option value="ALL">All Classes</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* Subject Filter */}
            {isBookView && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                <select
                  id="filter-select-subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-medium outline-none"
                >
                  <option value="ALL">All Subjects</option>
                  {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Publisher / Brand Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{isBookView ? 'Publisher' : 'Brand'}</label>
              <select
                id="filter-select-publisher-brand"
                value={selectedPublisherOrBrand}
                onChange={(e) => setSelectedPublisherOrBrand(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-medium outline-none"
              >
                <option value="ALL">All {isBookView ? 'Publishers' : 'Brands'}</option>
                {publisherOrBrandOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Author Filter for Books */}
            {isBookView && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Author</label>
                <select
                  id="filter-select-author"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-medium outline-none"
                >
                  <option value="ALL">All Authors</option>
                  {authorOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Main Product Catalog Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isBookView ? 'Recommended Books Catalog' : 'Study Setup & Essentials'}
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No products found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No matching {isBookView ? 'books' : 'resources'} fit your selected filters. Try searching for a different keyword or resetting filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* Affiliate Disclosure Notice */}
        <div className="bg-slate-100 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Affiliate Transparency & Disclosure
          </p>
          <p className="leading-relaxed">
            {storeSettings.affiliateDisclosure}
          </p>
        </div>

      </div>
    </div>
  );
};
