import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  quickActions?: string[]; // Quick actions from trip plan data
}

interface QuickAction {
  title: string;
  description?: string;
  icon: string;
  type: 'booking' | 'search' | 'info' | 'external';
  url?: string;
  action?: string;
}

// Parse Quick Action text into structured data
function parseQuickAction(actionText: string): QuickAction {
  const text = actionText.replace(/[\[\]]/g, '').trim();
  
  // Flight booking actions
  if (text.toLowerCase().includes('book') && text.toLowerCase().includes('flight')) {
    return {
      title: text,
      description: 'Search and book flights',
      icon: '✈️',
      type: 'booking',
      action: 'flight_search'
    };
  }
  
  // Bus booking actions
  if (text.toLowerCase().includes('book') && (text.toLowerCase().includes('bus') || text.toLowerCase().includes('volvo'))) {
    return {
      title: text,
      description: 'Book bus tickets online',
      icon: '🚌',
      type: 'booking',
      action: 'bus_booking'
    };
  }
  
  // Hotel booking actions
  if ((text.toLowerCase().includes('book') || text.toLowerCase().includes('reserve')) && text.toLowerCase().includes('hotel')) {
    return {
      title: text,
      description: 'Find and book hotels',
      icon: '🏨',
      type: 'booking',
      action: 'hotel_booking'
    };
  }
  
  // Taxi/Transport booking
  if ((text.toLowerCase().includes('book') || text.toLowerCase().includes('arrange')) && (text.toLowerCase().includes('taxi') || text.toLowerCase().includes('transport'))) {
    return {
      title: text,
      description: 'Book local transport',
      icon: '🚗',
      type: 'booking',
      action: 'taxi_booking'
    };
  }
  
  // Weather check
  if (text.toLowerCase().includes('weather')) {
    return {
      title: text,
      description: 'Check current weather conditions',
      icon: '🌤️',
      type: 'info',
      action: 'weather_check'
    };
  }
  
  // Visa check
  if (text.toLowerCase().includes('visa')) {
    return {
      title: text,
      description: 'Check visa requirements',
      icon: '📋',
      type: 'info',
      action: 'visa_check'
    };
  }
  
  // Price check
  if (text.toLowerCase().includes('price') || text.toLowerCase().includes('cost')) {
    return {
      title: text,
      description: 'View current prices',
      icon: '💰',
      type: 'info',
      action: 'price_check'
    };
  }
  
  // Train booking actions
  if (text.toLowerCase().includes('book') && text.toLowerCase().includes('train')) {
    return {
      title: text,
      description: 'Book train tickets online',
      icon: '🚂',
      type: 'booking',
      action: 'train_booking'
    };
  }
  
  // Airport transfer actions
  if (text.toLowerCase().includes('arrange') && (text.toLowerCase().includes('airport') || text.toLowerCase().includes('transfer'))) {
    return {
      title: text,
      description: 'Arrange airport transfer',
      icon: '🚗',
      type: 'booking',
      action: 'taxi_booking'
    };
  }
  
  // Local transport/arrange actions
  if (text.toLowerCase().includes('arrange') && (text.toLowerCase().includes('local') || text.toLowerCase().includes('transport'))) {
    return {
      title: text,
      description: 'Arrange local transportation',
      icon: '🚗',
      type: 'booking',
      action: 'taxi_booking'
    };
  }
  
  // Default action
  return {
    title: text,
    description: 'Quick action',
    icon: '🔗',
    type: 'external',
    action: 'external_link'
  };
}

