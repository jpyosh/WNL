import React from 'react';
import { Product } from '../types';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isSoldOut = product.stock_quantity <= 0;

  return (
    <div className="group relative bg-brand-dark border border-white/5 overflow-hidden flex flex-col transition-all duration-300 hover:border-white/20">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-900">
        <img 
          src={product.image_url} 
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
        />
        
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <span className="text-white font-bold text-xl tracking-widest border-2 border-white px-4 py-2 transform -rotate-12">
              SOLD OUT
            </span>
          </div>
        )}

        {!isSoldOut && (
          <button 
            onClick={() => onAddToCart(product)}
            className="absolute bottom-4 right-4 bg-white text-black p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-gray-200"
            aria-label="Add to cart"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Info Container */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium text-white tracking-wide">{product.name}</h3>
            <span className="text-white/80 font-semibold">₱{product.price.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{product.description}</p>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider">
            <span>General</span>
            <span className={isSoldOut ? "text-red-500" : "text-green-500"}>
                {isSoldOut ? 'Out of Stock' : `${product.stock_quantity} Available`}
            </span>
        </div>
      </div>
    </div>
  );
};