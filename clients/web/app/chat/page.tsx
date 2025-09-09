'use client'

import { useState } from 'react'

interface Message {
  id: string
  sender: 'assistant' | 'user'
  content: string
  timestamp: Date
  actions?: { label: string; action: string }[]
}

export default function ConversationalInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      content: 'Hi Sarah, I noticed you have a meeting with Alex at 2 PM today. Would you like me to send a reminder?',
      timestamp: new Date(),
      actions: [
        { label: 'Yes, please', action: 'send_reminder' },
        { label: 'No, thanks', action: 'dismiss' }
      ]
    },
    {
      id: '2',
      sender: 'assistant',
      content: 'Okay, I\'ve sent a reminder to Alex. Is there anything else I can assist you with?',
      timestamp: new Date()
    }
  ])
  
  const [messageInput, setMessageInput] = useState('')

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        content: messageInput.trim(),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, newMessage])
      setMessageInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const handleAction = (action: string, messageId: string) => {
    // Handle action button clicks
    console.log('Action:', action, 'for message:', messageId)
    
    // Remove actions from the message after clicking
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, actions: undefined } : msg
    ))
    
    // You could add logic here to handle different actions
    if (action === 'send_reminder') {
      // Add assistant response
      const responseMessage: Message = {
        id: Date.now().toString(),
        sender: 'assistant',
        content: 'Perfect! I\'ve sent a reminder to Alex about your 2 PM meeting.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, responseMessage])
    }
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-[var(--primary-color)] rounded-lg text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold">BeQ</h1>
          </div>
          <nav className="flex flex-col gap-4">
            <a className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors" href="/">
              <span className="material-symbols-outlined">home</span>
              <span>Home</span>
            </a>
            <a className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors" href="#">
              <span className="material-symbols-outlined">calendar_month</span>
              <span>Calendar</span>
            </a>
            <a className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors" href="#">
              <span className="material-symbols-outlined">task_alt</span>
              <span>Tasks</span>
            </a>
            <a className="flex items-center gap-3 text-gray-900 font-medium bg-gray-50 rounded-lg px-3 py-2 transition-colors" href="/chat">
              <span className="material-symbols-outlined">chat</span>
              <span>Chat</span>
            </a>
            <a className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors" href="#">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA1RPBNPUlkyDXGP3Qr3hs73zn3Lo7T4s4x_9FT3W7jNRH7ZqId7i7U8_acykGiNOF0CpECe-nIIgbExr578DJgBHBGKzAUrYbzeP6OP50zRQJVIr4jHCpbLESb8gchCYzNxOIGYrAJFMJF0SUt-v16G_j4YG1SPfCoKmbh3KcG1RvgXawJ3xsgAyJhOP2LkPsD22K46QINGJiTOxMl1xlW4ThdWMLJ8P_S6GP1eia8vL853cfXwR4X3bcYZ23B2Wx2H33mjzrfOP-M")'}}></div>
          <div>
            <p className="font-semibold text-sm">Sarah</p>
            <p className="text-xs text-gray-500">sarah@email.com</p>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h2 className="text-2xl font-bold leading-tight">Conversational Interface</h2>
          <p className="text-gray-500 text-sm">How can I help you organize your life today?</p>
        </header>
        
        <div className="flex-1 flex flex-col justify-between p-8 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-4 max-w-lg">
                {message.sender === 'assistant' && (
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0 mt-1" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAotO-jNCeVaKOiY_8_KBKcVJsu1agrNsjY8-hJHayahLesfrxNG5PGzGI5lcKdG-VmKfWNNhP6TnbtqZ_GJn5z51azlaLHowoEcVhHnCHtzRLKfYbzbKD33CSTtCXTokWmSnMLoEIYpRZnrBu0CXOsbG9-EZsm9_U5LvBA34gUpeGdc63ji0J6hTP415jUwnhKE4NYbU7pUHMGuITuwbBnYVhgDAHRgxd6xMPH1U6TvCQjgTYZ6zakmjm6QP6MCFi7BDTw1LMKOIFl")'}}></div>
                )}
                {message.sender === 'user' && (
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0 mt-1" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA1RPBNPUlkyDXGP3Qr3hs73zn3Lo7T4s4x_9FT3W7jNRH7ZqId7i7U8_acykGiNOF0CpECe-nIIgbExr578DJgBHBGKzAUrYbzeP6OP50zRQJVIr4jHCpbLESb8gchCYzNxOIGYrAJFMJF0SUt-v16G_j4YG1SPfCoKmbh3KcG1RvgXawJ3xsgAyJhOP2LkPsD22K46QINGJiTOxMl1xlW4ThdWMLJ8P_S6GP1eia8vL853cfXwR4X3bcYZ23B2Wx2H33mjzrfOP-M")'}}></div>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-gray-600 text-sm font-medium">
                    {message.sender === 'assistant' ? 'BeQ Assistant' : 'You'}
                  </p>
                  <div className={`chat-bubble ${message.sender === 'assistant' ? 'assistant-bubble' : 'user-bubble'}`}>
                    <p>{message.content}</p>
                  </div>
                  {message.actions && (
                    <div className="flex gap-2 pt-2">
                      {message.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleAction(action.action, message.id)}
                          className={`flex items-center justify-center rounded-md h-9 px-4 text-sm font-semibold transition-colors ${
                            index === 0 
                              ? 'bg-[var(--primary-color)] text-white hover:bg-opacity-90' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <div className="relative">
              <input
                className="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] pl-4 pr-12 py-3 transition-shadow"
                placeholder="Type your message here..."
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={handleSendMessage}
              >
                <span className="material-symbols-outlined text-gray-500 hover:text-[var(--primary-color)] transition-colors">send</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}