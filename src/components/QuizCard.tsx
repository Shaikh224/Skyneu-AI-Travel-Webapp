import React from 'react'
import { Clock, Star, Award, Target, ChevronRight, Image as ImageIcon } from 'lucide-react'
import ImageWithFallback from './ImageWithFallback'

interface Quiz {
  _id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
  image?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
  points: number
  timeLimit: number
  publishedAt: string
  featured?: boolean
}

interface QuizCardProps {
  quiz: Quiz
  onClick: () => void
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onClick }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'flight-training':
        return '✈️'
      case 'aviation-safety':
        return '🛡️'
      case 'weather':
        return '🌤️'
      case 'navigation':
        return '🧭'
      case 'aircraft-systems':
        return '⚙️'
      case 'regulations':
        return '📋'
      case 'atc':
        return '📡'
      default:
        return '❓'
    }
  }

  const formatCategory = (category: string) => {
    return category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Quiz'
  }

  return (
    <article 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {quiz.image?.asset?.url ? (
          <ImageWithFallback
            src={quiz.image.asset.url}
            alt={quiz.image.alt || quiz.question}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackText="Quiz Image"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">{getCategoryIcon(quiz.category)}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium">Aviation Quiz</p>
            </div>
          </div>
        )}
        
        {/* Featured Badge */}
        {quiz.featured && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3" />
              Featured
            </span>
          </div>
        )}
        
        {/* Difficulty Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty?.toUpperCase() || 'MEDIUM'}
          </span>
        </div>
        
        {/* Points Badge */}
        <div className="absolute bottom-4 right-4">
          <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
            <Award className="w-3 h-3" />
            {quiz.points} pts
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Category and Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCategoryIcon(quiz.category)}</span>
            <span className="text-sm text-gray-600 font-medium">
              {formatCategory(quiz.category)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{quiz.timeLimit}s</span>
          </div>
        </div>

        {/* Question */}
        <h3 className="font-bold text-lg mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-3">
          {quiz.question}
        </h3>


        {/* Tags */}
        {quiz.tags && quiz.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {quiz.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {quiz.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{quiz.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600 font-medium">Take Quiz</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </article>
  )
}

export default QuizCard
