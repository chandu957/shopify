import { useState, useRef, useEffect } from 'react'
import { FaRobot, FaTimes, FaPaperPlane, FaUser, FaHeadset } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const getWelcomeMessage = (u) => {
    const firstName = u?.name?.split(' ')[0]
    if (firstName) {
      return `👋 Hi ${firstName}! Great to see you.\n\nI'm your personal shopping assistant. I can help you with:\n  📦 Your orders & tracking\n  🛍️ Product search & recommendations\n  🚚 Shipping & delivery info\n  ↩️ Returns & refunds\n  💳 Payment & billing\n  ❌ Order cancellation\n\nWhat can I help you with today, ${firstName}?`
    }
    return `👋 Hello! I'm your AI shopping assistant.\n\nI can help you with:\n  📦 Orders & tracking\n  🛍️ Product search\n  🚚 Shipping info\n  ↩️ Returns & refunds\n  💳 Payment info\n\nHow can I assist you today?`
  }

  const buildWelcomeMsg = (u) => ({
    id: 1,
    text: getWelcomeMessage(u),
    sender: 'bot',
    timestamp: new Date()
  })

  const [messages, setMessages] = useState([buildWelcomeMsg(user)])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const prevUserRef = useRef(user)

  // Reset chat and show personalized greeting whenever the logged-in user changes
  useEffect(() => {
    const prev = prevUserRef.current
    const prevId = prev?._id || prev?.id || null
    const currId = user?._id || user?.id || null
    if (prevId !== currId) {
      setMessages([buildWelcomeMsg(user)])
      prevUserRef.current = user
    }
  }, [user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Send message + userId (full MongoDB _id) if user is logged in
      const payload = {
        message: inputMessage,
        userId: user?._id || user?.id || null,
        userName: user?.name || null,
        userEmail: user?.email || null
      }

      const response = await apiClient.post('/api/chat', payload)

      // Format multiline bot responses (convert \n to line breaks)
      const botMessage = {
        id: messages.length + 2,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        intent: response.data.intent,
        confidence: response.data.confidence,
        ticketCreated: response.data.ticketCreated || false
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Render bot text with line breaks
  const renderText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        aria-label="Open chat support"
      >
        {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 z-40 flex flex-col">
          {/* Header */}
          <div className="bg-amazon-950 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shrink-0">
                <FaHeadset size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight">AI Shopping Assistant</h3>
                {user ? (
                  <p className="text-xs text-white/70 truncate">
                    🟢 Hi, <span className="font-medium text-orange-300">{user.name || user.email}</span>
                  </p>
                ) : (
                  <p className="text-xs text-white/60">🟢 Online — Guest mode</p>
                )}
              </div>
            </div>
            {/* User avatar / initials */}
            <div className="flex items-center gap-2">
              {user && (
                <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user.name
                    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : <FaUser size={12} />}
                </div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors ml-1"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                      : 'bg-gray-100 text-amazon-950'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.sender === 'user' ? (
                      <FaUser size={12} />
                    ) : (
                      <FaRobot size={12} />
                    )}
                    <span className="text-xs opacity-70 font-medium">
                      {message.sender === 'user'
                        ? (user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'You')
                        : 'AI Assistant'}
                    </span>
                    <span className="text-xs opacity-50">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {renderText(message.text)}
                  </p>
                  {message.ticketCreated && (
                    <div className="mt-2 flex items-center gap-1 text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 rounded px-2 py-1">
                      <span>📋</span>
                      <span>Ticket raised — our team will follow up shortly</span>
                    </div>
                  )}
                  {message.intent && message.confidence > 0 && (
                    <div className="text-xs opacity-60 mt-1">
                      Intent: {message.intent} ({Math.round(message.confidence * 100)}%)
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-amazon-950 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <FaRobot size={12} />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={user ? `Hi ${user.name?.split(' ')[0] || ''}! How can I help?` : 'Ask me anything...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-yellow focus:border-transparent text-sm"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <FaPaperPlane size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot
