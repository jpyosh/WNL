import { supabase } from '../lib/supabaseClient';
import { Product, Order, OrderForm, CartItem } from '../types';

export const api = {
  getProducts: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data as Product[];
  },

  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    // Map DB columns to Order type
    return data.map((row: any) => ({
      id: row.id,
      items: [], // Items are not fetched for the list view to save performance
      total: row.total_amount,
      customerDetails: {
        fullName: row.customer_name,
        address: row.customer_address,
        contactNumber: row.customer_contact,
        email: row.customer_email,
        paymentMethod: row.payment_method,
      },
      status: row.status,
      receiptUrl: row.receipt_url,
      createdAt: row.created_at
    }));
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
  },

  createOrder: async (form: OrderForm, items: CartItem[], total: number): Promise<Order> => {
    // 1. Insert into 'orders' table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_name: form.fullName,
        customer_address: form.address,
        customer_contact: form.contactNumber,
        customer_email: form.email,
        payment_method: form.paymentMethod,
        total_amount: total,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

    // 2. Insert into 'order_items' table
    const orderItems = items.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price // Snapshot price at purchase time
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw new Error(`Failed to add items: ${itemsError.message}`);

    // 3. Return constructed Order object for UI
    return {
      id: orderData.id,
      items: items,
      total: orderData.total_amount,
      customerDetails: form,
      status: orderData.status,
      createdAt: orderData.created_at,
      receiptUrl: orderData.receipt_url
    };
  },

  uploadReceipt: async (orderId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    // 3. Update Order record
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        receipt_url: publicUrl,
        status: 'paid' // Auto-mark as paid/verification-pending on upload
      })
      .eq('id', orderId);

    if (updateError) throw new Error(`Failed to link receipt: ${updateError.message}`);

    return publicUrl;
  },

  // --- Product Management ---

  uploadProductImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `prod_${Date.now()}.${fileExt}`;
    
    // Upload to 'products' bucket
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return data as Product;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(`Failed to update product: ${error.message}`);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete product: ${error.message}`);
  }
};