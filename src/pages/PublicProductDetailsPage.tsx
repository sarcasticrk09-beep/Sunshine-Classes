import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StoreProduct, StoreProductType } from '../types';
import { ProductCard } from '../components/ProductCard';
import { 
  subscribeStoreProducts, 
  trackProductView, 
  trackExternalClick,
  getLocalStoreSettings 
} from '../services/storeService';
import { 
  BookOpen, 
  Package, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ArrowLeft,
  Share2,
  Tag,
  Star,
  Info,
  List,
  Layers,
  ShoppingBag,
  MessageSquare
} from 'lucide-react';

interface PublicProductDetailsPageProps {
  expectedType?: StoreProductType;
}

export const PublicProductDetailsPage: React.FC<PublicProductDetailsPageProps> = ({ expectedType }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const storeSettings = useMemo(() => getLocalStoreSettings(), []);

  useEffect(() => {
    const unsub = subscribeStoreProducts((data) => {
      setProducts(data.filter(p => p.status === 'PUBLISHED'));
    });
    return () => unsub();
  }, []);

  const product = useMemo(() => {
    return products.find(p => p.slug === slug || p.id === slug);
  }, [products, slug]);

  // Set default selected gallery image
  useEffect(() => {
    if (product) {
      setSelectedImage(product.featuredImage);
      // Track view
      trackProductView(product.id, product.title, product.type);
    }
  }, [product]);

  // Related products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => 
      p.id !== product.id && 
      p.type === product.type && 
      (p.categoryId === product.categoryId || p.class === product.class || p.publisher === product.publisher)
    ).slice(0, 4);
  }, [products, product]);

  const frequentlyRecommendedTogether = useMemo(() => {
    if (!product) return [];
    // If current item is a Book, recommend a complementary Resource (like study lamp or timer), and vice versa!
    const complementaryType: StoreProductType = product.type === 'Book' ? 'Resource' : 'Book';
    return products.filter(p => p.type === complementaryType && p.isMostRecommended).slice(0, 2);
  }, [products, product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-md space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Not Found</h2>
          <p className="text-xs text-slate-500">The requested book or educational resource could not be found or may have been archived.</p>
          <button
            onClick={() => navigate('/books')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Browse Books Store
          </button>
        </div>
      </div>
    );
  }

  const isBook = product.type === 'Book';
  const categoryRoute = isBook ? '/books' : '/resources';
  const allImages = [product.featuredImage, ...(product.gallery || [])].filter((img, idx, arr) => img && arr.indexOf(img) === idx);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.seoTitle || product.title,
        text: product.shortDescription,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handlePurchaseClick = (link: any) => {
    trackExternalClick(product.id, link.id, link.platform, product.title, product.type);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  // Structured Product Schema
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": [product.featuredImage, ...(product.gallery || [])],
    "description": product.shortDescription,
    "brand": {
      "@type": "Brand",
      "name": product.brandName || product.publisher || "Sunshine Classes"
    },
    "offers": product.purchaseLinks?.map(link => ({
      "@type": "Offer",
      "url": link.url,
      "seller": {
        "@type": "Organization",
        "name": link.platform
      }
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Inject Product JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>

      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto">
            <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to={categoryRoute} className="hover:text-amber-600 transition-colors">{isBook ? 'Books' : 'Resources'}</Link>
            <ChevronRight size={14} />
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-[200px]">{product.title}</span>
          </nav>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={14} />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Main Product Display Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          
          {/* Left Stage: Photo Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="w-full h-80 sm:h-96 bg-slate-100 dark:bg-slate-850 rounded-2xl p-6 flex items-center justify-center border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <img 
                src={selectedImage || product.featuredImage} 
                alt={product.title} 
                className="max-h-full max-w-full object-contain drop-shadow-md rounded-lg"
              />
              
              {product.isFeatured && (
                <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md">
                  Faculty Choice
                </span>
              )}
            </div>

            {/* Thumbnail switcher */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl border-2 p-1 bg-slate-50 dark:bg-slate-800 overflow-hidden cursor-pointer transition-all ${
                      selectedImage === img ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Stage: Detailed Content & Purchase Links */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Category & Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                {isBook ? <BookOpen size={13} /> : <Package size={13} />}
                <span>{product.categoryName}</span>
              </span>

              {product.class && (
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  {product.class}
                </span>
              )}

              {product.subject && (
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  {product.subject}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white leading-tight">
              {product.title}
            </h1>

            {/* Classification Metadata Row */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-4">
              {product.author && (
                <div>
                  <span className="text-slate-400">Author:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{product.author}</strong>
                </div>
              )}
              {product.publisher && (
                <div>
                  <span className="text-slate-400">Publisher:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{product.publisher}</strong>
                </div>
              )}
              {product.brandName && (
                <div>
                  <span className="text-slate-400">Brand:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{product.brandName}</strong>
                </div>
              )}
            </div>

            {/* Why Sunshine Recommends This (Faculty Highlight Box) */}
            {product.whySunshineRecommends && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 rounded-r-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} />
                  <span>Why Sunshine Classes Recommends This</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  "{product.whySunshineRecommends}"
                </p>
              </div>
            )}

            {/* Purchase Options Box */}
            <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShoppingBag size={15} className="text-amber-500" />
                  <span>External Purchase Options</span>
                </span>
                <span className="text-[11px] text-slate-400">Opens directly in new tab</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.purchaseLinks?.filter(l => l.active).map(link => (
                  <button
                    key={link.id}
                    id={`btn-purchase-link-${link.id}`}
                    onClick={() => handlePurchaseClick(link)}
                    className="w-full p-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all flex items-center justify-between gap-2 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>Buy on {link.platform}</span>
                    </span>
                    <ExternalLink size={15} />
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                {storeSettings.affiliateDisclosure}
              </p>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Overview</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {product.fullDescription || product.shortDescription}
              </p>
            </div>

            {/* Key Features */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Key Features & Highlights</h3>
                <ul className="space-y-2">
                  {product.keyFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Product Specifications</h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-500">{key}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <Tag size={13} className="text-slate-400" />
                {product.tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    #{t}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Customer & Faculty Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-amber-500" />
                  <span>Student & Faculty Reviews</span>
                </h2>
                <p className="text-xs text-slate-500">Verified recommendations from Sunshine Classes toppers and faculty</p>
              </div>

              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                  {(product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1)} / 5.0
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-300">({product.reviews.length} reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map(r => (
                <div key={r.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.reviewerName}</h4>
                        {r.isVerifiedBuyer && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <ShieldCheck size={11} />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{r.reviewerRole}</p>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'} />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{r.comment}"
                  </p>

                  <div className="text-[10px] text-slate-400 text-right">
                    Reviewed on {r.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequently Recommended Together */}
        {frequentlyRecommendedTogether.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <span>Frequently Recommended Together</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {frequentlyRecommendedTogether.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white">
              Similar {isBook ? 'Books' : 'Resources'} You Might Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
