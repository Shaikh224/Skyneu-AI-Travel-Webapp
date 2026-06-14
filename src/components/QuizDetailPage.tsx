import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Award, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  ArrowLeft,
  Star,
  Target,
  Trophy,
  ChevronRight
} from 'lucide-react'
import { getQuiz } from '../lib/queries'
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

const QuizDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (id) {
      loadQuiz()
    }
  }, [id])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (quizStarted && timeLeft > 0 && !showResult) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (timeLeft === 0 && quizStarted && !showResult) {
      handleTimeUp()
    }
    return () => clearTimeout(timer)
  }, [timeLeft, quizStarted, showResult])

  const loadQuiz = async () => {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await getQuiz(id)
      if (data) {
        setQuiz(data)
        setTimeLeft(data.timeLimit)
      } else {
        setError('Quiz not found')
      }
    } catch (err) {
      setError('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const handleAnswerSelect = (answer: string) => {
    if (!quizStarted || showResult) return
    setSelectedAnswer(answer)
  }

  const submitAnswer = () => {
    if (!selectedAnswer || !quiz) return
    
    setShowResult(true)
    setQuizStarted(false) // Stop the timer
    if (selectedAnswer === quiz.correctAnswer) {
      setScore(quiz.points)
    }
  }

  const handleTimeUp = () => {
    if (!quiz) return
    setShowResult(true)
    setQuizStarted(false)
  }

  const resetQuiz = () => {
    setQuizStarted(false)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    if (quiz) {
      setTimeLeft(quiz.timeLimit)
    }
  }

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The quiz you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/aviation-education')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Education
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 mt-4 sm:mt-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/aviation-education')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Aviation Education
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getCategoryIcon(quiz.category)}</span>
                <h1 className="text-3xl font-bold text-gray-900">Aviation Quiz</h1>
                {quiz.featured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">{formatCategory(quiz.category)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                  {quiz.difficulty?.toUpperCase() || 'MEDIUM'}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {quiz.points} points
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {quiz.timeLimit} seconds
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Timer */}
          {quizStarted && (
            <div className="bg-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Time Remaining</span>
                </div>
                <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-200' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="mt-2 bg-blue-700 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / quiz.timeLimit) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Question Image */}
          {quiz.image?.asset?.url && (
            <div className="p-6 pb-0">
              <ImageWithFallback
                src={quiz.image.asset.url}
                alt={quiz.image.alt || quiz.question}
                className="w-full h-64 object-cover rounded-lg"
                fallbackText="Quiz Image"
              />
            </div>
          )}

          {/* Question */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-relaxed">
              {quiz.question}
            </h2>

            {/* Answer Options */}
            {!showResult ? (
              <div className="space-y-3 mb-6">
                {quiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={!quizStarted}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${!quizStarted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Results */
              <div className="space-y-3 mb-6">
                {quiz.options.map((option, index) => {
                  const isCorrect = option === quiz.correctAnswer
                  const isSelected = selectedAnswer === option
                  
                  return (
                    <div
                      key={index}
                      className={`w-full p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'border-green-500 bg-green-50'
                          : isSelected && !isCorrect
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCorrect
                            ? 'bg-green-500 text-white'
                            : isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isSelected && !isCorrect ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                        <span className={`font-medium ${
                          isCorrect ? 'text-green-900' : isSelected && !isCorrect ? 'text-red-900' : 'text-gray-600'
                        }`}>
                          {option}
                        </span>
                        {isCorrect && (
                          <span className="ml-auto text-green-600 font-medium">Correct Answer</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Score Display */}
            {showResult && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {score > 0 ? (
                      <>
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <span className="text-2xl font-bold text-green-600">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-500" />
                        <span className="text-2xl font-bold text-red-600">Incorrect</span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {score > 0 ? `You earned ${score} points!` : 'Better luck next time!'}
                  </p>
                </div>
              </div>
            )}

            {/* Explanation */}
            {showResult && quiz.explanation && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Explanation:</h3>
                <p className="text-blue-800">{quiz.explanation}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!quizStarted ? (
                <button
                  onClick={startQuiz}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Target className="w-5 h-5" />
                  Start Quiz
                </button>
              ) : !showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={resetQuiz}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          {quiz.tags && quiz.tags.length > 0 && (
            <div className="px-6 pb-6">
              <div className="flex flex-wrap gap-2">
                {quiz.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuizDetailPage
