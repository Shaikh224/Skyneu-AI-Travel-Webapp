import React from 'react'
import ImageWithFallback from './ImageWithFallback'

interface RichTextRendererProps {
  content: any[]
  className?: string
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = '' }) => {
  if (!content || !Array.isArray(content)) {
    return null
  }

  const renderBlock = (block: any, index: number) => {
    if (block._type === 'block') {
      const style = block.style || 'normal'
      const children = block.children?.map((child: any, childIndex: number) => {
        let text = child.text || ''
        
        // Apply marks (bold, italic, etc.)
        if (child.marks) {
          child.marks.forEach((mark: string) => {
            switch (mark) {
              case 'strong':
                text = <strong key={childIndex}>{text}</strong>
                break
              case 'em':
                text = <em key={childIndex}>{text}</em>
                break
              case 'code':
                text = <code key={childIndex} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono">{text}</code>
                break
            }
          })
        }

        // Handle links
        if (child.marks?.includes('link')) {
          const linkMark = block.markDefs?.find((def: any) => def._type === 'link')
          if (linkMark) {
            text = (
              <a 
                key={childIndex}
                href={linkMark.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                {text}
              </a>
            )
          }
        }

        return text
      })

      switch (style) {
        case 'h2':
          return <h2 key={index} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 font-inter break-words">{children}</h2>
        case 'h3':
          return <h3 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3 font-inter break-words">{children}</h3>
        case 'h4':
          return <h4 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2 font-inter break-words">{children}</h4>
        case 'blockquote':
          return (
            <blockquote key={index} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-gray-700 dark:text-gray-300 my-4">
              {children}
            </blockquote>
          )
        default:
          return <p key={index} className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 font-inter text-base">{children}</p>
      }
    }

    if (block._type === 'image') {
      console.log('Image block:', block) // Debug log
      return (
        <div key={index} className="my-8">
          <ImageWithFallback
            src={block.asset?.url}
            alt={block.alt || ''}
            className="w-full rounded-xl shadow-lg object-cover"
            fallbackText="Content Image"
          />
          {block.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center italic">{block.caption}</p>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {content.map((block, index) => renderBlock(block, index))}
    </div>
  )
}

export default RichTextRenderer
