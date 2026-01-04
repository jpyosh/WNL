export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderForm {
  fullName: string;
  address: string;
  contactNumber: string;
  email: string;
  paymentMethod: 'GCash' | 'Bank Transfer';
}

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'rejected' | 'flagged';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerDetails: OrderForm;
  status: OrderStatus;
  receiptUrl?: string;
  createdAt: string;
}