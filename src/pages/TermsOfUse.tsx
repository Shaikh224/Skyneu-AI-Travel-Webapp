import React from 'react';
import { FileText, Scale, AlertTriangle, Shield, Users, Globe } from 'lucide-react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 rounded-2xl mb-8">
              <FileText className="h-6 w-6 text-skyneu-blue" />
              <span className="font-semibold text-skyneu-blue">Terms of Use</span>
            </div>
            <h1 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-skyneu-text dark:text-dark-text-secondary leading-relaxed">
              Please read these terms carefully before using our AI-powered travel planning platform.
            </p>
            <p className="text-sm text-skyneu-text dark:text-dark-text-secondary mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-12">
            {/* Acceptance of Terms */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Scale className="h-6 w-6 text-skyneu-blue" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Acceptance of Terms</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <p className="text-skyneu-text dark:text-dark-text-secondary mb-4">
                  By accessing and using SkyNeu ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-skyneu-text dark:text-dark-text-secondary">
                  These terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Globe className="h-6 w-6 text-skyneu-green" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Service Description</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <p className="text-skyneu-text dark:text-dark-text-secondary mb-4">
                  SkyNeu is an AI-powered travel planning platform that provides:
                </p>
                <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                  <li>• AI-powered travel recommendations and itinerary planning</li>
                  <li>• Flight search and tracking capabilities</li>
                  <li>• Visa requirement checking and travel advisories</li>
                  <li>• Trip planning and organization tools</li>
                  <li>• Educational content about aviation and travel</li>
                </ul>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-orange-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">User Responsibilities</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Account Security</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                      <li>• Maintain the confidentiality of your account credentials</li>
                      <li>• Notify us immediately of any unauthorized use</li>
                      <li>• Provide accurate and up-to-date information</li>
                      <li>• You are responsible for all activities under your account</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-skyneu-dark dark:text-dark-text mb-3">Acceptable Use</h3>
                    <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                      <li>• Use the Service only for lawful purposes</li>
                      <li>• Do not attempt to gain unauthorized access to our systems</li>
                      <li>• Do not use the Service to transmit harmful or malicious code</li>
                      <li>• Respect the intellectual property rights of others</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Prohibited Activities</h2>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border border-red-200 dark:border-red-800">
                <p className="text-skyneu-text dark:text-dark-text-secondary mb-4">
                  You may not use our Service to:
                </p>
                <ul className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                  <li>• Violate any applicable laws or regulations</li>
                  <li>• Infringe upon the rights of others</li>
                  <li>• Transmit spam, viruses, or other harmful content</li>
                  <li>• Attempt to reverse engineer or hack our systems</li>
                  <li>• Use automated systems to access the Service without permission</li>
                  <li>• Impersonate another person or entity</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-purple-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Intellectual Property</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="space-y-4">
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of SkyNeu and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    You may not reproduce, distribute, modify, or create derivative works of our content without express written permission.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Accuracy Disclaimer */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Data Accuracy Disclaimer</h2>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-8 border border-yellow-200 dark:border-yellow-800">
                <div className="space-y-4">
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    <strong>Important:</strong> All travel data, including flight information, prices, schedules, visa requirements, and travel advisories, are fetched from various third-party sources and may sometimes be inaccurate, outdated, or incomplete.
                  </p>
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    We do not verify the accuracy of this data and cannot guarantee its correctness. Always verify critical travel information directly with official sources such as airlines, embassies, and government websites before making travel decisions.
                  </p>
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    SkyNeu is not responsible for any losses, delays, or inconveniences resulting from inaccurate or outdated travel data provided through our platform.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Globe className="h-6 w-6 text-blue-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Service Availability</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <div className="space-y-4">
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    We strive to provide reliable service, but we cannot guarantee that the Service will be available at all times. We may experience downtime for maintenance, updates, or technical issues.
                  </p>
                  <p className="text-skyneu-text dark:text-dark-text-secondary">
                    We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Limitation of Liability</h2>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-8 border border-yellow-200 dark:border-yellow-800">
                <p className="text-skyneu-text dark:text-dark-text-secondary mb-4">
                  To the fullest extent permitted by law, SkyNeu shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
                <p className="text-skyneu-text dark:text-dark-text-secondary">
                  Our total liability to you for any damages arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-6 w-6 text-skyneu-blue" />
                <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text">Changes to Terms</h2>
              </div>
              <div className="bg-gray-50 dark:bg-dark-surface rounded-2xl p-8">
                <p className="text-skyneu-text dark:text-dark-text-secondary">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-r from-skyneu-blue/5 to-skyneu-green/5 rounded-2xl p-8 border border-skyneu-blue/10">
              <h2 className="font-bold text-2xl text-skyneu-dark dark:text-dark-text mb-4">Questions About Terms?</h2>
              <p className="text-skyneu-text dark:text-dark-text-secondary mb-6">
                If you have any questions about these Terms of Use, please contact us:
              </p>
              <div className="space-y-2 text-skyneu-text dark:text-dark-text-secondary">
                <p><strong>Email:</strong> contact@skyneu.com</p>
                <p><strong>Response Time:</strong> We'll respond within 48 hours</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
