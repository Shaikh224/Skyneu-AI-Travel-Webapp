import React from 'react';
import { Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const footerLinks = {
    product: [
      { name: 'Flight Search', href: '/flight-search' },
      { name: 'Trip Planner', href: '/trip-planner' },
      { name: 'Visa Checker', href: '/visa-checker' },
      { name: 'Flight Tracker', href: '/flight-tracker' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Roadmap', href: '/roadmap' },
      { name: 'Changelog', href: '/changelog' },
      { name: 'Feature Requests', href: '/feature-requests' }
    ],
    support: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Use', href: '/terms-of-use' },
      { name: 'Refund Policy', href: '/refund-policy' },
      { name: 'AI Use Policy', href: '/ai-use-policy' }
    ]
  };

  const socialLinks = [
    { icon: <Twitter size={20} />, href: 'https://twitter.com/skyneuai', label: 'Twitter' },
    { icon: <Instagram size={20} />, href: 'https://instagram.com/skyneuai', label: 'Instagram' },
    { icon: <Linkedin size={20} />, href: 'https://linkedin.com/company/skyneu', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-gradient-to-br from-skyneu-dark via-skyneu-dark/95 to-gray-900 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg text-white transition-colors duration-300">
      {/* Main Footer */}
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <img 
                src="/img/sknrm.png" 
                alt="SkyNfull Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-xl text-gray-300 dark:text-dark-text-secondary leading-relaxed max-w-lg">
              Transforming travel with AI technology that makes planning and exploring effortless and personalized for every journey.
            </p>

            {/* Contact Email */}
            <div>
              <p className="text-sm text-gray-400 dark:text-dark-text-secondary">Contact us</p>
              <a 
                href="mailto:contact@skyneu.com" 
                className="text-skyneu-blue hover:text-skyneu-green transition-colors duration-300 font-medium"
              >
                contact@skyneu.com
              </a>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  aria-label={social.label}
                  className="w-12 h-12 bg-white/10 dark:bg-dark-border rounded-2xl flex items-center justify-center hover:bg-skyneu-blue hover:scale-110 transition-all duration-300 group"
                >
                  <div className="text-gray-300 dark:text-dark-text-secondary group-hover:text-white transition-colors">
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Product</h4>
              <ul className="space-y-4">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.href} 
                      className="text-gray-300 dark:text-dark-text-secondary hover:text-skyneu-blue transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Company</h4>
              <ul className="space-y-4">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.href} 
                      className="text-gray-300 dark:text-dark-text-secondary hover:text-skyneu-blue transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Support</h4>
              <ul className="space-y-4">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <Link 
                      to={link.href} 
                      className="text-gray-300 dark:text-dark-text-secondary hover:text-skyneu-blue transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10 dark:border-dark-border">
        <div className="container mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 dark:text-dark-text-secondary text-sm">
              &copy; {new Date().getFullYear()} SkyNeu. All rights reserved. Made with ❤️ for travelers worldwide.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400 dark:text-dark-text-secondary">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms-of-use" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
              <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;