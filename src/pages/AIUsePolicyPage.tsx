import React from 'react';
import { Shield, Bot, Users, AlertTriangle, CheckCircle, Info, ExternalLink, Brain, Zap, Target, Lock, Eye, Ban, Clock, Database } from 'lucide-react';

const AIUsePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            SkyNeu AI Use Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our comprehensive policy on how SkyNeu uses artificial intelligence to enhance your travel experience
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Table of Contents
          </h2>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#app-ai-usage" className="text-blue-600 dark:text-blue-400 hover:underline">1. App-Related AI Usage</a>
            <a href="#user-ai-interactions" className="text-blue-600 dark:text-blue-400 hover:underline">2. User AI Interactions</a>
            <a href="#ai-limitations" className="text-blue-600 dark:text-blue-400 hover:underline">3. AI Limitations & Human Oversight</a>
            <a href="#data-privacy" className="text-blue-600 dark:text-blue-400 hover:underline">4. Data Privacy & Security</a>
            <a href="#user-rights" className="text-blue-600 dark:text-blue-400 hover:underline">5. User Rights & Controls</a>
            <a href="#user-abuse" className="text-blue-600 dark:text-blue-400 hover:underline">6. User Abuse & API Policy</a>
            <a href="#contact" className="text-blue-600 dark:text-blue-400 hover:underline">7. Contact & Support</a>
          </div>
        </div>

        {/* 1. App-Related AI Usage */}
        <section id="app-ai-usage" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
              <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">App-Related AI Usage</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-500" />
                LLM-Powered Personalization
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                SkyNeu uses Large Language Models (LLMs), including GPT-based systems, to interpret natural language queries, generate trip itineraries, and provide personalized travel recommendations. These models allow conversational interactions, adaptive personalization, and intelligent automation within the app.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Database className="h-5 w-5 mr-2 text-green-500" />
                Third-Party API Integrations
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                SkyNeu integrates with reliable third-party APIs for accurate, real-time travel data.
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Examples include:</p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  Flight APIs for live fares, schedules, and route data
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  Weather APIs for location-based forecasts
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  Visa & Advisory APIs for entry rules and safety alerts
                </li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                All integrations are designed to securely enhance user experience without exposing personal data.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                AI Features
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <strong>Flight Search & Smart Recommendations</strong> — AI analyzes vast flight data to recommend optimal routes and booking windows.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <strong>Trip Planner & Itinerary Generation</strong> — LLMs build itineraries aligned with personal preferences and budgets.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <strong>Real-Time Alerts & Assistance</strong> — AI provides notifications for disruptions, advisories, and travel changes.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 2. User AI Interactions */}
        <section id="user-ai-interactions" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User AI Interactions</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-500" />
                Data Collection & Usage
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                SkyNeu processes limited, relevant data to enable AI-driven personalization, including:
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
                <li className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                  User queries, prompts, and travel preferences
                </li>
                <li className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                  Destination, budget, and trip context
                </li>
                <li className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                  Feedback on AI outputs
                </li>
                <li className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                  Optional location data (with consent)
                </li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                <strong>No personal data is used to train models.</strong> All processing is anonymized and strictly functional.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-purple-500" />
                Privacy & Consent
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  Users are informed when interacting with AI features.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  You may disable AI personalization anytime.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  Analytics data is anonymized and retained only temporarily.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. AI Limitations & Human Oversight */}
        <section id="ai-limitations" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Limitations & Human Oversight</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-3">
                Limitations
              </h3>
              <div className="space-y-3 text-orange-800 dark:text-orange-200">
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                    AI outputs are generated from available data and may not always reflect live or verified information.
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                    Price forecasts and recommendations are probabilistic, not guaranteed.
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                    Official sources should always be verified for visas, safety, or policy details.
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Human Oversight
              </h3>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p>Critical information is reviewed by SkyNeu's human team when needed.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p>User feedback directly influences AI improvement.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p>Identified inaccuracies are transparently corrected in updates.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Data Privacy & Security */}
        <section id="data-privacy" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
              <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Privacy & Security</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Minimal Data Retention
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                SkyNeu retains only essential operational data, which is automatically deleted once no longer needed.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Database className="h-5 w-5 mr-2 text-green-500" />
                Third-Party Data Policy
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  SkyNeu never sells or rents your data.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  API calls are made only to trusted partners under strict privacy and compliance agreements.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 5. User Rights & Controls */}
        <section id="user-rights" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Rights & Controls</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You have limited control over how SkyNeu's AI interacts with your data, reflecting the nature of third-party AI integrations.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Minimal Controls</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              As SkyNeu relies on external LLM and travel APIs, we have limited control over third-party performance, outages, or temporary service downtimes.
            </p>
            
            <p className="text-gray-600 dark:text-gray-300 mb-3">Users can:</p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 ml-4">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                Adjust personalization preferences
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                Provide feedback on AI-generated outputs
              </li>
            </ul>
          </div>
        </section>

        {/* 6. User Abuse & API Policy */}
        <section id="user-abuse" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-4">
              <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Abuse & API Policy</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-700">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">
                Fair Use & Abuse Prevention
              </h3>
              <p className="text-red-800 dark:text-red-200 mb-4">
                To maintain system integrity and ensure fair access, SkyNeu enforces responsible AI and API usage.
              </p>
              <p className="text-red-800 dark:text-red-200 mb-3">Users must not:</p>
              <ul className="space-y-2 text-red-800 dark:text-red-200 ml-4">
                <li className="flex items-start">
                  <Ban className="h-4 w-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Send excessive, automated, or spam-like requests to AI or API endpoints
                </li>
                <li className="flex items-start">
                  <Ban className="h-4 w-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Attempt to reverse-engineer, manipulate, or overload AI systems
                </li>
                <li className="flex items-start">
                  <Ban className="h-4 w-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Use AI outputs for malicious, fraudulent, or misleading activities
                </li>
                <li className="flex items-start">
                  <Ban className="h-4 w-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                  Circumvent security or rate limits set by SkyNeu or its API providers
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Rate Limiting & Suspension
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                  SkyNeu may apply rate limits to prevent overuse and maintain service quality.
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                  Repeated abuse, suspicious activity, or violations of fair use terms may lead to temporary or permanent suspension of access to AI features.
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Third-Party Dependency Disclaimer
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                SkyNeu depends on external APIs and LLM services (e.g., OpenAI, travel data providers).
              </p>
              <p className="text-blue-800 dark:text-blue-200 mt-2">
                Any downtime, latency, or data inaccuracy arising from these external systems may temporarily affect AI functionality. SkyNeu does not control third-party outages but strives to restore service as soon as possible.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Contact & Support */}
        <section id="contact" className="mb-12">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
              <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact & Support</h2>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Questions About Our AI Use Policy?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                If you have any questions about AI use, policy enforcement, or API-related concerns, please contact us at:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:contact@skyneu.com"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  📧 Email: contact@skyneu.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
          <p>
            This AI Use Policy is part of SkyNeu's Privacy Policy and Terms of Service and may be updated periodically to reflect improvements in AI systems, integrations, and compliance standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIUsePolicyPage;
