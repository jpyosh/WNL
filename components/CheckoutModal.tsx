import React from 'react';
import { X } from 'lucide-react';
import { OrderForm } from '../types';
import { CheckoutForm } from './CheckoutForm';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderForm) => Promise<void>;
  isLoading: boolean;
  total: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSubmit, isLoading, total }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-brand-dark border border-white/10 w-full max-w-lg p-8 shadow-2xl animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6 tracking-wide">SECURE CHECKOUT</h2>
        
        <CheckoutForm 
            onSubmit={onSubmit} 
            isLoading={isLoading} 
            total={total} 
        />
      </div>
    </div>
  );
};