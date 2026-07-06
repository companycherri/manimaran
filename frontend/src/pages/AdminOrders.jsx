import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Order } from "@/entities/Order";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Clock, CheckCircle2, Truck, Package, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus]);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(currentUser);
      await loadOrders();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    const allOrders = await Order.list("-created_date");
    setOrders(allOrders);
    setLoading(false);
  };

  const filterOrders = () => {
    if (filterStatus === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === filterStatus));
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await Order.update(orderId, { status: newStatus });
      toast.success("Order status updated");
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await Order.filter({ id: orderId });
        setSelectedOrder(updated[0]);
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-[#5C4033]">Order Management</h1>
              <p className="text-[#8B6F47]">{orders.length} total orders</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#5C4033]">
                            {order.order_number}
                          </h3>
                          <Badge className={`${status.color} border`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-[#8B6F47]">
                          {order.customer_name} • {order.customer_phone}
                        </p>
                        <p className="text-sm text-[#8B6F47]">
                          {format(new Date(order.order_date || order.created_date), "PPP 'at' p")}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-[#8B6F47] mb-1">Total Amount</p>
                          <p className="text-2xl font-bold text-[#FFD700]">
                            ₹{order.total_amount?.toFixed(2)}
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#8B6F47] text-lg">No orders found</p>
          </div>
        )}

        {/* Order Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#5C4033]">Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[#5C4033] mb-2">Order Information</h3>
                  <div className="bg-[#FFF8E7] p-4 rounded-lg space-y-2 text-sm">
                    <p><strong>Order Number:</strong> {selectedOrder.order_number}</p>
                    <p><strong>Date:</strong> {format(new Date(selectedOrder.order_date || selectedOrder.created_date), "PPP 'at' p")}</p>
                    <p><strong>Status:</strong> <Badge className={statusConfig[selectedOrder.status]?.color}>{statusConfig[selectedOrder.status]?.label}</Badge></p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#5C4033] mb-2">Customer Information</h3>
                  <div className="bg-[#FFF8E7] p-4 rounded-lg space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.delivery_address}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#5C4033] mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-3 bg-[#FFF8E7] rounded-lg">
                        <span>{item.product_name} × {item.quantity} {item.unit}</span>
                        <span className="font-semibold">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-[#FFD700]/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-[#5C4033]">₹{selectedOrder.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-[#5C4033] mb-2">Update Status</h3>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}