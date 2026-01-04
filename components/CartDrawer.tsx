import React, { useMemo } from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemoveItem, 
  onUpdateQuantity,
  onCheckout
}) => {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-brand-dark border-l border-white/10 z-[70] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-xl font-bold tracking-wide">YOUR CART</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>Your cart is empty.</p>
              <button onClick={onClose} className="text-white border-b border-white pb-1">Continue Shopping</button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 bg-gray-900 overflow-hidden rounded-sm flex-shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">₱{item.price.toLocaleString()}</p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-white/20 rounded-sm">
                        <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="px-2 py-1 hover:bg-white/10 text-white"
                        >-</button>
                        <span className="px-2 text-sm">{item.quantity}</span>
                        <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="px-2 py-1 hover:bg-white/10 text-white"
                        >+</button>
                    </div>
                    <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black">
            <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold">₱{total.toLocaleString()}</span>
            </div>
            <button 
                onClick={onCheckout}
                className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
                Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};