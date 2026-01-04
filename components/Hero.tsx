import React, { useState, useEffect } from 'react';

const BACKGROUNDS = [
  '/header.png',
  '/561955812_17867936649452578_5355559714932562052_n.jpg', // Dark texture
  '/584246070_122144921852806819_1620487718032085716_n.jpg',
  '604122882_17875920348452578_5198481956637276166_n.jpg',
  '605985795_122149088420806819_374256387986473946_n.jpg' // Watch Lifestyle
];

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-brand-dark group">
      {/* Background Slideshow */}
      {BACKGROUNDS.map((bg, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img 
            src={bg} 
            alt={`Hero Background ${index + 1}`} 
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[20000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>
      ))}
      
      {/* Content */}
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