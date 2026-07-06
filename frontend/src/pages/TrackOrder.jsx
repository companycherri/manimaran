import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Order } from '@/entities/Order';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, Search, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Pending Confirmation" },
    confirmed: { icon: CheckCircle2, color: "bg-blue-100 text-blue-800 border-blue-300", label: "Order Confirmed" },
    preparing: { icon: Package, color: "bg-purple-100 text-purple-800 border-purple-300", label: "Preparing Your Sweets" },
    out_for_delivery: { icon: Truck, color: "bg-orange-100 text-orange-800 border-orange-300", label: "Out for Delivery" },
    delivered: { icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-300", label: "Delivered Successfully" },
    cancelled: { icon: XCircle, color: "bg-red-100 text-red-800 border-red-300", label: "Order Cancelled" }
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [foundOrder, setFoundOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackOrder = async () => {
    if (!orderNumber) {
      setError('Please enter an Order ID.');
      return;
    }
    setLoading(true);
    setError('');
    setFoundOrder(null);
    try {
      const orders = await Order.filter({ order_number: orderNumber.trim() });
      if (orders.length > 0) {
        setFoundOrder(orders[0]);
      } else {
        setError('Order not found. Please check the Order ID and try again.');
      }
    } catch (e) {
      setError('An error occurred while fetching your order.');
    }
    setLoading(false);
  };
  
  const status = foundOrder ? (statusConfig[foundOrder.status] || statusConfig.pending) : null;
  const StatusIcon = status ? status.icon : null;

  return (
    <div className="min-h-[60vh] bg-[#FFF8E7] py-16">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Truck className="w-16 h-16 mx-auto text-[#FFD700] mb-4"/>
          <h1 className="text-4xl font-bold text-[#5C4033] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Track Your Order</h1>
          <p className="text-[#8B6F47] mb-8">Enter your Order ID to see the status of your delivery.</p>
        </motion.div>

        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="flex gap-2 mb-4">
            <Input 
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter your Order ID (e.g., ORD-12345)" 
              className="h-12 text-base"/>
            <Button onClick={handleTrackOrder} disabled={loading} size="lg" className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500] h-12">
              {loading ? 'Searching...' : <Search className="w-5 h-5"/>}
            </Button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {foundOrder && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-xl mt-8"
          >
            <h2 className="text-2xl font-bold text-[#5C4033] mb-6">Order Details</h2>
            <div className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-[#8B6F47]">Order ID:</span>
                    <span className="font-semibold text-[#5C4033]">{foundOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#8B6F47]">Order Date:</span>
                    <span className="font-semibold text-[#5C4033]">{format(new Date(foundOrder.order_date), 'PPP')}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#8B6F47]">Customer:</span>
                    <span className="font-semibold text-[#5C4033]">{foundOrder.customer_name}</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="text-[#8B6F47] text-lg">Status:</span>
                    <Badge className={`${status.color} border text-base`}>
                        <StatusIcon className="w-5 h-5 mr-2" />
                        {status.label}
                    </Badge>
                </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}