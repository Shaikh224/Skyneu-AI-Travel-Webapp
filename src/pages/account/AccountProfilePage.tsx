import React from 'react';
import Header from '@/components/layout/Header';
import AccountProfile from '@/components/AccountProfile';
import { User, Settings } from 'lucide-react';

const AccountProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-skyneu-light/20 dark:from-dark-bg dark:via-dark-surface dark:to-dark-surface">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 text-skyneu-blue dark:text-skyneu-blue rounded-full text-sm font-semibold mb-6 border border-skyneu-blue/20 dark:border-skyneu-blue/30">
              <User className="h-4 w-4" />
              <span>PERSONALIZED ACCOUNT MANAGEMENT</span>
              <Settings className="h-4 w-4" />
            </div>
            <h1 className="font-bold text-4xl lg:text-5xl text-skyneu-dark dark:text-dark-text mb-4 bg-gradient-to-r from-skyneu-dark to-skyneu-blue dark:from-dark-text dark:to-skyneu-blue bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-skyneu-text dark:text-dark-text-secondary max-w-2xl mx-auto text-lg leading-relaxed">
              Manage your profile, travel preferences, notifications, and security settings to personalize your SkyNeu experience.
            </p>
          </div>

          {/* Main Component */}
          <AccountProfile />
        </div>
      </main>
    </div>
  );
};

export default AccountProfilePage;