// Handle Quick Action clicks
function handleQuickAction(action: QuickAction) {
  switch (action.action) {
    case 'flight_search':
      // Navigate to internal flight search page
      window.location.href = '/flights';
      break;
    case 'bus_booking':
      // For now, use external link for bus booking (can be updated when internal page is ready)
      window.open('https://www.redbus.in', '_blank');
      break;
    case 'hotel_booking':
      // For now, use external link for hotel booking (can be updated when internal page is ready)
      window.open('https://www.booking.com', '_blank');
      break;
    case 'taxi_booking':
      // For now, use external link for taxi booking (can be updated when internal page is ready)
      window.open('https://www.uber.com', '_blank');
      break;
    case 'train_booking':
      // For now, use external link for train booking (can be updated when internal page is ready)
      window.open('https://www.irctc.co.in', '_blank');
      break;
    case 'weather_check':
      // Extract location from action title - try multiple patterns
      let location = 'current location';
      const locationMatch = action.title.match(/(?:in|for|at)\s+([^,\n]+)/i) || 
                           action.title.match(/weather\s+(.+)/i) ||
                           action.title.match(/updates?\s+(.+)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
        // Clean up common words
        location = location.replace(/\b(weather|updates?|check|current)\b/gi, '').trim();
      }
      // Use external weather service for now
      window.open(`https://www.google.com/search?q=weather+${encodeURIComponent(location)}`, '_blank');
      break;
    case 'visa_check':
      // Navigate to internal visa page
      window.location.href = '/visa';
      break;
    case 'price_check':
      // Navigate to internal flight search page for price checking
      window.location.href = '/flights';
      break;
    default:
      if (action.url) {
        // If it's an internal URL, navigate directly, otherwise open in new tab
        if (action.url.startsWith('/')) {
          window.location.href = action.url;
        } else {
          window.open(action.url, '_blank');
        }
      }
  }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', quickActions = [] }) => {
  // Process inline formatting function (defined first to avoid hoisting issues)
  const processInlineFormatting = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    // Handle code blocks (```code```)
    const codeBlockRegex = /```([^`]+)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }
      
      // Add the code block
      parts.push(
        <code key={`code-${match.index}`} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
          {match[1]}
        </code>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Handle inline code (`code`)
    const inlineCodeRegex = /`([^`]+)`/g;
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }
      
      // Add the inline code
      parts.push(
        <code key={`inline-code-${match.index}`} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
          {match[1]}
        </code>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Handle bold text (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }
      
      // Add the bold text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-skyneu-dark dark:text-white">
          {match[1]}
        </strong>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Handle italic text (*text*)
    const italicRegex = /\*(.*?)\*/g;
    while ((match = italicRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }
      
      // Add the italic text
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-skyneu-dark dark:text-white">
          {match[1]}
        </em>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Enhanced markdown parser for rich formatting
  const renderContent = (text: string) => {
    // Split by lines to handle multi-line content
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Handle main headers (#)
      if (line.startsWith('# ')) {
        return (
          <h1 key={lineIndex} className="text-xl font-bold mb-3 mt-4 text-skyneu-blue dark:text-skyneu-blue-light">
            {line.replace(/^#\s*/, '')}
          </h1>
        );
      }
      
      // Handle subheaders (##)
      if (line.startsWith('## ')) {
        return (
          <h2 key={lineIndex} className="text-lg font-bold mb-2 mt-4 text-skyneu-dark dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1">
            {line.replace(/^##\s*/, '')}
          </h2>
        );
      }
      
      // Handle sub-subheaders (###)
      if (line.startsWith('### ')) {
        return (
          <h3 key={lineIndex} className="text-base font-semibold mb-2 mt-3 text-skyneu-dark dark:text-white">
            {line.replace(/^###\s*/, '')}
          </h3>
        );
      }
      
      // Handle horizontal rules (---)
      if (line.trim() === '---') {
        return (
          <hr key={lineIndex} className="my-4 border-gray-200 dark:border-gray-700" />
        );
      }
      
      // Handle blockquotes (>)
      if (line.startsWith('> ')) {
        return (
          <blockquote key={lineIndex} className="border-l-4 border-skyneu-blue pl-4 py-2 my-3 bg-skyneu-blue/5 dark:bg-skyneu-blue/10 rounded-r-lg">
            <p className="text-skyneu-dark dark:text-white italic">
              {processInlineFormatting(line.replace(/^>\s*/, ''))}
            </p>
          </blockquote>
        );
      }
      
      // Handle code blocks (```)
      if (line.startsWith('```')) {
        return null; // Skip code block markers, handle in next iteration
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        return <br key={lineIndex} />;
      }
      
      
      // Handle list items
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const listContent = line.replace(/^[•\-*]\s*/, '');
        return (
          <div key={lineIndex} className="flex items-start gap-3 mb-2">
            <span className="text-skyneu-blue dark:text-skyneu-blue-light mt-1 font-bold">•</span>
            <span className="text-skyneu-dark dark:text-white">{processInlineFormatting(listContent)}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s*(.*)$/);
      if (numberedMatch) {
        return (
          <div key={lineIndex} className="flex items-start gap-3 mb-2">
            <span className="text-skyneu-blue dark:text-skyneu-blue-light font-semibold bg-skyneu-blue/10 dark:bg-skyneu-blue/20 rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {numberedMatch[1]}
            </span>
            <span className="text-skyneu-dark dark:text-white">{processInlineFormatting(numberedMatch[2])}</span>
          </div>
        );
      }
      
      // Handle Quick Actions section
      if (line.includes('🔗') && line.includes('Quick Actions')) {
        // Find all action lines after this header
        const actionLines = [];
        for (let i = lineIndex + 1; i < lines.length; i++) {
          const nextLine = lines[i];
          if (nextLine.trim() === '' || nextLine.startsWith('##') || nextLine.startsWith('#')) {
            break;
          }
          if (nextLine.includes('[') && nextLine.includes(']')) {
            actionLines.push(nextLine);
          }
        }
        
        return (
          <div key={lineIndex} className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 p-4 rounded-lg mb-3 border-l-4 border-skyneu-blue">
            <h3 className="text-skyneu-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
              🔗 Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionLines.map((actionLine, actionIndex) => {
                const actionText = actionLine.replace(/^[-•]\s*/, '').trim();
                const action = parseQuickAction(actionText);
                return (
                  <button
                    key={actionIndex}
                    onClick={() => handleQuickAction(action)}
                    className="text-left p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-skyneu-blue/10 dark:hover:bg-skyneu-blue/20 hover:border-skyneu-blue transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-skyneu-blue group-hover:text-skyneu-green transition-colors">
                        {action.icon}
                      </span>
                      <span className="text-sm font-medium text-skyneu-dark dark:text-white group-hover:text-skyneu-blue transition-colors">
                        {action.title}
                      </span>
                    </div>
                    {action.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
      
      // Handle other special callout sections
      if (line.includes('💡') || line.includes('⚠️')) {
        return (
          <div key={lineIndex} className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 p-3 rounded-lg mb-3 border-l-4 border-skyneu-blue">
            <p className="text-skyneu-dark dark:text-white font-medium">
              {processInlineFormatting(line)}
            </p>
          </div>
        );
      }
      
      // Handle table rows (simple table detection)
      if (line.includes('|') && line.split('|').length > 2) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        const isHeader = lineIndex > 0 && lines[lineIndex - 1]?.includes('|') && lines[lineIndex - 1]?.includes('---');
        
        if (isHeader) {
          return (
            <tr key={lineIndex} className="border-b border-gray-200 dark:border-gray-700">
              {cells.map((cell, cellIndex) => (
                <th key={cellIndex} className="px-3 py-2 text-left font-semibold text-skyneu-dark dark:text-white bg-gray-50 dark:bg-gray-800">
                  {processInlineFormatting(cell)}
                </th>
              ))}
            </tr>
          );
        } else {
          return (
            <tr key={lineIndex} className="border-b border-gray-100 dark:border-gray-800">
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 text-skyneu-dark dark:text-white">
                  {processInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          );
        }
      }
      
      // Handle table wrapper (if previous line was a table)
      if (lineIndex > 0 && lines[lineIndex - 1]?.includes('|') && !line.includes('|')) {
        return null; // Skip non-table lines after table
      }
      
      // Regular paragraph
      return (
        <p key={lineIndex} className="mb-3 text-skyneu-dark dark:text-white leading-relaxed">
          {processInlineFormatting(line)}
        </p>
      );
    });
  };

  return (
    <div className={`markdown-content prose prose-sm max-w-none ${className}`}>
      <style jsx>{`
        .markdown-content {
          line-height: 1.6;
        }
        .markdown-content h1 {
          color: #1e40af;
          font-weight: 700;
          margin-bottom: 0.75rem;
          margin-top: 1rem;
        }
        .markdown-content h2 {
          color: #1f2937;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .markdown-content h3 {
          color: #374151;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.75rem;
        }
        .markdown-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin: 0.75rem 0;
          background-color: rgba(59, 130, 246, 0.05);
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .markdown-content ul {
          list-style: none;
          padding-left: 0;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
        }
        .markdown-content pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        .dark .markdown-content h1 {
          color: #60a5fa;
        }
        .dark .markdown-content h2 {
          color: #ffffff;
          border-bottom-color: #374151;
        }
        .dark .markdown-content h3 {
          color: #e5e7eb;
        }
        .dark .markdown-content blockquote {
          background-color: rgba(59, 130, 246, 0.1);
        }
        .dark .markdown-content code {
          background-color: #374151;
          color: #f9fafb;
        }
        .dark .markdown-content pre {
          background-color: #111827;
        }
      `}</style>
      {renderContent(content)}
      
      {/* Render Quick Actions from trip plan data if available */}
      {quickActions && quickActions.length > 0 && (
        <div className="bg-gradient-to-r from-skyneu-blue/10 to-skyneu-green/10 dark:from-skyneu-blue/20 dark:to-skyneu-green/20 p-4 rounded-lg mb-3 border-l-4 border-skyneu-blue mt-4">
          <h3 className="text-skyneu-dark dark:text-white font-semibold mb-3 flex items-center gap-2">
            🔗 Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickActions.map((actionText, actionIndex) => {
              const action = parseQuickAction(actionText);
              return (
                <button
                  key={actionIndex}
                  onClick={() => handleQuickAction(action)}
                  className="text-left p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-skyneu-blue/10 dark:hover:bg-skyneu-blue/20 hover:border-skyneu-blue transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-skyneu-blue group-hover:text-skyneu-green transition-colors">
                      {action.icon}
                    </span>
                    <span className="text-sm font-medium text-skyneu-dark dark:text-white group-hover:text-skyneu-blue transition-colors">
                      {action.title}
                    </span>
                  </div>
                  {action.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
