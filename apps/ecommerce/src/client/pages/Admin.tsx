import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $adminUser, $user, logoutAdmin, $router } from '../store';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog } from '../../components/ui/dialog';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Package,
  ShoppingBag,
  Eye,
  Calendar,
  DollarSign,
  Archive,
  RefreshCw,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import type { SelectOrder, SelectProduct, SelectUser } from '@/db/schema';

export function Admin() {
  const admin = useStore($adminUser);
  const user = useStore($user);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'telemetry'>(
    'inventory',
  );

  // Auth & Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Inventory State
  const [products, setProducts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialProductState = {
    name: '',
    description: '',
    price: '',
    category: '',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60',
    stock: '100',
  };
  const [productForm, setProductForm] = useState(initialProductState);
  const [generating, setGenerating] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Telemetry State
  const [edgeLogs, setEdgeLogs] = useState<any[]>([]);

  useEffect(() => {
    if (admin) {
      if (activeTab === 'inventory') fetchProducts();
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'telemetry') fetchLogs();
    }
  }, [admin, activeTab]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/edge-logs');
      const data = await res.json() as any;
      setEdgeLogs(data.logs || []);
    } catch (e) {
      toast.error('Failed to load telemetry');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = (await res.json()) as { products: SelectProduct[] };
      setProducts(data.products || []);
    } catch (err) {
      toast.error('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = (await res.json()) as { orders: SelectOrder[] };
      setOrders(data.orders || []);
    } catch (err) {
      toast.error('Failed to load orders');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as {
        success: boolean;
        user: SelectUser;
        error?: string;
      };
      if (data.success) {
        $user.set(data.user);
        if (data.user.role === 'admin') {
          $adminUser.set(data.user);
          toast.success(`Welcome ${data.user.name}`);
        } else {
          toast.error("Access Denied: Admins Only");
        }
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Inventory Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = isEditing ? 'PATCH' : 'POST';
    const url = isEditing
      ? `/api/admin/products/${editingId}`
      : '/api/admin/products';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
        }),
      });
      if (res.ok) {
        toast.success(isEditing ? 'Saved' : 'Created');
        setProductForm(initialProductState);
        setIsEditing(false);
        setEditingId(null);
        setIsDialogOpen(false);
        fetchProducts();
      } else {
        toast.error('Error saving');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (res.ok) {
        toast.success('Deleted');
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const simulateFlashSale = async (id: string) => {
    toast('Simulating 50 concurrent buyers (Hitting DO...)');
    try {
      const res = await fetch(`/api/admin/products/${id}/simulate-concurrency`, {
        method: 'POST'
      });
      
      const data = (await res.json()) as any;
      if (res.ok) {
        toast.success(`Simulation Complete: ${data.successes} Bought, ${data.failures} Rejected.`);
        fetchProducts(); // Refresh stock
      } else {
         toast.error(data.error || 'Simulation Failed');
      }
    } catch (err) {
      toast.error('Network error during simulation');
    }
  };


  const handleArchive = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      toast.error('Error');
    }
  };

  const startEdit = (product: any) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      stock: product.stock.toString(),
    });
    setEditingId(product.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openNewProduct = () => {
    setProductForm(initialProductState);
    setIsEditing(false);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const generateAiDescription = async () => {
    if (!productForm.name) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: productForm.name }),
      });
      const data = (await res.json()) as { description: string };
      setProductForm({ ...productForm, description: data.description });
    } catch (err) {
    } finally {
      setGenerating(false);
    }
  };

  // Orders Handlers
  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {}
  };

  if (!admin) {
    return (
      <div className="flex items-center justify-center py-32 px-4">
        <div className="w-full max-w-sm border border-slate-200 p-10 bg-white">
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-sm text-slate-500 mt-2">Administrative access only</p>
          </div>
          
          {(user as any)?.role && (user as any).role !== 'admin' ? (
            <div className="space-y-6">
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase">
                    Your account does not have administrative privileges.
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => $router.open('/')}
                    className="w-full h-12 border-slate-200 rounded-none font-bold"
                >
                    RETURN TO SHOP
                </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-900 uppercase">Username</Label>
                <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="h-12 border-slate-200 rounded-none shadow-none"
                />
                </div>
                <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-900 uppercase">Password</Label>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 border-slate-200 rounded-none shadow-none"
                />
                </div>
                <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-900 text-white font-bold rounded-none shadow-none"
                >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'AUTHENTICATE'}
                </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Common Product Form (used in Dialog)
  const ProductFormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-slate-900">
          Name
        </Label>
        <Input
          value={productForm.name}
          onChange={(e) =>
            setProductForm({ ...productForm, name: e.target.value })
          }
          placeholder="Product Name"
          className="h-12 border-slate-200 rounded-none shadow-none"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase text-slate-900">
            Description
          </Label>
          <button
            type="button"
            onClick={generateAiDescription}
            disabled={generating}
            className="text-xs font-bold text-slate-400 hover:text-slate-900"
          >
            {generating ? 'Working...' : 'AI Describe'}
          </button>
        </div>
        <textarea
          className="w-full h-32 p-4 border border-slate-200 rounded-none shadow-none focus:outline-none focus:border-slate-900 text-sm"
          value={productForm.description}
          onChange={(e) =>
            setProductForm({ ...productForm, description: e.target.value })
          }
        ></textarea>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-slate-900">
            Price ($)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={productForm.price}
            onChange={(e) =>
              setProductForm({ ...productForm, price: e.target.value })
            }
            placeholder="0.00"
            className="h-12 border-slate-200 rounded-none shadow-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-slate-900">
            Category
          </Label>
          <Input
            value={productForm.category}
            onChange={(e) =>
              setProductForm({ ...productForm, category: e.target.value })
            }
            placeholder="Category"
            className="h-12 border-slate-200 rounded-none shadow-none"
          />
        </div>
      </div>
      <div className="pt-6 flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(false)}
          className="flex-1 h-12 border-slate-200 rounded-none shadow-none font-bold"
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-[2] h-12 bg-slate-900 text-white font-bold rounded-none shadow-none"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isEditing ? (
            'UPDATE'
          ) : (
            'CREATE'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-500 mt-1">{admin.name}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`text-sm font-bold transition-all ${activeTab === 'inventory' ? 'text-slate-900 underline underline-offset-8' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`text-sm font-bold transition-all ${activeTab === 'orders' ? 'text-slate-900 underline underline-offset-8' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`text-sm font-bold transition-all ${activeTab === 'telemetry' ? 'text-blue-600 underline underline-offset-8' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Edge Telemetry
            </button>
          </div>
          <button
            onClick={logoutAdmin}
            className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Management</h2>
            <div className="flex gap-4">
               {products.length > 0 && (
                   <Button 
                      onClick={() => simulateFlashSale(products[0].id)}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-none h-12 px-8 font-bold"
                   >
                     <Zap className="h-4 w-4 mr-2" />
                     FLASH SALE (DO LOCK TEST)
                   </Button>
               )}
               <Dialog
                 open={isDialogOpen}
                 setOpen={setIsDialogOpen}
                 title={isEditing ? 'Edit' : 'New Item'}
                 content={ProductFormContent}
               >
                 <Button
                   onClick={openNewProduct}
                   className="bg-slate-900 text-white rounded-none h-12 px-10 font-bold shadow-none"
                 >
                   ADD PRODUCT
                 </Button>
               </Dialog>
            </div>
          </div>

          <div className="border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-4 font-bold text-slate-900 text-[11px] uppercase">
                      Product
                    </th>
                    <th className="px-8 py-4 font-bold text-slate-900 text-[11px] uppercase">
                      Category
                    </th>
                    <th className="px-8 py-4 font-bold text-slate-900 text-[11px] uppercase">
                      Status
                    </th>
                    <th className="px-8 py-4 text-right font-bold text-slate-900 text-[11px] uppercase">
                      Price
                    </th>
                    <th className="px-8 py-4 text-center font-bold text-slate-900 text-[11px] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-8 py-24 text-center text-slate-400"
                      >
                        Inventory is empty.
                      </td>
                    </tr>
                  )}
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/50 transition-colors ${p.status === 'archived' ? 'opacity-40' : ''}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <img
                            src={p.image}
                            alt=""
                            className="h-16 w-16 bg-slate-50 object-cover border border-slate-100"
                          />
                          <span className="font-bold text-slate-900">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-medium text-slate-500 uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span
                          className={`text-[10px] font-bold uppercase ${p.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-slate-900">
                        ${(p.price / 100).toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(p.id, p.status)}
                            className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                          >
                            {p.status === 'active' ? (
                              <Archive className="h-4 w-4" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => simulateFlashSale(p.id)}
                            className="p-2 text-slate-300 hover:text-blue-600 transition-colors"
                            title="DO Flash Sale Lock Demo"
                          >
                            <Zap className="h-4 w-4" />
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
      ) : activeTab === 'orders' ? (
        <div className="space-y-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-200 bg-white">
            <div className="p-10 border-r border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Revenue
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                ${orders.reduce((acc, o) => acc + o.total / 100, 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-10 border-r border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pending
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {orders.filter((o) => o.status === 'pending').length}
              </h3>
            </div>
            <div className="p-10">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Completed
              </p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">
                {orders.filter((o) => o.status === 'delivered').length}
              </h3>
            </div>
          </div>

          {/* List */}
          <div className="border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-4 font-bold text-slate-900 text-[11px] uppercase">
                      ID
                    </th>
                    <th className="px-8 py-4 font-bold text-slate-900 text-[11px] uppercase">
                      Customer
                    </th>
                    <th className="px-8 py-4 text-right font-bold text-slate-900 text-[11px] uppercase">
                      Amount
                    </th>
                    <th className="px-8 py-4 text-center font-bold text-slate-900 text-[11px] uppercase">
                      Fulfillment
                    </th>
                    <th className="px-8 py-4 text-center font-bold text-slate-900 text-[11px] uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-mono text-[11px] text-slate-400">
                          #{order.id.split('_')[1]}
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">
                            {order.userId === 'guest'
                              ? 'GUEST'
                              : order.userId.slice(0, 8)}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-slate-900">
                          ${(order.total / 100).toFixed(2)}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value)
                            }
                            className="text-[10px] font-bold uppercase border-none focus:ring-0 cursor-pointer bg-transparent"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() =>
                              setSelectedOrder(
                                selectedOrder === order.id ? null : order.id,
                              )
                            }
                            className={`p-2 transition-all ${selectedOrder === order.id ? 'text-slate-900' : 'text-slate-300 hover:text-slate-900'}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {selectedOrder === order.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-12 py-10">
                            <div className="space-y-6">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                MANIFEST
                              </p>
                              <div className="grid grid-cols-1 gap-4">
                                {order.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between text-xs bg-white p-6 border border-slate-200"
                                  >
                                    <div className="flex items-center gap-6">
                                      <img
                                        src={item.product?.image}
                                        className="h-12 w-12 object-cover border border-slate-100"
                                      />
                                      <div>
                                        <span className="font-bold text-slate-900 uppercase">
                                          {item.product?.name || 'Unknown Item'}
                                        </span>
                                        <p className="text-[10px] text-slate-400 uppercase">
                                          {item.product?.category}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-12">
                                      <div className="text-right">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                                          Qty
                                        </p>
                                        <p className="text-slate-900 font-bold">
                                          {item.quantity}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">
                                          Price
                                        </p>
                                        <p className="text-slate-900 font-bold">
                                          ${(item.price / 100).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Edge Workflow Trace */}
                              <div className="bg-slate-950 p-6 font-mono text-xs text-slate-400 space-y-4">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="font-bold text-white uppercase text-[10px] tracking-widest">Edge Workflow Trace</span>
                                  </div>
                                  <span className="text-[10px] bg-slate-800 px-2 py-1 text-slate-300">Live Telemetry</span>
                                </div>

                                <div className="space-y-2">
                                  <div className={`flex items-center gap-3 ${order.status === 'pending' || order.status === 'paid' || order.status === 'shipped' ? 'text-blue-400' : 'text-slate-600'}`}>
                                    <span className="font-bold">[QUEUE]</span> Initialized Order fulfillment state
                                  </div>
                                  <div className={`flex items-center gap-3 ${order.status === 'paid' || order.status === 'shipped' ? 'text-blue-400' : 'text-slate-600 opacity-40'}`}>
                                    <span className="font-bold">[AUTH]</span> Payment status synchronized with Edge
                                  </div>
                                  <div className={`flex items-center gap-3 ${order.status === 'shipped' ? 'text-green-400' : 'text-slate-600 opacity-40'}`}>
                                    <span className="font-bold">[SHIP]</span> Fulfillment node dispatched for delivery
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'telemetry' ? (
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
             <div>
                <h2 className="text-xl font-bold text-slate-900">Edge Queue Telemetry</h2>
                <p className="text-sm text-slate-500 mt-1">Real-time visualization of background worker tasks ingested via Cloudflare Queues.</p>
             </div>
             <Button
                onClick={fetchLogs}
                variant="outline"
                className="rounded-none font-bold text-xs"
             >
                <RefreshCw className="h-4 w-4 mr-2" /> REFRESH
             </Button>
          </div>
          
          <div className="border border-slate-200 bg-slate-900 p-6 rounded-none shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                 <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Live Ingestion Stream</span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 font-mono text-xs">
                 {edgeLogs.length === 0 && (
                     <div className="text-slate-500 text-center py-10">Awaiting events...</div>
                 )}
                 {edgeLogs.map(log => (
                     <div key={log.id} className="border border-slate-800 bg-[#0a0f1c] p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-slate-400">
                           <span className="text-blue-400 font-bold">[{log.event}]</span>
                           <span className="opacity-50">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-300 whitespace-pre-wrap break-all">
                           {log.details}
                        </div>
                     </div>
                 ))}
              </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
