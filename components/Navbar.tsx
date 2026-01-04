import React from 'react';
import { ShoppingBag, Menu } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 h-20 flex items-center justify-between px-6 md:px-12 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Logo Section */}
        <img 
          src="/logo.png" 
          alt="Watch and Learn Logo" 
          className="h-10 md:h-12 w-auto object-contain"
          onError={(e) => {
            // Fallback if image fails
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Fallback text if logo image is missing or for SEO */}
        <span className="text-xl font-bold tracking-tighter hidden md:block">WATCH AND LEARN</span>
      </div>

      <div className="flex items-center gap-6">
        <button 
            onClick={onAdminClick} 
            className="hidden md:block text-xs text-gray-500 hover:text-white uppercase tracking-wider transition-colors"
        >
            Admin
        </button>

        <button 
          onClick={onCartClick}
          className="relative group p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ShoppingBag className="w-6 h-6 text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>
        
        <button className="md:hidden p-2 text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};