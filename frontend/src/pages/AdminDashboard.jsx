import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Order } from "@/entities/Order";
import { Product } from "@/entities/Product";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  IndianRupee,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Truck
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  preparing: "#8B5CF6",
  out_for_delivery: "#06B6D4",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

const PIE_COLORS = ["#FFD700", "#5C4033", "#8B6F47", "#10B981", "#3B82F6", "#EF4444"];

const TIME_RANGES = [
  { label: "7 Days", value: 7 },
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(currentUser);
      await loadData();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [ordersData, productsData, usersData] = await Promise.all([
      Order.list("-created_date"),
      Product.list(),
      User.list(),
    ]);
    setOrders(ordersData);
    setProducts(productsData);
    setUsers(usersData);
    setLoading(false);
  };

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const now = new Date();
  const rangeStart = subDays(now, timeRange);
  const prevRangeStart = subDays(now, timeRange * 2);

  const inRange = orders.filter(o => new Date(o.order_date || o.created_date) >= rangeStart);
  const prevRange = orders.filter(o => {
    const d = new Date(o.order_date || o.created_date);
    return d >= prevRangeStart && d < rangeStart;
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const rangeRevenue = inRange.reduce((s, o) => s + (o.total_amount || 0), 0);
  const prevRevenue = prevRange.reduce((s, o) => s + (o.total_amount || 0), 0);

  const revenueGrowth = prevRevenue > 0 ? ((rangeRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null;
  const ordersGrowth = prevRange.length > 0 ? ((inRange.length - prevRange.length) / prevRange.length * 100).toFixed(1) : null;

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length) : 0;

  // ── Chart: daily revenue + orders ───────────────────────────────────────────
  const trendData = Array.from({ length: timeRange }, (_, i) => {
    const date = subDays(now, timeRange - 1 - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayOrders = orders.filter(o =>
      format(new Date(o.order_date || o.created_date), 'yyyy-MM-dd') === dayStr
    );
    return {
      date: timeRange <= 7 ? format(date, 'EEE') : format(date, 'MMM d'),
      revenue: dayOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      orders: dayOrders.length,
    };
  });

  // ── Chart: order status breakdown ───────────────────────────────────────────
  const statusCounts = orders.reduce((acc, o) => {
    const s = o.status || 'pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    status,
  }));

  // ── Chart: top products by revenue ──────────────────────────────────────────
  const productRevMap = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const name = item.product_name || 'Unknown';
      productRevMap[name] = (productRevMap[name] || 0) + (item.unit_price || 0) * (item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, revenue]) => ({ name: name.length > 16 ? name.slice(0, 14) + '…' : name, revenue: Math.round(revenue) }));

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: IndianRupee,
      growth: revenueGrowth,
      sub: `₹${rangeRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} this period`,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      growth: ordersGrowth,
      sub: `${inRange.length} this period`,
      color: "from-blue-500 to-cyan-600",
    },
    {
      title: "Avg. Order Value",
      value: `₹${avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      sub: `${orders.length} total orders`,
      color: "from-violet-500 to-purple-600",
    },
    {
      title: "Customers",
      value: users.length,
      icon: Users,
      sub: `${products.length} products listed`,
      color: "from-orange-500 to-red-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#5C4033]">Analytics Dashboard</h1>
            <p className="text-[#8B6F47] text-sm mt-1">Welcome back, {user?.full_name}!</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg border border-[#E8D5C4] overflow-hidden shadow-sm">
              {TIME_RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setTimeRange(r.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${timeRange === r.value
                    ? 'bg-[#5C4033] text-white'
                    : 'text-[#8B6F47] hover:bg-[#FFF8E7]'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button onClick={loadData} variant="outline" size="icon" className="border-[#E8D5C4]">
              <RefreshCw className="w-4 h-4 text-[#8B6F47]" />
            </Button>
          </div>
        </div>

        {/* Pending Alert */}
        {pendingOrders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p className="text-orange-800 flex-1">
              You have <strong>{pendingOrders}</strong> pending order{pendingOrders > 1 ? 's' : ''} awaiting attention.
            </p>
            <Link to={createPageUrl("AdminOrders")}>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">View Orders</Button>
            </Link>
          </motion.div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            const g = parseFloat(stat.growth);
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {stat.growth != null && !isNaN(g) && (
                        <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${g >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {g >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {Math.abs(g)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-[#5C4033]">{stat.value}</p>
                    <p className="text-xs text-[#8B6F47] mt-1">{stat.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Revenue Trend */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#5C4033] text-lg">Revenue & Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5C4033" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5C4033" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E5D8" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8B6F47' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#8B6F47' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} width={55} />
                <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#8B6F47' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E8D5C4', fontSize: 12 }}
                  formatter={(v, name) => [name === 'revenue' ? `₹${v}` : v, name === 'revenue' ? 'Revenue' : 'Orders']}
                />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
                <Area yAxisId="ord" type="monotone" dataKey="orders" stroke="#5C4033" strokeWidth={2} fill="url(#ordGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-[#8B6F47]"><span className="inline-block w-6 h-1 rounded bg-[#FFD700]"></span>Revenue</span>
              <span className="flex items-center gap-1.5 text-xs text-[#8B6F47]"><span className="inline-block w-6 h-1 rounded bg-[#5C4033]"></span>Orders</span>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie + Top Products Bar */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#5C4033] text-lg">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-[#8B6F47] text-sm">No order data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8D5C4', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {statusData.map(d => (
                      <div key={d.status} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[d.status] || '#ccc' }}></span>
                        <span className="text-xs text-[#8B6F47] capitalize">{d.name}</span>
                        <span className="text-xs font-semibold text-[#5C4033] ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#5C4033] text-lg">Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-[#8B6F47] text-sm">No product data</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0E5D8" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8B6F47' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#5C4033' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8D5C4', fontSize: 12 }} formatter={v => [`₹${v}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#FFD700" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#5C4033] text-lg">Recent Orders</CardTitle>
              <Link to={createPageUrl("AdminOrders")}>
                <Button variant="outline" size="sm" className="border-[#E8D5C4] text-[#5C4033]">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0E5D8]">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#8B6F47] uppercase tracking-wide">Order</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#8B6F47] uppercase tracking-wide">Customer</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-[#8B6F47] uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-[#8B6F47] uppercase tracking-wide">Amount</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-[#8B6F47] uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map(order => (
                    <tr key={order.id} className="border-b border-[#F0E5D8] hover:bg-[#FFF8E7] transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[#5C4033]">{order.order_number}</td>
                      <td className="py-2.5 px-3 text-[#8B6F47]">{order.customer_name}</td>
                      <td className="py-2.5 px-3 text-[#8B6F47] hidden md:table-cell">
                        {format(new Date(order.order_date || order.created_date), 'dd MMM yy')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#5C4033]">₹{order.total_amount?.toFixed(0)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{
                            background: (STATUS_COLORS[order.status] || '#ccc') + '22',
                            color: STATUS_COLORS[order.status] || '#666',
                          }}
                        >
                          {(order.status || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Products", path: "AdminProducts", icon: Package, color: "bg-[#5C4033]" },
            { label: "Orders", path: "AdminOrders", icon: ShoppingCart, color: "bg-[#FFD700] text-[#5C4033]" },
            { label: "Categories", path: "AdminCategories", icon: TrendingUp, color: "bg-emerald-600" },
            { label: "Banners", path: "AdminBanners", icon: Calendar, color: "bg-violet-600" },
          ].map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.path} to={createPageUrl(a.path)}>
                <Button className={`w-full h-16 text-white text-sm font-semibold ${a.color}`}>
                  <Icon className="w-5 h-5 mr-2" />{a.label}
                </Button>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}