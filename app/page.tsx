'use client'
import { useState } from 'react'

const initialTables = [
  { id: 1, name: 'Table 1', type: 'Pool', price: 5 },
  { id: 2, name: 'Table 2', type: 'Pool', price: 5 },
  { id: 3, name: 'Table 3', type: 'Pool', price: 5 },
  { id: 4, name: 'Table 4', type: 'Pool', price: 5 },
  { id: 5, name: 'Table 5', type: 'Pool', price: 5 },
  { id: 6, name: 'Table 6', type: 'Pool', price: 5 },
  { id: 7, name: 'Table 7', type: 'Pool', price: 5 },
  { id: 8, name: 'Table 8', type: 'Pool', price: 5 },
  { id: 9, name: 'Snooker 1', type: 'Snooker', price: 25 },
  { id: 10, name: 'Snooker 2', type: 'Snooker', price: 25 },
  { id: 11, name: 'Royal', type: 'Royal', price: 40 },
]

type Client = {
  id: number
  name: string
  phone: string
  total: number
  tables: number[]
}

type TableSession = {
  clientId: number
  rounds: number
  total: number
}

export default function Home() {
  const [clients, setClients] = useState<Client[]>([])
  const [tableSessions, setTableSessions] = useState<Record<number, TableSession>>({})
  const [popup, setPopup] = useState<'newclient' | 'assign' | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [nextClientId, setNextClientId] = useState(1)

  const createClient = () => {
    if (!newName.trim()) return
    const client: Client = {
      id: nextClientId,
      name: newName.trim(),
      phone: newPhone.trim(),
      total: 0,
      tables: []
    }
    setClients(prev => [...prev, client])
    setNextClientId(prev => prev + 1)
    setNewName('')
    setNewPhone('')
    if (selectedTable) {
      assignClientToTable(client.id, selectedTable, [...clients, client])
    }
    setPopup(null)
  }

  const assignClientToTable = (clientId: number, tableId: number, currentClients = clients) => {
    const table = initialTables.find(t => t.id === tableId)
    if (!table) return
    setTableSessions(prev => ({
      ...prev,
      [tableId]: { clientId, rounds: 0, total: 0 }
    }))
    setClients(currentClients.map(c =>
      c.id === clientId ? { ...c, tables: [...c.tables, tableId] } : c
    ))
    setPopup(null)
    setSelectedTable(null)
  }

  const addRound = (tableId: number) => {
    const table = initialTables.find(t => t.id === tableId)
    const session = tableSessions[tableId]
    if (!table || !session) return
    setTableSessions(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        rounds: prev[tableId].rounds + 1,
        total: prev[tableId].total + table.price
      }
    }))
    setClients(prev => prev.map(c =>
      c.id === session.clientId ? { ...c, total: c.total + table.price } : c
    ))
  }

  const closeTableSession = (tableId: number) => {
    const session = tableSessions[tableId]
    if (!session) return
    setClients(prev => prev.map(c =>
      c.id === session.clientId
        ? { ...c, tables: c.tables.filter(t => t !== tableId) }
        : c
    ))
    setTableSessions(prev => {
      const updated = { ...prev }
      delete updated[tableId]
      return updated
    })
  }

  const payClient = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    alert(`💰 ${client.name} — Total: ${client.total} DH\nMerci et à bientôt! 🎱`)
    client.tables.forEach(tableId => {
      setTableSessions(prev => {
        const updated = { ...prev }
        delete updated[tableId]
        return updated
      })
    })
    setClients(prev => prev.filter(c => c.id !== clientId))
  }

  const openTable = (tableId: number) => {
    if (tableSessions[tableId]) return
    setSelectedTable(tableId)
    setPopup('assign')
  }

  const renderTable = (table: typeof initialTables[0]) => {
    const session = tableSessions[table.id]
    const client = session ? clients.find(c => c.id === session.clientId) : null
    const borderColor = table.type === 'Pool' ? 'border-blue-400' : table.type === 'Snooker' ? 'border-purple-400' : 'border-yellow-400'
    const hoverColor = table.type === 'Pool' ? 'hover:border-blue-400' : table.type === 'Snooker' ? 'hover:border-purple-400' : 'hover:border-yellow-400'

    return (
      <div
        key={table.id}
        className={`rounded-2xl p-4 border-2 transition-all ${
          session ? `bg-green-800 ${borderColor}` : `bg-gray-800 border-gray-600 cursor-pointer ${hoverColor}`
        }`}
        onClick={() => !session && openTable(table.id)}
      >
        <div className="font-bold text-lg">{table.name}</div>
        {session && client ? (
          <>
            <div className="text-sm text-green-300 mb-1">👤 {client.name}</div>
            <div className="text-sm">🪙 Rounds: {session.rounds}</div>
            <div className="text-sm font-bold text-yellow-300">💰 {session.total} DH</div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); addRound(table.id) }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-lg"
              >
                +1 Round
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); closeTableSession(table.id) }}
                className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded-lg"
              >
                Libérer
              </button>
            </div>
          </>
        ) : (
          <div className="text-red-400 mt-2">🔴 Vide</div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-1">🎱 Pool Manager</h1>
      <p className="text-center text-gray-400 mb-6">Tableau de bord — Staff</p>

      {/* Active Clients */}
      {clients.length > 0 && (
        <div className="mb-8 bg-gray-800 rounded-2xl p-4 border border-gray-600">
          <h2 className="text-lg font-bold mb-3 text-white">👥 Clients Actifs</h2>
          <div className="flex flex-col gap-3">
            {clients.map(client => (
              <div key={client.id} className="flex items-center justify-between bg-gray-700 rounded-xl px-4 py-3">
                <div>
                  <div className="font-semibold">👤 {client.name}</div>
                  <div className="text-xs text-gray-400">
                    Tables: {client.tables.map(t => initialTables.find(tb => tb.id === t)?.name).join(', ') || 'Aucune'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-yellow-300 font-bold text-lg">{client.total} DH</div>
                  <button
                    onClick={() => payClient(client.id)}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    💰 Payer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pool Tables */}
      <h2 className="text-xl font-semibold mb-4 text-blue-400">🎱 Tables Pool — 5 DH</h2>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {initialTables.filter(t => t.type === 'Pool').map(renderTable)}
      </div>

      {/* Snooker Tables */}
      <h2 className="text-xl font-semibold mb-4 text-purple-400">🎳 Snooker — 25 DH</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {initialTables.filter(t => t.type === 'Snooker').map(renderTable)}
      </div>

      {/* Royal Table */}
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">👑 Royal Snooker — 40 DH</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {initialTables.filter(t => t.type === 'Royal').map(renderTable)}
      </div>

      {/* Assign Popup */}
      {popup === 'assign' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-80 border border-gray-600">
            <h3 className="text-xl font-bold mb-4">👤 Assigner un Client</h3>
            {clients.length > 0 && (
              <>
                <p className="text-sm text-gray-400 mb-2">Clients existants:</p>
                <div className="flex flex-col gap-2 mb-4">
                  {clients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => assignClientToTable(client.id, selectedTable!)}
                      className="bg-gray-700 hover:bg-gray-600 text-left px-4 py-2 rounded-lg text-sm"
                    >
                      👤 {client.name} — {client.total} DH
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-600 my-4" />
              </>
            )}
            <button
              onClick={() => setPopup('newclient')}
              className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-semibold"
            >
              + Nouveau Client
            </button>
            <button
              onClick={() => { setPopup(null); setSelectedTable(null) }}
              className="w-full mt-2 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* New Client Popup */}
      {popup === 'newclient' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-80 border border-gray-600">
            <h3 className="text-xl font-bold mb-4">➕ Nouveau Client</h3>
            <input
              type="text"
              placeholder="Nom ou surnom..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-3 outline-none"
              autoFocus
            />
            <input
              type="text"
              placeholder="Téléphone (optionnel)..."
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-4 outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={createClient}
                className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg font-semibold"
              >
                Créer ✅
              </button>
              <button
                onClick={() => setPopup('assign')}
                className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}