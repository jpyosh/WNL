import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { supabase } from '../lib/supabaseClient'; // Import supabase client
import { Order, Product, OrderStatus } from '../types';
import { OrderDetailModal } from '../components/OrderDetailModal';
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
  Flag,
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface AdminProps {
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onBack }) => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'product' | 'order', data: Product | Order } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Product Form State
  const [productForm, setProductForm] = useState<{
    name: string;
    description: string;
    price: number | string;
    stock_quantity: number | string;
    category: string;
  }>({
    name: '',
    description: '',
    price: '', 
    stock_quantity: '', 
    category: 'Prospex', 
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  // --- Authentication Logic ---

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) fetchData();
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setLoginError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError(error.message);
      setAuthLoading(false);
    } else {
        // Successful login will trigger onAuthStateChange
        // We don't need to do anything here manually
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    onBack(); // Go back to shop after logout
  };

  // --- Data Logic ---

  const fetchData = async () => {
    setDataLoading(true);
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
      setDataLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }

    try {
      await api.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'completed') {
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
      }
    } catch (e) {
      console.error("Failed to update status", e);
      alert("Error updating status. Please check console.");
      fetchData(); 
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

  // --- Filtering & Sorting Logic ---

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        const matchesSearch = 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerDetails.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerDetails.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'total-desc') return b.total - a.total;
        if (sortBy === 'total-asc') return a.total - b.total;
        return 0;
    });
  }, [orders, searchTerm, statusFilter, sortBy]);

  // --- Dashboard Statistics ---
  
  const stats = useMemo(() => {
      const revenue = orders
        .filter(o => ['paid', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + o.total, 0);
      
      const pending = orders.filter(o => o.status === 'pending').length;
      
      return { revenue, pending, total: orders.length };
  }, [orders]);


  // --- Product Management Logic ---

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({ 
      name: '', 
      description: '', 
      price: '', 
      stock_quantity: '', 
      category: 'Prospex' 
    });
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
      category: product.category || 'Prospex'
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

      if (productImageFile) {
        imageUrl = await api.uploadProductImage(productImageFile);
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: productForm.price === '' ? 0 : Number(productForm.price),
        stock_quantity: productForm.stock_quantity === '' ? 0 : Number(productForm.stock_quantity),
        image_url: imageUrl
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        if (!imageUrl) throw new Error("Image is required for new products");
        await api.createProduct(payload);
      }

      await fetchData();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Product save failed:", error);
      alert("Failed to save product. " + (error as any).message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // --- Render Login Screen ---
  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2 text-sm uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>

        <div className="bg-brand-dark border border-white/10 p-8 w-full max-w-md text-center relative animate-fade-in-up">
          <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">ADMIN ACCESS</h1>
          <p className="text-gray-500 text-xs mb-6 uppercase tracking-widest">Secure Login</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-xs text-center">
                {loginError}
              </div>
            )}
            
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none text-center tracking-wider"
              placeholder="EMAIL ADDRESS"
              required
            />
            
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none text-center tracking-wider"
              placeholder="PASSWORD"
              required
            />
            
            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-white text-black py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Render Dashboard ---
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
            <button 
              onClick={handleLogout} 
              className="text-xs text-gray-500 hover:text-white uppercase tracking-wider"
            >
              Log Out
            </button>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-white/50" />
          </div>
        ) : (
            <>
                {/* --- ORDERS TAB --- */}
                {activeTab === 'orders' && (
                  <div className="space-y-8 animate-fade-in-up">
                    
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-brand-dark border border-white/10 p-6 flex items-center justify-between rounded-lg">
                          <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Verified Revenue</p>
                            <h3 className="text-2xl font-bold text-white">₱{stats.revenue.toLocaleString()}</h3>
                          </div>
                          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                             <TrendingUp className="w-6 h-6 text-green-500" />
                          </div>
                       </div>
                       <div className="bg-brand-dark border border-white/10 p-6 flex items-center justify-between rounded-lg">
                          <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Pending Actions</p>
                            <h3 className="text-2xl font-bold text-white">{stats.pending}</h3>
                          </div>
                          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                             <Clock className="w-6 h-6 text-yellow-500" />
                          </div>
                       </div>
                       <div className="bg-brand-dark border border-white/10 p-6 flex items-center justify-between rounded-lg">
                          <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Orders</p>
                            <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
                          </div>
                          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                             <Package className="w-6 h-6 text-blue-500" />
                          </div>
                       </div>
                    </div>

                    {/* Toolbar & Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-dark border border-white/10 p-4 rounded-lg">
                                {/* Search */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search order..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black border border-white/20 pl-10 pr-4 py-2 text-sm text-white focus:border-white outline-none rounded-sm transition-colors"
                                    />
                                </div>
                                
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                                    {/* Status Filter */}
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                                        <select 
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="appearance-none bg-black border border-white/20 pl-9 pr-8 py-2 text-sm text-white focus:border-white outline-none rounded-sm cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <option value="All">All Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="completed">Completed</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="flagged">Flagged</option>
                                        </select>
                                    </div>

                                    {/* Sort */}
                                    <div className="relative">
                                        <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                                        <select 
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="appearance-none bg-black border border-white/20 pl-9 pr-8 py-2 text-sm text-white focus:border-white outline-none rounded-sm cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <option value="date-desc">Newest</option>
                                            <option value="date-asc">Oldest</option>
                                            <option value="total-desc">Highest Amount</option>
                                            <option value="total-asc">Lowest Amount</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                          
                            {/* Table */}
                            <div className="bg-brand-dark border border-white/10 overflow-hidden rounded-lg">
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
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                No orders found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <tr 
                                            key={order.id} 
                                            onClick={() => setSelectedOrder(order)}
                                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                                            >
                                            <td className="p-4 font-mono text-white/60 truncate max-w-[100px]" title={order.id}>
                                                {order.id.includes('-') ? `${order.id.split('-')[0]}...` : `#${order.id}`}
                                            </td>
                                            <td className="p-4 font-medium">
                                                {order.customerDetails.fullName}
                                                <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{order.customerDetails.email}</div>
                                            </td>
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
                                        ))
                                    )}
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
                            
                            <div className="bg-brand-dark border border-white/10 p-6 rounded-lg">
                                {lowStockProducts.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8 text-sm">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        Inventory is healthy.
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
                                            <th className="p-4">Category</th>
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
                                                <td className="p-4">
                                                    <span className="bg-white/10 px-2 py-1 rounded text-xs uppercase tracking-wide text-gray-300">
                                                        {product.category || 'Others'}
                                                    </span>
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

        {/* --- ORDER DETAIL MODAL --- */}
        <OrderDetailModal 
            isOpen={!!selectedOrder} 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
        />

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

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Category</label>
                                    <select 
                                        value={productForm.category}
                                        onChange={e => setProductForm({...productForm, category: e.target.value})}
                                        className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                                    >
                                        <option value="Prospex">Prospex (Seiko Sports)</option>
                                        <option value="Presage">Presage (Seiko Dress)</option>
                                        <option value="GMT">GMT (Travel Watches)</option>
                                        <option value="Womens">Womens</option>
                                        <option value="Swiss & Luxury">Swiss & Luxury</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Price (₱)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={productForm.price}
                                            onChange={e => setProductForm({...productForm, price: e.target.value})}
                                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Stock Qty</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            value={productForm.stock_quantity}
                                            onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})}
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