import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-12 rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300 group overflow-hidden"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Icons container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun icon */}
        <Sun 
          className={`absolute h-5 w-5 text-yellow-500 transition-all duration-500 ${
            isDark 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        
        {/* Moon icon */}
        <Moon 
          className={`absolute h-5 w-5 text-blue-400 transition-all duration-500 ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-skyneu-blue/20 to-skyneu-green/20 opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
    </button>
  );
};

export default ThemeToggle;