import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, ChevronDown, Bell } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthSafe } from '@/contexts/AppwriteAuthContext';
import AuthModal from '@/components/auth/AppwriteAuthModal';
import ThemeToggle from './ThemeToggle';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationPanel from '@/components/notifications/NotificationPanel';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; type: 'login' | 'signup' } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  // Use safe version to handle potential hot reload issues
  const authContext = useAuthSafe();
  
  // Notification context
  const notificationContext = useNotification();
  const unreadNotificationCount = notificationContext?.unreadCount || 0;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the home page (hero section)
  const isHomePage = location.pathname === '/';
  
  // If auth context is not available (during hot reload), show a minimal header
  if (!authContext) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200/50 dark:border-dark-border/50 announcement-offset">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/img/sknrm.png" 
              alt="SkyNfull Logo" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }
  
  // Fallback values if context is not available during hot reload
  const user = authContext?.user || null;
  const isAuthenticated = authContext?.isAuthenticated || false;
  const logout = authContext?.logout || (() => {});

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside or on overlay
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotificationPanel) {
        const target = event.target as Element;
        if (!target.closest('[data-notification-panel]')) {
          setShowNotificationPanel(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotificationPanel]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setShowServicesMenu(false);
  };

  const handleNavigation = (path: string) => {
    const protectedRoutes = ['/flight-search', '/visa-checker', '/flight-tracker', '/trip-planner', '/news-alerts', '/profile', '/ai-trip-planner', '/discover'];
    if (protectedRoutes.includes(path) && !isAuthenticated) {
      setAuthModal({ isOpen: true, type: 'login' });
      return;
    }
    navigate(path);
    closeMenu();
    // Scroll to top when navigating
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
    // Scroll to top when logging out
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const services = [
    { name: 'Flight Search', href: '/flight-search', icon: '✈️', description: 'AI-powered flight search' },
    { name: 'AI Trip Planner', href: '/ai-chat', icon: '🤖', description: 'AI-powered trip planning' },
    { name: 'Trip Planner', href: '/trip-planner', icon: '🗺️', description: 'Group trip planning' },
    { name: 'Visa Checker', href: '/visa-checker', icon: '📋', description: 'Visa requirements' },
    { name: 'Flight Tracker', href: '/flight-tracker', icon: '📍', description: 'Real-time tracking' },
    { name: 'News & Alerts', href: '/news-alerts', icon: '📢', description: 'Travel updates' },
    { name: 'Discover Places', href: '/discover', icon: '✨', description: 'Mood-based place discovery' },
    { name: 'AviHub', href: '/aviation-education', icon: '🎓', description: 'Learn about aviation' },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 announcement-offset ${
        isHomePage 
          ? 'bg-transparent' 
          : isScrolled 
            ? 'bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-dark-border' 
            : 'bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200/50 dark:border-dark-border/50'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img 
                src="/img/sknrm.png" 
                alt="SkyNfull Logo" 
                className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {/* AviHub - Always Visible */}
              <Link
                to="/aviation-education"
                className="font-medium text-skyneu-dark dark:text-dark-text hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors duration-300"
              >
                AviHub
              </Link>

              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setShowServicesMenu(!showServicesMenu)}
                    onMouseEnter={() => setShowServicesMenu(true)}
                    className="flex items-center gap-2 font-medium text-skyneu-dark dark:text-dark-text hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors duration-300 py-2"
                  >
                    <span>Services</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showServicesMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Services Dropdown */}
                  {showServicesMenu && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border py-4 z-50"
                      onMouseLeave={() => setShowServicesMenu(false)}
                    >
                      <div className="grid grid-cols-1 gap-1">
                        {services.map((service) => (
                          <button
                            key={service.name}
                            onClick={() => {
                              handleNavigation(service.href);
                              setShowServicesMenu(false);
                            }}
                            className="flex items-center gap-3 px-4 py-3 text-left hover:bg-skyneu-blue/5 dark:hover:bg-skyneu-blue/10 transition-colors group"
                          >
                            <span className="text-xl">{service.icon}</span>
                            <div>
                              <div className="font-medium text-skyneu-dark dark:text-dark-text group-hover:text-skyneu-blue dark:group-hover:text-skyneu-blue transition-colors">
                                {service.name}
                              </div>
                              <div className="text-xs text-skyneu-text dark:text-dark-text-secondary">
                                {service.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
            
            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <ThemeToggle />
              
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                    className="relative p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 group"
                  >
                    <Bell className="h-5 w-5 text-skyneu-dark dark:text-dark-text group-hover:text-skyneu-blue dark:group-hover:text-skyneu-blue transition-colors" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotificationPanel && notificationContext && (
                    <div data-notification-panel>
                      <NotificationPanel
                        notifications={notificationContext.notifications}
                        unreadCount={notificationContext.unreadCount}
                        loading={notificationContext.loading}
                        onMarkAsRead={(id) => notificationContext.markAsRead(id)}
                        onMarkAllAsRead={() => notificationContext.markAllAsRead()}
                        onDeleteNotification={(id) => notificationContext.deleteNotification(id)}
                        onNotificationClick={(n) => {
                          if (n.actionUrl) window.location.href = n.actionUrl;
                          setShowNotificationPanel(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-skyneu-blue to-skyneu-green rounded-xl flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-skyneu-dark dark:text-dark-text group-hover:text-skyneu-blue dark:group-hover:text-skyneu-blue transition-colors">{user?.name}</span>
                    <ChevronDown className="h-4 w-4 text-skyneu-text dark:text-dark-text-secondary" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                        <div className="font-medium text-skyneu-dark dark:text-dark-text">{user?.name}</div>
                        <div className="text-sm text-skyneu-text dark:text-dark-text-secondary">{user?.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          handleNavigation('/profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-skyneu-text dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-all duration-300"
                      >
                        <User className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-skyneu-text dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setAuthModal({ isOpen: true, type: 'login' })}
                    className="px-6 py-2.5 font-medium text-skyneu-dark dark:text-dark-text hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors duration-300"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setAuthModal({ isOpen: true, type: 'signup' })}
                    className="px-6 py-2.5 font-medium bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-3">
              <ThemeToggle />
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-skyneu-blue to-skyneu-green rounded-xl flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border py-2 z-[60]">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-border">
                        <div className="font-medium text-skyneu-dark dark:text-dark-text text-sm">{user?.name}</div>
                        <div className="text-xs text-skyneu-text dark:text-dark-text-secondary truncate">{user?.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          handleNavigation('/profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-skyneu-text dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-all duration-300 text-sm"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Account</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-left text-skyneu-text dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 text-sm"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-300"
              >
                {isMenuOpen ? <X size={24} className="text-skyneu-dark dark:text-dark-text" /> : <Menu size={24} className="text-skyneu-dark dark:text-dark-text" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu overlay - HIGHEST Z-INDEX WITH SOLID BACKGROUND */}
        {isMenuOpen && (
          <div className="lg:hidden mobile-menu-overlay">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={closeMenu}
            ></div>
            
            {/* Menu Content - SOLID BACKGROUND */}
            <div className="mobile-menu-content bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border">
              <div className="container mx-auto px-4 py-6 h-full flex flex-col">
                {isAuthenticated ? (
                  <>
                    {/* User Info - Fixed at top */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mb-6 flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-skyneu-blue to-skyneu-green rounded-xl flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-skyneu-dark dark:text-dark-text">{user?.name}</div>
                        <div className="text-sm text-skyneu-text dark:text-dark-text-secondary">{user?.email}</div>
                      </div>
                      {/* Mobile Notification Bell + Panel */}
                      <div className="relative" data-notification-panel>
                        <button
                          onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                          className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover=b-gray-700/50 transition-all duration-300"
                        >
                          <Bell className="h-5 w-5 text-skyneu-dark dark:text-dark-text" />
                          {unreadNotificationCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                            </span>
                          )}
                        </button>
                        {showNotificationPanel && notificationContext && (
                          <div className="absolute right-0 z-[60]">
                            <NotificationPanel
                              notifications={notificationContext.notifications}
                              unreadCount={notificationContext.unreadCount}
                              loading={notificationContext.loading}
                              onMarkAsRead={(id) => notificationContext.markAsRead(id)}
                              onMarkAllAsRead={() => notificationContext.markAllAsRead()}
                              onDeleteNotification={(id) => notificationContext.deleteNotification(id)}
                              onNotificationClick={(n) => {
                                if (n.actionUrl) window.location.href = n.actionUrl;
                                setShowNotificationPanel(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Services - Scrollable */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-skyneu-text dark:text-dark-text-secondary px-4 py-2">Services</div>
                        {services.map((service) => (
                          <button
                            key={service.name}
                            onClick={() => handleNavigation(service.href)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-skyneu-blue/5 dark:hover:bg-skyneu-blue/10 rounded-xl transition-colors"
                          >
                            <span className="text-lg">{service.icon}</span>
                            <div>
                              <div className="font-medium text-skyneu-dark dark:text-dark-text">{service.name}</div>
                              <div className="text-xs text-skyneu-text dark:text-dark-text-secondary">{service.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Account Actions - Fixed at bottom */}
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-dark-border flex-shrink-0">
                      <button
                        onClick={() => {
                            handleNavigation('/profile');
                            closeMenu();
                          }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-skyneu-text dark:text-dark-text-secondary hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors duration-300"
                      >
                        <User className="h-4 w-4" />
                        <span>Account Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-skyneu-text dark:text-dark-text-secondary hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* AviHub Link - Always Visible */}
                    <Link
                      to="/aviation-education"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 text-left hover:bg-skyneu-blue/5 dark:hover:bg-skyneu-blue/10 rounded-xl transition-colors"
                    >
                      <span className="text-lg">🎓</span>
                      <div>
                        <div className="font-medium text-skyneu-dark dark:text-dark-text">AviHub</div>
                        <div className="text-xs text-skyneu-text dark:text-dark-text-secondary">Aviation news & education</div>
                      </div>
                    </Link>

                    {/* Auth Buttons */}
                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                      <button 
                        onClick={() => {
                          setAuthModal({ isOpen: true, type: 'login' });
                          closeMenu();
                        }}
                        className="w-full px-6 py-3 font-medium text-skyneu-dark dark:text-dark-text hover:text-skyneu-blue dark:hover:text-skyneu-blue transition-colors duration-300 text-center"
                      >
                        Sign In
                      </button>
                      <button 
                        onClick={() => {
                          setAuthModal({ isOpen: true, type: 'signup' });
                          closeMenu();
                        }}
                        className="w-full px-6 py-3 font-medium bg-gradient-to-r from-skyneu-blue to-skyneu-blue/90 text-white rounded-2xl hover:shadow-lg transition-all duration-300"
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {authModal && (
        <AuthModal
          isOpen={authModal.isOpen}
          type={authModal.type}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  );
};

export default Header;