import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order, Product, OrderStatus } from '../types';
import { 
  Lock, 
  Loader2, 
  AlertTriangle, 
  ArrowLeft, 
  Package, 
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ExternalLink,
  Ban,
  Flag
} from 'lucide-react';

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirmation State (Polymorphic: can be 'product' or 'order')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'product' | 'order', data: Product | Order } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  // Simple Auth Check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('Invalid Password');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedProducts] = await Promise.all([
        api.getOrders(),
        api.getProducts()
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Also update the selected order if it's open
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }

    try {
      await api.updateOrderStatus(orderId, newStatus);
      // If completed, we should refresh inventory data to see new stock levels
      if (newStatus === 'completed') {
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
      }
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Error updating status. Please check console.");
      fetchData(); // Revert on error
    }
  };

  const handleDeleteOrder = async () => {
    if (!itemToDelete || itemToDelete.type !== 'order') return;
    const order = itemToDelete.data as Order;
    setIsDeleting(true);
    try {
        await api.deleteOrder(order.id);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        if (selectedOrder?.id === order.id) {
            setSelectedOrder(null);
        }
    } catch (e) {
        console.error("Failed to delete order", e);
        alert("Failed to delete order.");
    } finally {
        setIsDeleting(false);
    }
  };

  // --- Product Management Logic ---

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: 0, stock_quantity: 0 });
    setProductImageFile(null);
    setProductImagePreview(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
    });
    setProductImageFile(null);
    setProductImagePreview(product.image_url);
    setIsProductModalOpen(true);
  };

  const openDeleteProductModal = (product: Product) => {
    setItemToDelete({ type: 'product', data: product });
    setIsDeleteModalOpen(true);
  };

  const openDeleteOrderModal = (order: Order, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setItemToDelete({ type: 'order', data: order });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'order') {
        await handleDeleteOrder();
        return;
    }

    // Delete Product
    const product = itemToDelete.data as Product;
    setIsDeleting(true);
    try {
      await api.deleteProduct(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImageFile(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    try {
      let imageUrl = editingProduct?.image_url || '';

      // 1. Upload Image if new file selected
      if (productImageFile) {
        imageUrl = await api.uploadProductImage(productImageFile);
      }

      // 2. Upsert Product
      const payload = {
        ...productForm,
        image_url: imageUrl
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        if (!imageUrl) throw new Error("Image is required for new products");
        await api.createProduct(payload);
      }

      // 3. Refresh & Close
      await fetchData();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Product save failed:", error);
      alert("Failed to save product. " + (error as any).message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // --- Render ---

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2 text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>

        <div className="bg-brand-dark border border-white/10 p-8 w-full max-w-md text-center relative">
          <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-6 tracking-wide">ADMIN ACCESS</h1>
          <form onSubmit={handleLogin}>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none mb-4 text-center tracking-widest"
              placeholder="ENTER PASSWORD"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full bg-white text-black py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.stock_quantity < 3);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 border-b border-white/10 pb-6 gap-6">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className="text-3xl font-bold tracking-tighter">ADMIN DASHBOARD</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-brand-dark border border-white/10 rounded-lg p-1">
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    <ClipboardList className="w-4 h-4" /> Orders
                </button>
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                    <Package className="w-4 h-4" /> Inventory
                </button>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <button onClick={onBack} className="text-xs text-gray-500 hover:text-white uppercase tracking-wider">Log Out</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-white/50" />
          </div>
        ) : (
            <>
                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
                        ORDER MANAGEMENT <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">{orders.length}</span>
                      </h2>
                      
                      <div className="bg-brand-dark border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="bg-white/5 text-gray-400 border-b border-white/10 uppercase text-xs tracking-wider">
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {orders.map(order => (
                                <tr 
                                  key={order.id} 
                                  onClick={() => setSelectedOrder(order)}
                                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                  <td className="p-4 font-mono text-white/60 truncate max-w-[100px]" title={order.id}>
                                    {order.id.includes('-') ? `${order.id.split('-')[0]}...` : `#${order.id}`}
                                  </td>
                                  <td className="p-4 font-medium">{order.customerDetails.fullName}</td>
                                  <td className="p-4">₱{order.total.toLocaleString()}</td>
                                  <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                    <select 
                                      value={order.status}
                                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                      className={`bg-transparent border border-white/20 rounded px-2 py-1 text-xs uppercase font-bold outline-none cursor-pointer
                                        ${order.status === 'completed' ? 'text-green-400 border-green-400/30' : ''}
                                        ${order.status === 'paid' ? 'text-blue-400 border-blue-400/30' : ''}
                                        ${order.status === 'rejected' ? 'text-red-500 border-red-500/30' : ''}
                                        ${order.status === 'flagged' ? 'text-orange-500 border-orange-500/30' : ''}
                                        ${order.status === 'pending' ? 'text-yellow-400 border-yellow-400/30' : ''}
                                      `}
                                    >
                                      <option value="pending" className="bg-black text-white">Pending</option>
                                      <option value="paid" className="bg-black text-white">Paid</option>
                                      <option value="completed" className="bg-black text-white">Completed</option>
                                      <option value="rejected" className="bg-black text-white">Rejected</option>
                                      <option value="flagged" className="bg-black text-white">Flagged</option>
                                    </select>
                                  </td>
                                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                     <button 
                                        onClick={(e) => openDeleteOrderModal(order, e)}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                        title="Delete Order"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
                        ALERTS
                        {lowStockProducts.length > 0 && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      </h2>
                      
                      <div className="bg-brand-dark border border-white/10 p-6">
                        {lowStockProducts.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                All systems operational.
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {lowStockProducts.map(p => (
                                    <li key={p.id} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                        <div className="w-12 h-12 bg-gray-900 flex-shrink-0">
                                            <img src={p.image_url} alt="" className="w-full h-full object-cover opacity-70" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{p.name}</h4>
                                            <p className="text-red-500 text-xs font-bold uppercase tracking-wider mt-1">
                                                Only {p.stock_quantity} left
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold tracking-wide">PRODUCT INVENTORY</h2>
                            <button 
                                onClick={openAddProductModal}
                                className="bg-white text-black px-6 py-2 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Product
                            </button>
                        </div>

                        <div className="bg-brand-dark border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-white/5 text-gray-400 border-b border-white/10 uppercase text-xs tracking-wider">
                                            <th className="p-4 w-20">Image</th>
                                            <th className="p-4">Name / ID</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Stock</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {products.map(product => (
                                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="w-12 h-12 bg-gray-900 rounded-sm overflow-hidden">
                                                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{product.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono truncate max-w-[150px]">{product.id}</div>
                                                </td>
                                                <td className="p-4">₱{product.price.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`font-bold ${product.stock_quantity < 3 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {product.stock_quantity}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => openEditProductModal(product)}
                                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => openDeleteProductModal(product)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* --- ORDER DETAILS MODAL --- */}
        {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
                
                <div className="relative bg-brand-dark border border-white/10 w-full max-w-4xl p-6 md:p-8 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/10">
                        <div>
                            <h2 className="text-2xl font-bold tracking-wide text-white flex items-center gap-3">
                                ORDER #{selectedOrder.id}
                                <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-widest border ${
                                    selectedOrder.status === 'completed' ? 'border-green-500 text-green-500' :
                                    selectedOrder.status === 'paid' ? 'border-blue-500 text-blue-500' :
                                    selectedOrder.status === 'rejected' ? 'border-red-500 text-red-500' :
                                    selectedOrder.status === 'flagged' ? 'border-orange-500 text-orange-500' :
                                    'border-yellow-500 text-yellow-500'
                                }`}>
                                    {selectedOrder.status}
                                </span>
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <button 
                                onClick={() => openDeleteOrderModal(selectedOrder)}
                                className="text-red-500 hover:text-red-400 flex items-center gap-1 text-xs uppercase font-bold tracking-wider border border-red-500/30 px-3 py-2 rounded hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Order
                            </button>
                            <div className="h-8 w-px bg-white/10"></div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                        {/* LEFT COLUMN: Details */}
                        <div className="space-y-8">
                            {/* Customer Info */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Customer Information
                                </h3>
                                <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase">Full Name</p>
                                        <p className="font-medium text-white">{selectedOrder.customerDetails.fullName}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase flex items-center gap-1"><Phone className="w-3 h-3"/> Contact</p>
                                            <p className="font-medium text-white">{selectedOrder.customerDetails.contactNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs uppercase flex items-center gap-1"><Mail className="w-3 h-3"/> Email</p>
                                            <p className="font-medium text-white truncate" title={selectedOrder.customerDetails.email}>{selectedOrder.customerDetails.email}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Shipping Address</p>
                                        <p className="font-medium text-white leading-relaxed">{selectedOrder.customerDetails.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Order Summary
                                </h3>
                                <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border-b border-white/5 last:border-0">
                                            <div className="w-12 h-12 bg-gray-900 rounded-sm overflow-hidden flex-shrink-0">
                                                 {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-white">{item.name}</p>
                                                <p className="text-xs text-gray-400">Qty: {item.quantity} x ₱{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-white">₱{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-4 bg-white/10 flex justify-between items-center">
                                        <span className="font-bold text-sm uppercase tracking-wider">Total Amount</span>
                                        <span className="font-bold text-xl text-white">₱{selectedOrder.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Receipt */}
                        <div className="flex flex-col h-full">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Payment Verification
                            </h3>
                            
                            <div className="flex-1 bg-black border border-white/10 rounded-lg p-2 flex flex-col">
                                <div className="flex items-center justify-between mb-2 px-2">
                                    <span className="text-xs text-gray-400 uppercase">{selectedOrder.customerDetails.paymentMethod}</span>
                                    {selectedOrder.receiptUrl && (
                                        <a href={selectedOrder.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-white flex items-center gap-1">
                                            Open Original <ExternalLink className="w-3 h-3"/>
                                        </a>
                                    )}
                                </div>
                                
                                <div className="flex-1 bg-gray-900/50 rounded flex items-center justify-center relative overflow-hidden min-h-[300px]">
                                    {selectedOrder.receiptUrl ? (
                                        <img 
                                            src={selectedOrder.receiptUrl} 
                                            alt="Payment Receipt" 
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No receipt uploaded yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-4">
                                {selectedOrder.status !== 'completed' && (
                                    <button 
                                        onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                                        className="w-full bg-white text-black py-3 font-bold uppercase tracking-widest hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Mark Completed
                                    </button>
                                )}
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleStatusChange(selectedOrder.id, 'rejected')}
                                        className="flex-1 border border-red-500/50 text-red-500 py-3 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Ban className="w-3 h-3" /> Reject
                                    </button>
                                    <button 
                                        onClick={() => handleStatusChange(selectedOrder.id, 'flagged')}
                                        className="flex-1 border border-orange-500/50 text-orange-500 py-3 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Flag className="w-3 h-3" /> Flag
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- PRODUCT MODAL --- */}
        {isProductModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsProductModalOpen(false)} />
                
                <div className="relative bg-brand-dark border border-white/10 w-full max-w-2xl p-8 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold tracking-wide">
                            {editingProduct ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
                        </h2>
                        <button onClick={() => setIsProductModalOpen(false)} className="text-gray-500 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleProductSubmit} className="space-y-6 overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Image Upload Section */}
                            <div className="space-y-4">
                                <label className="block text-xs uppercase tracking-wider text-gray-500">Product Image</label>
                                <div className="aspect-square bg-black border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group hover:border-white/50 transition-colors">
                                    {productImagePreview ? (
                                        <img src={productImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                            <span className="text-xs text-gray-500">Click to upload</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleProductImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        required={!editingProduct} // Required only on create
                                    />
                                    {productImagePreview && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                            <span className="text-white text-xs font-bold uppercase">Change Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Text Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Product Name</label>
                                    <input 
                                        required
                                        value={productForm.name}
                                        onChange={e => setProductForm({...productForm, name: e.target.value})}
                                        className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                                        placeholder="e.g. Chrono Elite"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Price (₱)</label>
                                        <input 
                                            type="number"
                                            required
                                            min="0"
                                            value={productForm.price === 0 ? '' : productForm.price}
                                            onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Stock Qty</label>
                                        <input 
                                            type="number"
                                            required
                                            min="0"
                                            value={productForm.stock_quantity === 0 ? '' : productForm.stock_quantity}
                                            onChange={e => setProductForm({...productForm, stock_quantity: Number(e.target.value)})}
                                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Description</label>
                            <textarea 
                                required
                                rows={4}
                                value={productForm.description}
                                onChange={e => setProductForm({...productForm, description: e.target.value})}
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors resize-none"
                                placeholder="Product details..."
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <button 
                                type="submit"
                                disabled={isSubmittingProduct}
                                className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmittingProduct ? <Loader2 className="animate-spin w-5 h-5" /> : (editingProduct ? 'Save Changes' : 'Create Product')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {isDeleteModalOpen && itemToDelete && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isDeleting && setIsDeleteModalOpen(false)} />
                
                <div className="relative bg-brand-dark border border-white/10 w-full max-w-md p-8 shadow-2xl animate-fade-in-up text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2 tracking-wide text-white">DELETE {itemToDelete.type === 'order' ? 'ORDER' : 'PRODUCT'}?</h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Are you sure you want to delete {itemToDelete.type === 'order' ? `Order #${(itemToDelete.data as Order).id}` : <span className="font-bold text-white">{(itemToDelete.data as Product).name}</span>}? 
                        <br/>This action cannot be undone.
                    </p>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="flex-1 border border-white/20 py-3 font-bold uppercase tracking-widest hover:bg-white/10 transition-colors text-xs disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 text-white py-3 font-bold uppercase tracking-widest hover:bg-red-700 transition-colors text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Admin;