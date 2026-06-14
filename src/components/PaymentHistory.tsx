import React, { useState, useEffect } from 'react';
import { Download, Calendar, CreditCard, Loader2, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { subscriptionService } from '@/services/subscriptionService';
import toast from 'react-hot-toast';

interface Payment {
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payment_method?: {
    type?: string;
    last4?: string;
    brand?: string;
  };
  description?: string;
}

const PaymentHistory: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentHistory();
  }, [user]);

  const loadPaymentHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const history = await subscriptionService.getPaymentHistory(user.$id);
      setPayments(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (paymentId: string) => {
    setDownloadingInvoice(paymentId);
    try {
      await subscriptionService.downloadInvoice(paymentId);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      succeeded: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200', label: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200', label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200', label: 'Refunded' }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Payment History
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {!loading ? 
            "Your payment history will appear here once you make a purchase. If you've already subscribed, your payment history will be available after the first billing cycle completes." :
            "Loading your payment history..."
          }
        </p>
        {!loading && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left">
            <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              💡 What to do:
            </p>
            <ul className="text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Ensure you have an active subscription</li>
              <li>Check that your payment was successful</li>
              <li>Wait a few moments and refresh this page</li>
              <li>Contact support if payments don't appear after 24 hours</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Calculate totals
  const totalSpent = payments
    .filter(p => p.status.toLowerCase() === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);
  const successfulCount = payments.filter(p => p.status.toLowerCase() === 'succeeded').length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Payments</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Successful</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{successfulCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatAmount(totalSpent, payments[0]?.currency || 'USD')}
          </p>
        </div>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr key={payment.payment_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(payment.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {payment.description || 'Premium Subscription'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {payment.payment_method?.brand ? (
                          <span className="capitalize">
                            {payment.payment_method.brand}
                            {payment.payment_method.last4 && ` ••${payment.payment_method.last4}`}
                          </span>
                        ) : (
                          'Card'
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatAmount(payment.amount, payment.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {payment.status.toLowerCase() === 'succeeded' ? (
                      <button
                        onClick={() => handleDownloadInvoice(payment.payment_id)}
                        disabled={downloadingInvoice === payment.payment_id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download Invoice"
                      >
                        {downloadingInvoice === payment.payment_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span>PDF</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.payment_id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {payment.description || 'Premium Subscription'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(payment.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {formatAmount(payment.amount, payment.currency)}
                </div>
                {getStatusBadge(payment.status)}
              </div>
            </div>

            {/* Payment Method */}
            {payment.payment_method && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CreditCard className="h-4 w-4" />
                <span>
                  {payment.payment_method.brand ? (
                    <span className="capitalize">
                      {payment.payment_method.brand}
                      {payment.payment_method.last4 && ` ••${payment.payment_method.last4}`}
                    </span>
                  ) : (
                    'Card'
                  )}
                </span>
              </div>
            )}

            {/* Invoice Download */}
            {payment.status.toLowerCase() === 'succeeded' && (
              <button
                onClick={() => handleDownloadInvoice(payment.payment_id)}
                disabled={downloadingInvoice === payment.payment_id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingInvoice === payment.payment_id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Invoice (PDF)</span>
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentHistory;
