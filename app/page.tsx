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
    setNewItemName(''); setNewItemPrice('')
  }

  const removeMenuItem = (id: number) => setMenuItems(prev => prev.filter(i => i.id !== id))

  const createClient = () => {
    if (!newName.trim()) return
    const client: Client = { id: nextClientId, name: newName.trim(), phone: newPhone.trim(), total: 0, tables: [], partialPaid: 0, orders: [] }
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
      const updatedOrders = existing ? c.orders.map(o => o.name === item.name ? { ...o, qty: o.qty + 1 } : o) : [...c.orders, { name: item.name, price: item.price, qty: 1 }]
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
    selectedClient.tables.forEach(tableId => { setTableSessions(prev => { const u = { ...prev }; delete u[tableId]; return u }) })
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
  const openTable = (tableId: number) => { if (tableSessions[tableId]) return; setSelectedTable(tableId); setPopup('assign') }

  const activeCount = Object.keys(tableSessions).length
  const todayRevenue = clients.reduce((a, c) => a + c.partialPaid, 0)
  const pending = clients.reduce((a, c) => a + (c.total - c.partialPaid), 0)

  const renderTable = (table: typeof initialTables[0]) => {
    const session = tableSessions[table.id]
    const client = session ? clients.find(c => c.id === session.clientId) : null
    const accentColor = table.type === 'Pool' ? '#e8185a' : table.type === 'Snooker' ? '#a855f7' : '#f59e0b'

    return (
      <div key={table.id} onClick={() => !session && openTable(table.id)}
        style={{
          background: session ? '#1a0d14' : '#13101e',
          border: `1px solid ${session ? accentColor + '55' : '#ffffff18'}`,
          borderRadius: '12px', padding: '14px', cursor: session ? 'default' : 'pointer',
          position: 'relative', overflow: 'hidden', transition: 'all 0.2s'
        }}>
        {session && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: accentColor }} />}
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffffcc', marginBottom: '8px' }}>{table.name}</div>
        {session && client ? (
          <>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>{client.name}</div>
            <div style={{ fontSize: '11px', color: '#ffffff88', marginBottom: '6px' }}>{session.rounds} rounds</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: accentColor, marginBottom: '10px' }}>{session.total} DH</div>
            {client.orders.length > 0 && <div style={{ fontSize: '11px', color: '#f59e0baa', marginBottom: '8px' }}>🍔 {client.orders.map(o => `${o.name} x${o.qty}`).join(', ')}</div>}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={(e) => { e.stopPropagation(); addRound(table.id) }}
                style={{ background: accentColor + '33', color: accentColor, border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>+1 Round</button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setPopup('order') }}
                style={{ background: '#f59e0b33', color: '#f59e0b', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>🍔</button>
              <button onClick={(e) => { e.stopPropagation(); closeTableSession(table.id) }}
                style={{ background: '#ffffff11', color: '#ffffff88', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}>Libérer</button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '12px', color: '#ffffff66', marginTop: '4px' }}>Disponible</div>
        )}
      </div>
    )
  }

  const inputStyle = { width: '100%', background: '#1e1a2e', color: 'white', border: '1px solid #ffffff22', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none' }
  const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }
  const modalStyle = { background: '#13101e', border: '1px solid #ffffff18', borderRadius: '16px', padding: '24px', width: '340px' }
  const modalTitle = { fontSize: '16px', fontWeight: 600, color: 'white', marginBottom: '4px' }
  const modalSub = { fontSize: '12px', color: '#ffffff66', marginBottom: '20px' }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b14', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* Topbar */}
      <div style={{ background: '#0d0b14', borderBottom: '1px solid #ffffff11', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#e8185a', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: 'white' }}>AKA</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>AKA Pool Manager</div>
            <div style={{ fontSize: '11px', color: '#ffffff66' }}>Tableau de bord</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: '#ffffff11', padding: '4px', borderRadius: '10px' }}>
          {(['staff', 'menu'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '6px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: view === v ? '#e8185a' : 'transparent', color: view === v ? 'white' : '#ffffff88' }}>
              {v === 'staff' ? '🎱 Staff' : '🍔 Menu'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {view === 'staff' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#ffffff11', borderBottom: '1px solid #ffffff11' }}>
          {[
            { label: 'Tables actives', val: `${activeCount}`, unit: `/ 11` },
            { label: 'Clients actifs', val: `${clients.length}`, unit: '' },
            { label: "Revenu aujourd'hui", val: `${todayRevenue}`, unit: 'DH' },
            { label: 'En attente', val: `${pending}`, unit: 'DH' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0d0b14', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#ffffff88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'white' }}>{s.val} <span style={{ fontSize: '12px', color: '#e8185a', fontWeight: 500 }}>{s.unit}</span></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '24px' }}>

        {/* MENU VIEW */}
        {view === 'menu' && (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8185a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Gestion du Menu</div>
            <div style={{ background: '#13101e', border: '1px solid #ffffff18', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#ffffffaa', marginBottom: '14px', fontWeight: 500 }}>Ajouter un article</div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input placeholder="Nom (ex: Coca Cola)" value={newItemName} onChange={e => setNewItemName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="number" placeholder="DH" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} style={{ ...inputStyle, width: '80px' }} />
              </div>
              <button onClick={addMenuItem} style={{ width: '100%', background: '#e8185a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button>
            </div>
            {menuItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#ffffff44', padding: '40px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍽️</div>
                <div style={{ fontSize: '14px' }}>Menu vide — ajoutez vos articles</div>
              </div>
            ) : menuItems.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#13101e', border: '1px solid #ffffff18', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#e8185a', marginTop: '2px', fontWeight: 500 }}>{item.price} DH</div>
                </div>
                <button onClick={() => removeMenuItem(item.id)} style={{ background: '#ff000018', color: '#ff6b6b', border: '1px solid #ff000033', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Supprimer</button>
              </div>
            ))}
          </div>
        )}

        {/* STAFF VIEW */}
        {view === 'staff' && (
          <>
            {clients.length > 0 && (
              <div style={{ background: '#13101e', border: '1px solid #ffffff18', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#e8185a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Clients Actifs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clients.map(client => {
                    const remaining = client.total - client.partialPaid
                    return (
                      <div key={client.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d0b14', border: '1px solid #ffffff11', borderRadius: '10px', padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{client.name}</div>
                          <div style={{ fontSize: '11px', color: '#ffffff88', marginTop: '2px' }}>{client.tables.map(t => initialTables.find(tb => tb.id === t)?.name).join(' · ') || 'Aucune table'}</div>
                          {client.orders.length > 0 && <div style={{ fontSize: '11px', color: '#f59e0baa', marginTop: '2px' }}>🍔 {client.orders.map(o => `${o.name} x${o.qty}`).join(', ')}</div>}
                          {client.partialPaid > 0 && <div style={{ fontSize: '11px', color: '#4ade80aa', marginTop: '2px' }}>✅ Déjà payé: {client.partialPaid} DH</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '20px', fontWeight: 600, color: '#e8185a' }}>{remaining} DH</div>
                            {client.partialPaid > 0 && <div style={{ fontSize: '11px', color: '#ffffff44' }}>/ {client.total} DH</div>}
                          </div>
                          <button onClick={() => openPayPopup(client)} style={{ background: '#e8185a', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Encaisser</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ fontSize: '11px', fontWeight: 600, color: '#e8185a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e8185a' }} />
              Tables Pool — 5 DH / round
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {initialTables.filter(t => t.type === 'Pool').map(renderTable)}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }} />
              Snooker — 25 DH / round
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {initialTables.filter(t => t.type === 'Snooker').map(renderTable)}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
              Royal Snooker — 40 DH / round
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {initialTables.filter(t => t.type === 'Royal').map(renderTable)}
            </div>
          </>
        )}
      </div>

      {/* Assign Popup */}
      {popup === 'assign' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalTitle}>Assigner un client</div>
            <div style={modalSub}>Choisissez ou créez un client</div>
            {clients.length > 0 && (
              <>
                {clients.map(client => (
                  <button key={client.id} onClick={() => assignClientToTable(client.id, selectedTable!)}
                    style={{ width: '100%', background: '#1e1a2e', border: '1px solid #ffffff18', borderRadius: '8px', padding: '10px 14px', color: 'white', textAlign: 'left', fontSize: '13px', cursor: 'pointer', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                    <span>{client.name}</span>
                    <span style={{ color: '#e8185a', fontWeight: 600 }}>{client.total - client.partialPaid} DH</span>
                  </button>
                ))}
                <div style={{ height: '1px', background: '#ffffff11', margin: '14px 0' }} />
              </>
            )}
            <button onClick={() => setPopup('newclient')} style={{ width: '100%', background: '#e8185a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>+ Nouveau Client</button>
            <button onClick={() => { setPopup(null); setSelectedTable(null) }} style={{ width: '100%', background: '#ffffff11', color: '#ffffff88', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* New Client Popup */}
      {popup === 'newclient' && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalTitle}>Nouveau Client</div>
            <div style={modalSub}>Entrez les informations du client</div>
            <input placeholder="Nom ou surnom..." value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} autoFocus />
            <input placeholder="Téléphone (optionnel)..." value={newPhone} onChange={e => setNewPhone(e.target.value)} style={{ ...inputStyle, marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={createClient} style={{ flex: 1, background: '#e8185a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Créer ✅</button>
              <button onClick={() => setPopup('assign')} style={{ flex: 1, background: '#ffffff11', color: '#ffffff88', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* Order Popup */}
      {popup === 'order' && selectedClient && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalTitle}>Commande</div>
            <div style={modalSub}>👤 {selectedClient.name}</div>
            {menuItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#ffffff44', padding: '20px 0', fontSize: '13px' }}>Menu vide — ajoutez des articles dans l'onglet Menu</div>
            ) : menuItems.map(item => (
              <button key={item.id} onClick={() => addOrderToClient(selectedClient, item)}
                style={{ width: '100%', background: '#1e1a2e', border: '1px solid #ffffff18', borderRadius: '8px', padding: '12px 14px', color: 'white', cursor: 'pointer', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500 }}>
                <span>{item.name}</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>+ {item.price} DH</span>
              </button>
            ))}
            {selectedClient.orders.length > 0 && (
              <div style={{ background: '#0d0b14', borderRadius: '8px', padding: '12px', marginTop: '10px', marginBottom: '12px' }}>
                {selectedClient.orders.map((o, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ffffffaa', marginBottom: '4px' }}>
                    <span>{o.name} x{o.qty}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{o.price * o.qty} DH</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setPopup(null)} style={{ width: '100%', background: '#ffffff11', color: '#ffffff88', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* Pay Popup */}
      {popup === 'pay' && selectedClient && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, width: '380px' }}>
            <div style={modalTitle}>Encaissement</div>
            <div style={modalSub}>👤 {selectedClient.name} — Reste: <span style={{ color: '#e8185a', fontWeight: 600 }}>{selectedClient.total - selectedClient.partialPaid} DH</span></div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['full', 'split'] as const).map(m => (
                <button key={m} onClick={() => setPayMode(m)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: payMode === m ? '#e8185a' : '#ffffff11', color: payMode === m ? 'white' : '#ffffff88' }}>
                  {m === 'full' ? '💰 Paiement total' : '👥 Paiement partiel'}
                </button>
              ))}
            </div>
            {payMode === 'full' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 600, color: '#e8185a', marginBottom: '20px' }}>{selectedClient.total - selectedClient.partialPaid} DH</div>
                <button onClick={confirmFullPay} style={{ width: '100%', background: '#e8185a', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>✅ Confirmer et fermer</button>
              </div>
            )}
            {payMode === 'split' && (
              <div>
                <div style={{ fontSize: '12px', color: '#ffffff88', marginBottom: '12px' }}>Un joueur paie sa part — le tab reste ouvert</div>
                {splits.map((split, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input placeholder={`Joueur ${i + 1}`} value={split.name} onChange={e => { const u = [...splits]; u[i].name = e.target.value; setSplits(u) }} style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} />
                    <input type="number" placeholder="DH" value={split.amount} onChange={e => { const u = [...splits]; u[i].amount = e.target.value; setSplits(u) }} style={{ ...inputStyle, width: '70px', padding: '8px 12px' }} />
                    <button onClick={() => confirmPartialPay(parseFloat(split.amount) || 0, split.name)} style={{ background: '#e8185a33', color: '#e8185a', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Payer</button>
                  </div>
                ))}
                <button onClick={() => setSplits([...splits, { name: '', amount: '' }])} style={{ width: '100%', background: '#ffffff11', color: '#ffffff88', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>+ Ajouter un joueur</button>
                <div style={{ textAlign: 'center', fontSize: '12px', color: remainingAfterSplit >= 0 ? '#ffffff66' : '#ff6b6b', marginTop: '10px', fontWeight: 500 }}>Reste sur le tab: {remainingAfterSplit} DH</div>
              </div>
            )}
            <button onClick={() => setPopup(null)} style={{ width: '100%', background: '#ffffff11', color: '#ffffff88', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', cursor: 'pointer', marginTop: '12px' }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}