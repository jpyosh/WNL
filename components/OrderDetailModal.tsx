import React from 'react';
import { X, User, MapPin, Phone, Mail, CreditCard, ExternalLink, Calendar, Check, Ban, DollarSign, Package } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ isOpen, onClose, order, onStatusChange }) => {
  if (!isOpen || !order) return null;

  // Helper to determine status color styles
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'flagged': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const handleStatusClick = async (newStatus: OrderStatus) => {
    if (newStatus === 'completed') {
        const confirm = window.confirm("Are you sure? Marking as COMPLETED will deduct stock from inventory.");
        if (!confirm) return;
    }
    await onStatusChange(order.id, newStatus);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-brand-dark border border-white/10 w-full max-w-5xl max-h-[90vh] shadow-2xl animate-fade-in-up flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50">
          <div>
            <h2 className="text-2xl font-bold tracking-wide text-white">ORDER DETAILS</h2>
            <div className="flex items-center gap-3 mt-2">
                <p className="text-gray-500 font-mono text-sm">#{order.id}</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* LEFT COLUMN: Customer & Order Data */}
            <div className="space-y-8">
              
              {/* Customer Card */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 border-b border-white/10 pb-3">
                  <User className="w-4 h-4" /> Customer Information
                </h3>
                
                <div className="grid gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Full Name</label>
                    <p className="text-white font-medium text-lg">{order.customerDetails.fullName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Contact</label>
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span className="text-white">{order.customerDetails.contactNumber}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Email</label>
                        <a href={`mailto:${order.customerDetails.email}`} className="text-white hover:text-blue-400 transition-colors flex items-center gap-2 truncate">
                        <Mail className="w-3 h-3" /> {order.customerDetails.email}
                        </a>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Shipping Address</label>
                    <div className="flex gap-2 bg-black/40 p-3 rounded border border-white/5">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <p className="text-white text-sm leading-relaxed">{order.customerDetails.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Order Summary
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-black border border-white/10 p-3 rounded-lg group hover:border-white/20 transition-colors">
                       <div className="w-12 h-12 bg-gray-900 rounded-sm overflow-hidden flex-shrink-0">
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-grow">
                          <p className="font-bold text-sm text-white">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-white">₱{(item.price * item.quantity).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-600">₱{item.price.toLocaleString()} ea</p>
                       </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4 px-2">
                    <span className="text-gray-400 uppercase text-xs font-bold tracking-widest">Total Amount</span>
                    <span className="text-2xl font-bold text-white">₱{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Payment Proof */}
            <div className="flex flex-col h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment Verification
              </h3>

              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block">Payment Method</label>
                        <p className="text-white font-bold text-lg">{order.customerDetails.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider block">Date Placed</label>
                        <p className="text-white font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex-1 bg-black border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center relative overflow-hidden group min-h-[400px]">
                    {order.receiptUrl ? (
                        <>
                            <img src={order.receiptUrl} alt="Receipt" className="absolute inset-0 w-full h-full object-contain p-4" />
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                                <span className="text-white font-bold uppercase tracking-widest text-sm">Receipt Preview</span>
                                <a 
                                    href={order.receiptUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <ExternalLink className="w-4 h-4" /> Open Original
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-6 opacity-50">
                            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No Receipt Uploaded</p>
                            <p className="text-gray-600 text-xs mt-1">Customer has not uploaded proof of payment yet.</p>
                        </div>
                    )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-black/50 flex flex-col md:flex-row justify-end gap-3">
             {/* Dynamic Status Actions */}
             
             {/* Pending -> Paid or Rejected */}
             {order.status === 'pending' && (
                <>
                    <button 
                        onClick={() => handleStatusClick('rejected')}
                        className="bg-red-500/10 text-red-500 border border-red-500/50 px-6 py-3 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors text-xs flex items-center gap-2"
                    >
                        <Ban className="w-4 h-4" /> Reject Order
                    </button>
                    <button 
                        onClick={() => handleStatusClick('paid')}
                        className="bg-blue-600 text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors text-xs flex items-center gap-2"
                    >
                        <DollarSign className="w-4 h-4" /> Verify & Mark Paid
                    </button>
                </>
             )}

             {/* Paid -> Completed */}
             {order.status === 'paid' && (
                <button 
                    onClick={() => handleStatusClick('completed')}
                    className="bg-green-600 text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-green-500 transition-colors text-xs flex items-center gap-2"
                >
                    <Package className="w-4 h-4" /> Complete Order
                </button>
             )}

            {/* Default Close */}
            <button 
                onClick={onClose}
                className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs"
            >
                Close
            </button>
        </div>

      </div>
    </div>
  );
};