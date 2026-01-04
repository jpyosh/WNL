import React from 'react';
import { X, Plus, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  product, 
  onAddToCart 
}) => {
  if (!isOpen || !product) return null;

  const isSoldOut = product.stock_quantity <= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-brand-dark border border-white/10 w-full max-w-4xl shadow-2xl animate-fade-in-up flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 text-white mix-blend-difference hover:opacity-70 transition-opacity"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Image Section (Left/Top) */}
        <div className="w-full md:w-1/2 bg-gray-900 relative">
          <img 
            src={product.image_url} 
            alt={product.name} 
            className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-50' : ''}`}
          />
           {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-white font-bold text-3xl tracking-widest border-4 border-white px-6 py-3 transform -rotate-12">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* Details Section (Right/Bottom) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-brand-dark overflow-y-auto">
          <div className="mb-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tighter">
              {product.name}
            </h2>
            <p className="text-2xl text-white/80 font-light mb-6">
              ₱{product.price.toLocaleString()}
            </p>
            
            <div className="h-px bg-white/10 w-full mb-6"></div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Description</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider mb-4">
               <span>Availability</span>
               <span className={isSoldOut ? "text-red-500" : "text-green-500 font-bold"}>
                  {isSoldOut ? 'Out of Stock' : `${product.stock_quantity} Units`}
               </span>
            </div>

            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              disabled={isSoldOut}
              className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSoldOut ? (
                'Unavailable' 
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};