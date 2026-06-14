import React from 'react';
import { ArrowLeft, Shield, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface/50 dark:to-dark-bg">
      {/* Header */}
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-dark-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-full text-skyneu-blue dark:text-skyneu-blue mb-6">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Refund Policy</span>
            </div>
            <h1 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-6">
              Refund & Cancellation Policy
            </h1>
            <p className="text-lg text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto">
              Clear and transparent policies for your peace of mind. Understand your rights and our commitment to fair service.
            </p>
          </div>

          {/* Policy Overview Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-200 dark:border-dark-border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-skyneu-dark dark:text-dark-text">No Refunds</h3>
              </div>
              <p className="text-skyneu-text dark:text-dark-text-secondary">
                All payments are final. We do not provide refunds for services already rendered or subscriptions already activated.
              </p>
            </div>

            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 border border-gray-200 dark:border-dark-border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-skyneu-dark dark:text-dark-text">Cancel Anytime</h3>
              </div>
              <p className="text-skyneu-text dark:text-dark-text-secondary">
                You may cancel your subscription at any time. Upon cancellation, your access will be terminated immediately, and no further charges will be applied.
              </p>
            </div>
          </div>

          {/* Detailed Policy */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 border border-gray-200 dark:border-dark-border shadow-sm">
            <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-8">Detailed Policy</h2>
            
            <div className="space-y-8">
              {/* No Refunds Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-semibold text-xl text-skyneu-dark dark:text-dark-text">No Refund Policy</h3>
                </div>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    <strong>All sales are final.</strong> SkyNeu does not provide refunds for any services, subscriptions, or digital products once payment has been processed and services have been rendered.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Flight search services and AI trip planning consultations</li>
                    <li>Premium subscription features and access</li>
                    <li>Digital products and downloadable content</li>
                    <li>Third-party service integrations and API usage</li>
                    <li>Any services already consumed or partially used</li>
                  </ul>
                  <p>
                    This policy applies regardless of the reason for the refund request, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Change of mind or circumstances</li>
                    <li>Dissatisfaction with service quality</li>
                    <li>Technical issues or service interruptions</li>
                    <li>Account suspension or termination</li>
                  </ul>
                </div>
              </section>

              {/* Cancellation Policy */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-xl text-skyneu-dark dark:text-dark-text">Subscription Cancellation</h3>
                </div>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    <strong>You may cancel your subscription at any time.</strong> Upon cancellation, your access to premium features will be terminated immediately, and no further charges will be applied to your account.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h4 className="font-semibold text-skyneu-dark dark:text-dark-text mb-2">How to Cancel:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Log into your SkyNeu account</li>
                      <li>Navigate to your Profile and select Account Settings</li>
                      <li>Go to the Subscriptions tab</li>
                      <li>Click "Cancel Subscription" and confirm your cancellation</li>
                    </ol>
                  </div>
                  <p>
                    <strong>Important Notice:</strong> Canceling your subscription does not entitle you to a refund for any payments already processed. Once cancelled, you will lose access to all premium features immediately.
                  </p>
                </div>
              </section>

              {/* Billing and Payment */}
              <section>
                <h3 className="font-semibold text-xl text-skyneu-dark dark:text-dark-text mb-4">Billing & Payment Terms</h3>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    <strong>Automatic Renewal:</strong> Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date.
                  </p>
                  <p>
                    <strong>Payment Processing:</strong> All payments are processed securely through our payment partners. Failed payments may result in service suspension.
                  </p>
                  <p>
                    <strong>Price Changes:</strong> We reserve the right to modify subscription prices with 30 days' notice. Existing subscribers will be notified of any changes.
                  </p>
                </div>
              </section>

              {/* Exceptions */}
              <section>
                <h3 className="font-semibold text-xl text-skyneu-dark dark:text-dark-text mb-4">Limited Exceptions</h3>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    In very rare circumstances, we may consider refunds for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Duplicate payments processed in error</li>
                    <li>Technical errors on our part that prevent service delivery</li>
                    <li>Fraudulent transactions (subject to investigation)</li>
                  </ul>
                  <p>
                    <strong>Note:</strong> Each exception is evaluated on a case-by-case basis and does not guarantee a refund.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="font-semibold text-xl text-skyneu-dark dark:text-dark-text mb-4">Questions or Concerns</h3>
                <div className="space-y-4 text-skyneu-text dark:text-dark-text-secondary">
                  <p>
                    If you have questions about this policy or need assistance with your account, please contact our support team:
                  </p>
                  <div className="bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-xl p-4">
                    <p><strong>Email:</strong> contact@skyneu.com</p>
                    <p><strong>Response Time:</strong> Within 24-48 hours</p>
                    <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM EST</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Policy Updates */}
          <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
            <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Policy Updates</h3>
            <p className="text-skyneu-text dark:text-dark-text-secondary">
              This refund policy may be updated from time to time. We will notify users of any material changes via email or through our platform. 
              Continued use of our services after policy updates constitutes acceptance of the new terms.
            </p>
            <p className="text-sm text-skyneu-text/70 dark:text-dark-text-secondary/70 mt-2">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
