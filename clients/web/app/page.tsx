'use client'

import { useState } from 'react'

export default function Dashboard() {
  const [chatInput, setChatInput] = useState('')

  return (
    <div className="relative flex size-full min-h-screen flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 px-10 py-4">
          <div className="flex items-center gap-3 text-gray-800">
            <div className="w-8 h-8 text-[var(--primary-color)]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tighter">BeQ</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center justify-center rounded-full h-10 w-10 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined text-2xl">help</span>
            </button>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAYkslausFGh33kaiyixVbs4R0fxOZpIvJdJ3W4quaA5F3QMbOGcr90hMu5AkuMVXS3o7B_Rj6CHBoI2ZewYHZlSH8v_Iy8ibgOFY8PRbL_grfDAFt4w6Yfh0bTg3YNfdmtk3XgGwD1OWyZPdgogL7pxcP2ym-zrWXm-Xzlpe8FHSNw0p20XFjvbiRAso2lAnUi80GKo_BtUlitgNQr1f0_t3Eg8GsA7Wvow0ikDFaYUlIS85S6kS4iIuttslmvwQ8H_I0UVn3Z-ih7")'}}></div>
          </div>
        </header>
        <main className="flex-1 px-10 py-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-800">Welcome back, Sarah</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Today's Summary</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You have <strong>3 tasks</strong> and <strong>2 events</strong> scheduled for today. Your first task is at 9 AM, and your first event is at 2 PM.
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl border border-gray-200 shadow-sm" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCHVTVQDMNmhJ4-1zXZeFBkMLhqdl9NhJ6ENCflQLgdGgcCFzfZSArzbrKBmV3VeGSxELYBTjWef_lUps4okMt4AtelpZIPgEL1HhETipL5ox-xJ642pxkY3tLxGn_CO_v6-KRPjmfCJ2M9s8BeFbMKDOa2_bkl1BZbX4zRHoeyATU0pOzIhIWADodyJeW_aHroo_knffEC6VWMOaOXUQ9JBDGUJUHDZu1oHkl-9KuMtvyq1YTWUZcROKkA_3L9AD8xPAxL_JmOhUya")'}}></div>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <button className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-[var(--primary-color)] text-white text-sm font-bold shadow-sm hover:bg-red-700 transition-colors">
                <span className="material-symbols-outlined">add</span>
                <span className="truncate">New Task</span>
              </button>
              <button className="flex items-center justify-center gap-2 rounded-md h-11 px-5 bg-gray-200 text-gray-800 text-sm font-bold shadow-sm hover:bg-gray-300 transition-colors">
                <span className="material-symbols-outlined">add</span>
                <span className="truncate">New Event</span>
              </button>
            </div>
            <div className="mt-8">
              <div className="relative">
                <input 
                  className="form-input w-full rounded-md border-gray-300 bg-white h-14 pl-4 pr-12 text-base shadow-sm focus:border-red-500 focus:ring-red-500" 
                  placeholder="Ask me anything..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-[var(--primary-color)]">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">Example: "Schedule a meeting with Alex for tomorrow at 3 PM"</p>
            </div>
            <div className="mt-12">
              <h3 className="text-lg font-bold text-gray-800">Recent Interactions</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-center rounded-full bg-gray-100 shrink-0 size-12">
                    <span className="material-symbols-outlined text-gray-600 text-2xl">calendar_month</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-800">Scheduled: Meeting with Alex</p>
                    <p className="text-sm text-gray-500">Tomorrow at 3:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-center rounded-full bg-gray-100 shrink-0 size-12">
                    <span className="material-symbols-outlined text-gray-600 text-2xl">notifications</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-800">Reminder: Call Mom</p>
                    <p className="text-sm text-gray-500">Today at 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}