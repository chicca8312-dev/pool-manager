'use client'
import { useState } from 'react'

const tables = [
  { id: 1, name: 'Table 1', type: 'Pool' },
  { id: 2, name: 'Table 2', type: 'Pool' },
  { id: 3, name: 'Table 3', type: 'Pool' },
  { id: 4, name: 'Table 4', type: 'Snooker' },
]

export default function Home() {
  const [active, setActive] = useState<number[]>([])

  const toggle = (id: number) => {
    setActive(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold text-center mb-2">🎱 Pool Manager</h1>
      <p className="text-center text-gray-400 mb-8">Tableau de bord — Staff</p>

      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
        {tables.map(table => (
          <div
            key={table.id}
            className={`rounded-2xl p-6 cursor-pointer transition-all ${
              active.includes(table.id)
                ? 'bg-green-700 border-2 border-green-400'
                : 'bg-gray-800 border-2 border-gray-600'
            }`}
            onClick={() => toggle(table.id)}
          >
            <div className="text-xl font-bold">{table.name}</div>
            <div className="text-sm text-gray-300 mb-4">{table.type}</div>
            <div className={`text-lg font-semibold ${active.includes(table.id) ? 'text-green-300' : 'text-red-400'}`}>
              {active.includes(table.id) ? '🟢 Active' : '🔴 Empty'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}