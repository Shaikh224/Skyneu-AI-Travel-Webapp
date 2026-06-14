import React, { useState, useEffect } from 'react';
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle, XCircle, Loader2, User, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AppwriteAuthContext';
import { subscriptionService } from '@/services/subscriptionService';
import type { Subscription } from '@/types/subscription';
import toast from 'react-hot-toast';
import PaymentHistory from './PaymentHistory';

const SubscriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscription' | 'payments'>('subscription');

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const sub = await subscriptionService.getSubscription(user.$id);
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;

    setCancelling(true);
    try {
      const subId = subscription.subscriptionId || subscription.subscription_id || subscription.id;
      if (!subId) {
        throw new Error('Subscription ID not found');
      }
      await subscriptionService.cancelSubscription(user.$id, subId);
      toast.success('Subscription cancelled immediately. No refund will be processed.');
      
      // Close modal
      setShowCancelModal(false);
      
      // Reload subscription data
      await loadSubscription();
      
      // Refresh page to update user context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user || !subscription) return;

    setReactivating(true);
    try {
      const subId = subscription.subscriptionId || subscription.subscription_id || subscription.id;
      if (!subId) {
        throw new Error('Subscription ID not found');
      }
      await subscriptionService.reactivateSubscription(user.$id, subId);
      toast.success('Subscription reactivated! Billing will continue.');
      await loadSubscription();
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      toast.error(error.message || 'Failed to reactivate subscription');
    } finally {
      setReactivating(false);
    }
  };

  const handleRenewSubscription = async () => {
    if (!user || !subscription) return;

    // Handle both string price format ("$3.00") and number format (300)
    let priceDisplay = '$0.00';
    if (typeof subscription.price === 'string') {
      priceDisplay = subscription.price;
    } else {
      const amount = subscription.recurring_pre_tax_amount || subscription.price || 0;
      priceDisplay = `$${(amount / 100).toFixed(2)}`;
    }

    if (!confirm(`Renew subscription for ${priceDisplay}/month?`)) {
      return;
    }

    setRenewing(true);
    try {
      await subscriptionService.renewSubscription(
        user.$id,
        subscription.customer?.customer_id || subscription.customer?.id || user.$id,
        subscription.product_id || 'default'
      );
      toast.success('Subscription renewed successfully!');
      await loadSubscription();
      // Reload page to refresh user context
      window.location.reload();
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      toast.error(error.message || 'Unable to renew. Please try creating a new subscription.');
    } finally {
      setRenewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Active
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-full text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Cancelled
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Expired
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 rounded-full text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Past Due
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Active Subscription
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Subscribe to unlock all premium features
        </p>
        <button
          onClick={() => window.location.href = '/flight-search'}
          className="px-6 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300"
        >
          Explore Premium Features
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8" />
          <h2 className="text-2xl font-bold">Premium Subscription</h2>
        </div>
        <p className="text-blue-100">Manage your subscription and billing information</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'subscription'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-4 w-4" />
              Subscription Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Receipt className="h-4 w-4" />
              Payment History
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'subscription' ? (
        <>

      {/* Subscription Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Subscription Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subscription.plan || 'Premium Plan'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(subscription.status)}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Customer Information */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Account Information
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {subscription.customer?.name || user?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {subscription.customer?.email || user?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          {subscription.payment_method && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </h4>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.payment_method.brand && (
                      <span className="capitalize">{subscription.payment_method.brand}</span>
                    )}
                    {subscription.payment_method.type && !subscription.payment_method.brand && (
                      <span className="capitalize">{subscription.payment_method.type}</span>
                    )}
                    {subscription.payment_method.last4 && (
                      <span> ending in {subscription.payment_method.last4}</span>
                    )}
                    {!subscription.payment_method.brand && !subscription.payment_method.type && !subscription.payment_method.last4 && (
                      <span>On file</span>
                    )}
                  </p>
                  {subscription.payment_method.exp_month && subscription.payment_method.exp_year && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Expires {subscription.payment_method.exp_month}/{subscription.payment_method.exp_year}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Billing & Price Details */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(() => {
                  // Handle both string format ("$3.00") and number format (300)
                  if (typeof subscription.price === 'string') {
                    return `${subscription.price} / ${subscription.interval || 'month'}`;
                  }
                  const amount = subscription.recurring_pre_tax_amount || subscription.price || 0;
                  const interval = subscription.payment_frequency_interval || subscription.interval || 'month';
                  return `$${(amount / 100).toFixed(2)} / ${interval.toLowerCase()}`;
                })()}
              </p>
              {subscription.payment_frequency_count && subscription.payment_frequency_count > 1 && (
                <p className="text-xs text-gray-500">
                  Every {subscription.payment_frequency_count} {subscription.payment_frequency_interval}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Billing Date</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(() => {
                  const dateStr = subscription.nextBillingDate || subscription.next_billing_date || subscription.billingDate || subscription.currentPeriodEnd || subscription.expires_at;
                  return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
                })()}
              </p>
            </div>
          </div>

          {subscription.subscription_period_count && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subscription Period</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {subscription.subscription_period_count} {subscription.subscription_period_interval}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expires At</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {(() => {
                  const dateStr = subscription.expiresAt || subscription.expires_at || subscription.currentPeriodEnd;
                  return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
                })()}
              </p>
            </div>
          </div>
        </div>

        {(subscription.cancel_at_next_billing_date || subscription.cancelAtNextBilling || subscription.isCancelled) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Subscription Ending</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {(() => {
                    const dateStr = subscription.nextBillingDate || subscription.next_billing_date || subscription.billingDate || subscription.expires_at;
                    const endDate = dateStr ? new Date(dateStr).toLocaleDateString() : 'the end of the billing period';
                    return `Your subscription will end on ${endDate}. You'll retain access until then.`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {subscription.status === 'active' && !subscription.cancel_at_next_billing_date && !subscription.cancelAtNextBilling && !subscription.isCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling}
              className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Subscription
            </button>
          )}

          {subscription.status === 'active' && (subscription.cancel_at_next_billing_date || subscription.cancelAtNextBilling || subscription.isCancelled) && (
            <button
              onClick={handleReactivateSubscription}
              disabled={reactivating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reactivating ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reactivating...
                </span>
              ) : (
                'Reactivate Subscription'
              )}
            </button>
          )}

          {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
            <button
              onClick={handleRenewSubscription}
              disabled={renewing}
              className="px-4 py-2 bg-gradient-to-r from-skyneu-blue to-skyneu-green text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {renewing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Renewing...
                </span>
              ) : (
                'Renew Subscription'
              )}
            </button>
          )}

          {subscription.status === 'past_due' && (
            <button
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Update Payment Method
            </button>
          )}
        </div>
      </div>

      {/* Features Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Premium Benefits
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(subscription.features || [
            'Unlimited flight searches',
            'AI-powered trip planning',
            'Real-time flight tracking',
            'Priority customer support',
            'Advanced travel tools',
            'Exclusive features access'
          ]).map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cancel Subscription?
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-medium text-red-600 dark:text-red-400">
                    ⚠️ This action is immediate and irreversible
                  </p>
                  <p>
                    Your subscription will be <strong>cancelled immediately</strong>, and you will lose access to all premium features right away.
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-3 mt-3">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      ❌ No Refund Policy
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                      You will not receive a refund for the remaining subscription period. Please cancel before your next billing date to avoid being charged.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  'Yes, Cancel Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </>) : (
        <PaymentHistory />
      )}

      {/* Payment Provider Attribution */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Payment powered by Dodo Payments
        </p>
      </div>
    </div>
  );
};

export default SubscriptionManagement;

