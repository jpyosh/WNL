import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { OrderForm } from '../types';

interface CheckoutFormProps {
  onSubmit: (data: OrderForm) => void;
  isLoading: boolean;
  total: number;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSubmit, isLoading, total }) => {
  const [formData, setFormData] = useState<OrderForm>({
    fullName: '',
    address: '',
    contactNumber: '',
    email: '',
    paymentMethod: 'GCash'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
        <input 
          required
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Shipping Address</label>
        <textarea 
          required
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
          rows={3}
          placeholder="Unit, Street, City, ZIP"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Contact No.</label>
          <input 
            required
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
            placeholder="0912 345 6789"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
          <input 
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Payment Method</label>
        <select 
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
        >
          <option value="GCash">GCash</option>
          <option value="Bank Transfer">Bank Transfer (BDO/BPI)</option>
        </select>
      </div>

      <div className="pt-6 border-t border-white/10 mt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-400">Total Amount</span>
          <span className="text-2xl font-bold text-white">₱{total.toLocaleString()}</span>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Order'}
        </button>
      </div>
    </form>
  );
};