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

type MenuItem = { id: number; name: string; price: number }
type OrderItem = { name: string; price: number; qty: number }
type Client = {
  id: number; name: string; phone: string
  total: number; tables: number[]
  partialPaid: number; orders: OrderItem[]
}
type TableSession = { clientId: number; rounds: number; total: number }
type SplitEntry = { name: string; amount: string }

export default function Home() {
  const [view, setView] = useState<'staff' | 'menu'>('staff')
  const [clients, setClients] = useState<Client[]>([])
  const [tableSessions, setTableSessions] = useState<Record<number, TableSession>>({})
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [nextItemId, setNextItemId] = useState(1)
  const [popup, setPopup] = useState<'newclient' | 'assign' | 'pay' | 'order' | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [nextClientId, setNextClientId] = useState(1)
  const [payMode, setPayMode] = useState<'full' | 'split'>('full')
  const [splits, setSplits] = useState<SplitEntry[]>([{ name: '', amount: '' }, { name: '', amount: '' }])

  const addMenuItem = () => {
    if (!newItemName.trim() || !newItemPrice) return
    setMenuItems(prev => [...prev, { id: nextItemId, name: newItemName.trim(), price: parseFloat(newItemPrice) }])
    setNextItemId(prev => prev + 1)
    setNewItemName('')
    setNewItemPrice('')
  }

  const removeMenuItem = (id: number) => {
    setMenuItems(prev => prev.filter(i => i.id !== id))
  }

  const createClient = () => {
    if (!newName.trim()) return
    const client: Client = {
      id: nextClientId, name: newName.trim(), phone: newPhone.trim(),
      total: 0, tables: [], partialPaid: 0, orders: []
    }
    setClients(prev => [...prev, client])
    setNextClientId(prev => prev + 1)
    setNewName(''); setNewPhone('')
    if (selectedTable) assignClientToTable(client.id, selectedTable, [...clients, client])
    setPopup(null)
  }

  const assignClientToTable = (clientId: number, tableId: number, currentClients = clients) => {
    setTableSessions(prev => ({ ...prev, [tableId]: { clientId, rounds: 0, total: 0 } }))
    setClients(currentClients.map(c => c.id === clientId ? { ...c, tables: [...c.tables, tableId] } : c))
    setPopup(null); setSelectedTable(null)
  }

  const addRound = (tableId: number) => {
    const table = initialTables.find(t => t.id === tableId)
    const session = tableSessions[tableId]
    if (!table || !session) return
    setTableSessions(prev => ({ ...prev, [tableId]: { ...prev[tableId], rounds: prev[tableId].rounds + 1, total: prev[tableId].total + table.price } }))
    setClients(prev => prev.map(c => c.id === session.clientId ? { ...c, total: c.total + table.price } : c))
  }

  const closeTableSession = (tableId: number) => {
    const session = tableSessions[tableId]
    if (!session) return
    setClients(prev => prev.map(c => c.id === session.clientId ? { ...c, tables: c.tables.filter(t => t !== tableId) } : c))
    setTableSessions(prev => { const u = { ...prev }; delete u[tableId]; return u })
  }

  const addOrderToClient = (client: Client, item: MenuItem) => {
    setClients(prev => prev.map(c => {
      if (c.id !== client.id) return c
      const existing = c.orders.find(o => o.name === item.name)
      const updatedOrders = existing
        ? c.orders.map(o => o.name === item.name ? { ...o, qty: o.qty + 1 } : o)
        : [...c.orders, { name: item.name, price: item.price, qty: 1 }]
      return { ...c, orders: updatedOrders, total: c.total + item.price }
    }))
  }

  const openPayPopup = (client: Client) => {
    setSelectedClient(client); setPayMode('full')
    setSplits([{ name: '', amount: '' }, { name: '', amount: '' }]); setPopup('pay')
  }

  const confirmFullPay = () => {
    if (!selectedClient) return
    alert(`✅ ${selectedClient.name} a payé ${selectedClient.total - selectedClient.partialPaid} DH\nMerci et à bientôt! 🎱`)
    selectedClient.tables.forEach(tableId => {
      setTableSessions(prev => { const u = { ...prev }; delete u[tableId]; return u })
    })
    setClients(prev => prev.filter(c => c.id !== selectedClient.id))
    setPopup(null); setSelectedClient(null)
  }

  const confirmPartialPay = (amount: number, playerName: string) => {
    if (!selectedClient) return
    if (amount <= 0 || amount > selectedClient.total - selectedClient.partialPaid) { alert('⚠️ Montant invalide'); return }
    alert(`✅ ${playerName || 'Joueur'} a payé ${amount} DH\nLe reste continue sur le tab.`)
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, partialPaid: c.partialPaid + amount } : c))
    setPopup(null); setSelectedClient(null)
  }

  const splitTotal = splits.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0)
  const remainingAfterSplit = selectedClient ? (selectedClient.total - selectedClient.partialPaid) - splitTotal : 0

  const openTable = (tableId: number) => {
    if (tableSessions[tableId]) return
    setSelectedTable(tableId); setPopup('assign')
  }

  const renderTable = (table: typeof initialTables[0]) => {
    const session = tableSessions[table.id]
    const client = session ? clients.find(c => c.id === session.clientId) : null
    const borderColor = table.type === 'Pool' ? 'border-blue-400' : table.type === 'Snooker' ? 'border-purple-400' : 'border-yellow-400'
    const hoverColor = table.type === 'Pool' ? 'hover:border-blue-400' : table.type === 'Snooker' ? 'hover:border-purple-400' : 'hover:border-yellow-400'
    return (
      <div key={table.id}
        className={`rounded-2xl p-4 border-2 transition-all ${session ? `bg-green-800 ${borderColor}` : `bg-gray-800 border-gray-600 cursor-pointer ${hoverColor}`}`}
        onClick={() => !session && openTable(table.id)}
      >
        <div className="font-bold text-lg">{table.name}</div>
        {session && client ? (
          <>
            <div className="text-sm text-green-300 mb-1">👤 {client.name}</div>
            <div className="text-sm">🪙 Rounds: {session.rounds}</div>
            <div className="text-sm font-bold text-yellow-300">💰 {session.total} DH</div>
            {client.orders.length > 0 && (
              <div className="text-xs text-orange-300 mt-1">🍔 {client.orders.map(o => `${o.name} x${o.qty}`).join(', ')}</div>
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={(e) => { e.stopPropagation(); addRound(table.id) }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded-lg">+1 Round</button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setPopup('order') }} className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-3 py-1 rounded-lg">🍔 Commande</button>
              <button onClick={(e) => { e.stopPropagation(); closeTableSession(table.id) }} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded-lg">Libérer</button>
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

      {/* Nav */}
      <div className="flex justify-center gap-4 mb-6">
        <button onClick={() => setView('staff')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'staff' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🎱 Staff</button>
        <button onClick={() => setView('menu')} className={`px-6 py-2 rounded-lg font-semibold ${view === 'menu' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}>🍔 Menu</button>
      </div>

      {/* MENU VIEW */}
      {view === 'menu' && (
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-bold mb-4 text-orange-400">🍔 Gestion du Menu</h2>

          {/* Add item */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-600 mb-6">
            <h3 className="font-semibold mb-3">Ajouter un article</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Nom (ex: Coca Cola)" value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 outline-none text-sm" />
              <input type="number" placeholder="Prix DH" value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-24 bg-gray-700 text-white rounded-lg px-3 py-2 outline-none text-sm" />
            </div>
            <button onClick={addMenuItem} className="w-full bg-orange-600 hover:bg-orange-500 py-2 rounded-lg font-semibold">
              + Ajouter au menu
            </button>
          </div>

          {/* Menu items */}
          {menuItems.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-5xl mb-3">🍽️</div>
              <p>Menu vide — ajoutez vos articles ci-dessus</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {menuItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 border border-gray-600">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-yellow-300 text-sm">{item.price} DH</div>
                  </div>
                  <button onClick={() => removeMenuItem(item.id)} className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-gray-700">
                    🗑️ Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STAFF VIEW */}
      {view === 'staff' && (
        <>
          {clients.length > 0 && (
            <div className="mb-8 bg-gray-800 rounded-2xl p-4 border border-gray-600">
              <h2 className="text-lg font-bold mb-3">👥 Clients Actifs</h2>
              <div className="flex flex-col gap-3">
                {clients.map(client => {
                  const remaining = client.total - client.partialPaid
                  return (
                    <div key={client.id} className="flex items-center justify-between bg-gray-700 rounded-xl px-4 py-3">
                      <div>
                        <div className="font-semibold">👤 {client.name}</div>
                        <div className="text-xs text-gray-400">Tables: {client.tables.map(t => initialTables.find(tb => tb.id === t)?.name).join(', ') || 'Aucune'}</div>
                        {client.orders.length > 0 && <div className="text-xs text-orange-300">🍔 {client.orders.map(o => `${o.name} x${o.qty}`).join(', ')}</div>}
                        {client.partialPaid > 0 && <div className="text-xs text-green-400">✅ Déjà payé: {client.partialPaid} DH</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-yellow-300 font-bold text-lg">{remaining} DH</div>
                          {client.partialPaid > 0 && <div className="text-xs text-gray-400">/ {client.total} DH</div>}
                        </div>
                        <button onClick={() => openPayPopup(client)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">💰 Payer</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold mb-4 text-blue-400">🎱 Tables Pool — 5 DH</h2>
          <div className="grid grid-cols-4 gap-4 mb-8">{initialTables.filter(t => t.type === 'Pool').map(renderTable)}</div>

          <h2 className="text-xl font-semibold mb-4 text-purple-400">🎳 Snooker — 25 DH</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">{initialTables.filter(t => t.type === 'Snooker').map(renderTable)}</div>

          <h2 className="text-xl font-semibold mb-4 text-yellow-400">👑 Royal Snooker — 40 DH</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">{initialTables.filter(t => t.type === 'Royal').map(renderTable)}</div>
        </>
      )}

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
                    <button key={client.id} onClick={() => assignClientToTable(client.id, selectedTable!)} className="bg-gray-700 hover:bg-gray-600 text-left px-4 py-2 rounded-lg text-sm">
                      👤 {client.name} — {client.total - client.partialPaid} DH
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-600 my-4" />
              </>
            )}
            <button onClick={() => setPopup('newclient')} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-semibold">+ Nouveau Client</button>
            <button onClick={() => { setPopup(null); setSelectedTable(null) }} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg">Annuler</button>
          </div>
        </div>
      )}

      {/* New Client Popup */}
      {popup === 'newclient' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-80 border border-gray-600">
            <h3 className="text-xl font-bold mb-4">➕ Nouveau Client</h3>
            <input type="text" placeholder="Nom ou surnom..." value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-3 outline-none" autoFocus />
            <input type="text" placeholder="Téléphone (optionnel)..." value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-4 outline-none" />
            <div className="flex gap-3">
              <button onClick={createClient} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg font-semibold">Créer ✅</button>
              <button onClick={() => setPopup('assign')} className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg">Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Popup */}
      {popup === 'order' && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-80 border border-gray-600">
            <h3 className="text-xl font-bold mb-1">🍔 Commande</h3>
            <p className="text-gray-400 text-sm mb-4">👤 {selectedClient.name}</p>
            {menuItems.length === 0 ? (
              <div className="text-center text-gray-500 py-6">
                <p>Menu vide</p>
                <p className="text-xs mt-1">Ajoutez des articles dans l'onglet Menu</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {menuItems.map(item => (
                  <button key={item.id}
                    onClick={() => { addOrderToClient(selectedClient, item); setSelectedClient(clients.find(c => c.id === selectedClient.id) || selectedClient) }}
                    className="flex justify-between items-center bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-xl"
                  >
                    <span>{item.name}</span>
                    <span className="text-yellow-300 font-semibold">+ {item.price} DH</span>
                  </button>
                ))}
              </div>
            )}
            {selectedClient.orders.length > 0 && (
              <div className="bg-gray-700 rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold mb-2">Commandes actuelles:</p>
                {selectedClient.orders.map((o, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{o.name} x{o.qty}</span>
                    <span className="text-yellow-300">{o.price * o.qty} DH</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setPopup(null)} className="w-full bg-gray-600 hover:bg-gray-500 py-2 rounded-lg">Fermer</button>
          </div>
        </div>
      )}

      {/* Pay Popup */}
      {popup === 'pay' && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-96 border border-gray-600">
            <h3 className="text-xl font-bold mb-1">💰 Paiement</h3>
            <p className="text-gray-400 mb-4">👤 {selectedClient.name} — Reste: <span className="text-yellow-300 font-bold">{selectedClient.total - selectedClient.partialPaid} DH</span></p>
            <div className="flex gap-3 mb-6">
              <button onClick={() => setPayMode('full')} className={`flex-1 py-2 rounded-lg font-semibold ${payMode === 'full' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>💰 Total</button>
              <button onClick={() => setPayMode('split')} className={`flex-1 py-2 rounded-lg font-semibold ${payMode === 'split' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>👥 Partiel</button>
            </div>
            {payMode === 'full' && (
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-300 mb-2">{selectedClient.total - selectedClient.partialPaid} DH</div>
                <button onClick={confirmFullPay} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold text-lg">✅ Confirmer et fermer</button>
              </div>
            )}
            {payMode === 'split' && (
              <div>
                <p className="text-sm text-gray-400 mb-3">Un joueur paie sa part — le tab reste ouvert.</p>
                <div className="flex flex-col gap-3 mb-4">
                  {splits.map((split, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" placeholder={`Joueur ${i + 1}`} value={split.name}
                        onChange={(e) => { const u = [...splits]; u[i].name = e.target.value; setSplits(u) }}
                        className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 outline-none text-sm" />
                      <input type="number" placeholder="DH" value={split.amount}
                        onChange={(e) => { const u = [...splits]; u[i].amount = e.target.value; setSplits(u) }}
                        className="w-24 bg-gray-700 text-white rounded-lg px-3 py-2 outline-none text-sm" />
                      <button onClick={() => confirmPartialPay(parseFloat(split.amount) || 0, split.name)} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-2 rounded-lg">Payer</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSplits([...splits, { name: '', amount: '' }])} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm">+ Ajouter un joueur</button>
                <div className={`text-center font-bold text-sm mt-3 ${remainingAfterSplit >= 0 ? 'text-gray-400' : 'text-red-400'}`}>
                  Reste sur le tab: {remainingAfterSplit} DH
                </div>
              </div>
            )}
            <button onClick={() => setPopup(null)} className="w-full mt-4 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}