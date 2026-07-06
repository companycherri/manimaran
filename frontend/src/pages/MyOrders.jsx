import React from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, Truck, XCircle, ShoppingBag, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Pending" },
  confirmed: { icon: CheckCircle2, color: "bg-blue-100 text-blue-800 border-blue-300", label: "Confirmed" },
  preparing: { icon: Package, color: "bg-purple-100 text-purple-800 border-purple-300", label: "Preparing" },
  out_for_delivery: { icon: Truck, color: "bg-orange-100 text-orange-800 border-orange-300", label: "Out for Delivery" },
  delivered: { icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-300", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-red-100 text-red-800 border-red-300", label: "Cancelled" }
};

function OrderCard({ order, index }) {
  const [expanded, setExpanded] = React.useState(false);
  const status = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const orderDate = (() => {
    try {
      return format(new Date(order.order_date || order.created_date), "dd MMM yyyy, hh:mm a");
    } catch {
      return "—";
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl shadow-sm border border-[#FED800]/20 overflow-hidden"
    >
      {/* Order Header */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FED800]/20 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#5C4033]" />
          </div>
          <div>
            <p className="font-bold text-[#5C4033] text-base">Order #{order.order_number}</p>
            <p className="text-xs text-[#8B6F47] mt-0.5">{orderDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:flex-shrink-0">
          <Badge className={`${status.color} border flex items-center gap-1 text-xs px-3 py-1`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </Badge>
          <div className="text-right">
            <p className="text-xs text-[#8B6F47]">Total</p>
            <p className="font-bold text-[#FED800] text-lg">₹{order.total_amount?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expandable Items Section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 bg-[#FFF8E7] border-t border-[#FED800]/20 flex items-center justify-between text-sm text-[#5C4033] font-medium hover:bg-[#FED800]/10 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          View Order Details ({order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''})
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-5 border-t border-[#FED800]/10">
          {/* Items Table */}
          <div className="overflow-x-auto rounded-lg border border-[#E8D5C4]">
            <table className="w-full text-sm">
              <thead className="bg-[#FED800]">
                <tr>
                  <th className="text-left px-4 py-3 text-[#5C4033] font-semibold">Product</th>
                  <th className="text-center px-4 py-3 text-[#5C4033] font-semibold">Qty / Weight</th>
                  <th className="text-right px-4 py-3 text-[#5C4033] font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-3 text-[#5C4033] font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#FFF8E7]"}>
                    <td className="px-4 py-3 text-[#5C4033] font-medium">{item.product_name || "—"}</td>
                    <td className="px-4 py-3 text-center text-[#8B6F47]">{item.quantity} × {item.weight || item.unit || ""}</td>
                    <td className="px-4 py-3 text-right text-[#8B6F47]">₹{(item.unit_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#5C4033]">
                      ₹{((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[#FED800]">
                <tr className="bg-[#FFF8E7]">
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-[#5C4033]">Order Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-[#FED800] text-base">₹{order.total_amount?.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Delivery Info */}
          {(order.delivery_address || order.customer_phone) && (
            <div className="mt-4 p-4 bg-[#FFF8E7] rounded-xl border border-[#E8D5C4]">
              <p className="text-xs font-semibold text-[#5C4033] uppercase tracking-wide mb-2">Delivery Info</p>
              {order.customer_name && (
                <p className="text-sm text-[#5C4033]"><span className="text-[#8B6F47]">Name:</span> {order.customer_name}</p>
              )}
              {order.customer_phone && (
                <p className="text-sm text-[#5C4033]"><span className="text-[#8B6F47]">Phone:</span> {order.customer_phone}</p>
              )}
              {order.delivery_address && (
                <p className="text-sm text-[#5C4033]"><span className="text-[#8B6F47]">Address:</span> {order.delivery_address}</p>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me) {
        const userOrders = await base44.entities.Order.filter({ created_by: me.email }, "-created_date");
        setOrders(userOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-7xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-[#5C4033] mb-2">Please Login</h2>
        <p className="text-[#8B6F47]">You need to be logged in to view your orders.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF8E7] min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#5C4033] flex items-center gap-3">
            <Package className="w-8 h-8 text-[#FED800]" />
            My Orders
          </h1>
          <p className="text-[#8B6F47] mt-1">
            {orders.length > 0
              ? `You have ${orders.length} order${orders.length !== 1 ? "s" : ""}`
              : "No orders found"}
          </p>
        </div>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-3xl shadow-sm border border-[#FED800]/20"
          >
            <div className="text-7xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-[#5C4033] mb-2">No orders yet</h2>
            <p className="text-[#8B6F47] text-sm">Your order history will appear here once you place an order.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}