import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreProduct } from '../types';
import { BookOpen, Package, ExternalLink, Star, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: StoreProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    const route = product.type === 'Book' ? `/book/${product.slug}` : `/resource/${product.slug}`;
    navigate(route);
  };

  const isBook = product.type === 'Book';
  const brandOrPublisher = product.publisher || product.brandName || 'Curated Recommendation';

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Featured / Trending Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
        {product.isFeatured && (
          <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider">
            <Sparkles size={11} />
            <span>Featured</span>
          </span>
        )}
        {product.isMostRecommended && (
          <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider">
            <ShieldCheck size={11} />
            <span>Top Pick</span>
          </span>
        )}
      </div>

      {/* Product Image Stage */}
      <div 
        onClick={handleViewDetails}
        className="w-full h-52 bg-slate-100 dark:bg-slate-850 overflow-hidden relative cursor-pointer flex items-center justify-center p-4 group-hover:opacity-95 transition-opacity"
      >
        <img 
          src={product.featuredImage} 
          alt={product.title} 
          className="max-h-full max-w-full object-contain object-center group-hover:scale-105 transition-transform duration-500 rounded-lg shadow-xs"
          loading="lazy"
        />
        
        {/* Class Badge */}
        {product.class && (
          <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
            {product.class}
          </span>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Metadata Row */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              {isBook ? <BookOpen size={13} /> : <Package size={13} />}
              <span>{product.categoryName}</span>
            </span>
            <span className="truncate max-w-[130px] text-right font-medium text-slate-400">
              {brandOrPublisher}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={handleViewDetails}
            className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Faculty Recommends snippet */}
          {product.whySunshineRecommends && (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-2.5 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5 leading-snug">
              <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span className="line-clamp-2 font-medium">
                <strong className="font-bold">Faculty Note:</strong> {product.whySunshineRecommends}
              </span>
            </div>
          )}
        </div>

        {/* Footer with "View Details" button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span>{product.purchaseLinks?.length || 0} Purchase Links</span>
          </div>

          <button
            id={`btn-view-product-${product.id}`}
            onClick={handleViewDetails}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 dark:bg-slate-800 dark:hover:bg-amber-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
