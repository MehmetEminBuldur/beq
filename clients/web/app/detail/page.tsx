'use client'

import { useState } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Resource {
  id: string
  title: string
  image: string
}

interface DetailItem {
  id: string
  title: string
  time: string
  description: string
  location: string
  checklist: ChecklistItem[]
  resources: Resource[]
}

function DetailPaneContent() {
  const [item, setItem] = useState<DetailItem>({
    id: '1',
    title: 'Morning Routine',
    time: '8:00 AM - 9:00 AM',
    description: 'Start your day with a refreshing morning routine to set a positive tone for the rest of the day. This includes a 30-minute yoga session, followed by a healthy breakfast and a quick review of your daily schedule.',
    location: 'Home',
    checklist: [
      { id: '1', text: 'Yoga (30 min)', completed: true },
      { id: '2', text: 'Healthy Breakfast', completed: true },
      { id: '3', text: 'Schedule Review', completed: false }
    ],
    resources: [
      {
        id: '1',
        title: 'Yoga for Beginners',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYQV7qDwq7VxcIU-TCN48XC7VaIG9vtEVvsPAokEsmS3ITM2TLyMLg0dQ5-9pDV-oVm4eqhAu-I4QIb5l4MbNKCUxi54jfSfSZpKq6g1bkbrLhzXsUiKmeH-QjovPorSdVjs0U_qnOk147wh9BstslsTq-r2faH1ACfNiRHIhhG7Ew_17Zp-ypBCVQ5lMOEwqjTsq2quZJ3fpaIRzTYcCj8tPz7NEOkdddPfGGiTrxv4Gn1QJxhkHaQpbg5uwl4DP1S4JrLOtAQjXo'
      },
      {
        id: '2',
        title: 'Quick & Healthy Breakfast Recipes',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU2lCV-66rpXqEnvUhRfyfn5suXZpmsP6A-3pZdD9uIhqtZoM6bqtmRAIxzj_uM6A8lxVPqZj20bwwzsGFKn8pEJCqLQ-hwNPeX7ZfvNyzNh9hTI2Jm3TsavdyXFpgBKXvcV9pnjdhjxuZVSdVnuJp4jy6H0jy6bWg7kkx7I_RX9uJA00qEG5hPaIU8gQgUgTblU-P3rsjhN3vPvvwjUc5x3K6chl9nwFMAsQordq6Xx38IfU32KC1riEV9kWm9mdLbFFjeexSz1Vh'
      },
      {
        id: '3',
        title: 'Time Management Tips',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADwk5UVVfZ38SFELdB82kyZHObLZBsf9e07L2TdiXoKsx31vENJWP9rvXwY1GBAQK8aMBnS4t1uR3wWAb4M-0SJoMzfkAlbe2Enmay4N9Csd-PFxHDDnC844cdSITViTZLbFX05s_7eUCtnk9dPzcI8PLfLhk9aWEaLGExIXfQRZWWaEo8GululqBDqNN4aabJz1XsKg8zxOn62AbGxE139S5D5xbsC2zuhvHutsMqnKLYIC6m86kq3w0DjCgAaTWtN78gDpdYSEQW'
      }
    ]
  })

  const handleChecklistChange = (checklistId: string) => {
    setItem(prevItem => ({
      ...prevItem,
      checklist: prevItem.checklist.map(item =>
        item.id === checklistId
          ? { ...item, completed: !item.completed }
          : item
      )
    }))
  }

  const handleEdit = () => {
    console.log('Edit item:', item.id)
    // Add edit functionality here
  }

  const handleDelete = () => {
    console.log('Delete item:', item.id)
    // Add delete functionality here
  }

  const handleResourceClick = (resource: Resource) => {
    console.log('Open resource:', resource.title)
    // Add resource opening functionality here
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-gray-200 px-10 py-3">
          <div className="flex items-center gap-4 text-gray-800">
            <div className="size-6 text-[#ea2a33]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em]">BeQ</h2>
          </div>
          <div className="flex flex-1 justify-end gap-4">
            <nav className="flex items-center gap-6">
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="/dashboard">Dashboard</a>
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="/calendar">Calendar</a>
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="/dashboard">Bricks</a>
              <a className="text-gray-600 hover:text-gray-900 text-sm font-medium leading-normal" href="/dashboard">Quanta</a>
            </nav>
            <div className="flex items-center gap-4">
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB6tJI0ANsT8O_NeIAurcZgGvl9qsWG9Dn28acz9SLueNzfcrzL5r2TfTZwpgHpwBFtIhWCVqNdTfj5qXjUVAbNe1CUvCeAvPhWHNhfdfaNHYiGXQkmoR3kWuThefLorOlmiEeLlL6bVmoi5zxYo9UEsTVzxwfh3Ewl0MDphfRSEd53hd3s_U4SWHVwQuUkZDQO8yPoofltsc0W36i2kbb8YQUsslj1wpmfPYmn7c1yf4v7rf6n56gwJqbe0SfgkCW5eUkkc50X79ob")'}}></div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 bg-gray-50/50">
          <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{item.title}</h1>
                    <p className="mt-1 text-base text-gray-500">{item.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleEdit}
                      className="flex items-center justify-center rounded-lg h-10 px-4 text-sm font-bold tracking-wide bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <span className="material-symbols-outlined mr-2">edit</span>
                      Edit
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="flex items-center justify-center rounded-lg h-10 px-4 text-sm font-bold tracking-wide bg-[#ea2a33] text-white hover:bg-red-700 transition-colors"
                    >
                      <span className="material-symbols-outlined mr-2">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="mt-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Description</h3>
                    <p className="mt-2 text-base text-gray-600">{item.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Location</h3>
                    <p className="mt-2 text-base text-gray-600">{item.location}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Quanta Checklist</h3>
                    <div className="mt-4 space-y-4">
                      {item.checklist.map((checklistItem) => (
                        <label key={checklistItem.id} className="flex items-center gap-x-3 cursor-pointer">
                          <input
                            checked={checklistItem.completed}
                            onChange={() => handleChecklistChange(checklistItem.id)}
                            className="h-5 w-5 rounded border-gray-300 text-[#ea2a33] focus:ring-[#ea2a33]"
                            type="checkbox"
                          />
                          <span className={`text-base ${checklistItem.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {checklistItem.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Enriched Resources</h3>
                    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {item.resources.map((resource) => (
                        <div 
                          key={resource.id}
                          onClick={() => handleResourceClick(resource)}
                          className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="w-full bg-center bg-no-repeat aspect-video bg-cover"
                            style={{backgroundImage: `url("${resource.image}")`}}
                          />
                          <div className="p-4">
                            <p className="text-base font-medium text-gray-800 group-hover:text-[#ea2a33] transition-colors">
                              {resource.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default function DetailPane() {
  return (
    <AuthGuard>
      <DetailPaneContent />
    </AuthGuard>
  )
}