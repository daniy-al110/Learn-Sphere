import { useState } from "react";
import { Icon } from "@/components/layout/icons";
import { toast } from "@/lib/toast-store";
import { API_BASE_URL } from "@/lib/config";

interface PaymentModalProps {
  challan: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ challan, onClose, onSuccess }: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState(challan.student_name || "");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !name) {
      toast.warning("Please fill in all card details.");
      return;
    }
    
    setProcessing(true);
    
    // Simulate payment gateway processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // We need to call an endpoint to mark this challan as paid.
      // Assuming we can use a student endpoint or the admin endpoint if auth allows, 
      // but let's create a dedicated payment endpoint or use the existing status update.
      const res = await fetch(`${API_BASE_URL}/api/student/fee-challans/${challan.challan_id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: challan.total_amount || challan.amount, card_last4: cardNumber.slice(-4) })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Payment processed successfully!");
        onSuccess();
      } else {
        toast.error(data.error || "Payment failed");
      }
    } catch (err) {
      toast.error("Network error during payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-900 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="credit-card" className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Secure Payment</h2>
          <p className="text-gray-400 mt-1">Challan #{challan.challan_number}</p>
        </div>
        
        <form onSubmit={handlePay} className="p-6 space-y-5">
          <div className="text-center mb-6">
            <p className="text-gray-500 text-sm font-medium">Amount to Pay</p>
            <p className="text-4xl font-black text-gray-900">Rs {challan.total_amount || challan.amount}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cardholder Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Card Number</label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={19}
                value={cardNumber}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
                  setCardNumber(formatted);
                }}
                placeholder="0000 0000 0000 0000"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-mono"
              />
              <Icon name="credit-card" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
              <input 
                type="text" 
                maxLength={5}
                value={expiry}
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 2) val = val.slice(0,2) + '/' + val.slice(2);
                  setExpiry(val);
                }}
                placeholder="MM/YY"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">CVC</label>
              <input 
                type="text" 
                maxLength={4}
                value={cvc}
                onChange={e => setCvc(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={processing}
              className="flex-1 py-3 px-4 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {processing ? (
                <>
                  <Icon name="loader" className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon name="lock" className="w-5 h-5" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
