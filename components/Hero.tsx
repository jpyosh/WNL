import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-brand-dark">
      <div className="absolute inset-0 z-0">
        <img 
          src="/header.png" 
          alt="Hero Banner" 
          className="w-full h-full object-cover opacity-80"
          onError={(e) => {
             // Fallback gradient if image is missing
            (e.target as HTMLImageElement).src = 'https://picsum.photos/1920/1080?grayscale';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white drop-shadow-2xl">
          PRECISION & STYLE
        </h1>
        <p className="text-gray-300 text-lg md:text-xl tracking-wide font-light max-w-2xl mx-auto mb-8">
          The premium collection for the modern visionary. Experience quality that speaks for itself.
        </p>
        <button 
            onClick={() => {
                document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-all transform hover:scale-105"
        >
          Shop Collection
        </button>
      </div>
    </div>
  );
};