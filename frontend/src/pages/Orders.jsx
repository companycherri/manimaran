import React from "react";
import { Order } from "@/entities/Order";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Orders() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        const userOrders = await Order.filter({ created_by: user.email }, "-created_date");
        setOrders(userOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
    setLoading(false);
  };

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Pending" },
    confirmed: { icon: CheckCircle2, color: "bg-blue-100 text-blue-800 border-blue-300", label: "Confirmed" },
    preparing: { icon: Package, color: "bg-purple-100 text-purple-800 border-purple-300", label: "Preparing" },
    out_for_delivery: { icon: Truck, color: "bg-orange-100 text-orange-800 border-orange-300", label: "Out for Delivery" },
    delivered: { icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-300", label: "Delivered" },
    cancelled: { icon: XCircle, color: "bg-red-100 text-red-800 border-red-300", label: "Cancelled" }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-[#5C4033] mb-8 flex items-center gap-3">
        <Package className="w-8 h-8 text-[#FFD700]" />
        My Orders
      </h1>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-3xl"
        >
          <div className="text-8xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-[#5C4033] mb-2">No orders yet</h2>
          <p className="text-[#8B6F47]">Your order history will appear here</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-[#FFD700]/20"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#5C4033] mb-1">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-[#8B6F47]">
                      {format(new Date(order.order_date || order.created_date), "PPP 'at' p")}
                    </p>
                  </div>
                  <Badge className={`${status.color} border mt-2 md:mt-0`}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {status.label}
                  </Badge>
                </div>

                <div className="border-t border-[#FFD700]/20 pt-4 space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[#8B6F47]">
                      <span>{item.product_name} × {item.quantity} {item.unit}</span>
                      <span className="font-medium">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#FFD700]/20 mt-4 pt-4 flex justify-between items-center">
                  <div className="text-sm text-[#8B6F47]">
                    <p><strong>Customer:</strong> {order.customer_name}</p>
                    <p><strong>Phone:</strong> {order.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#8B6F47] mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-[#FFD700]">
                      ₹{order.total_amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}