import { useState, useEffect } from 'react';
import MenuManager from './components/MenuManager';
import OrderBuilder from './components/OrderBuilder';
import BalanceDashboard from './components/BalanceDashboard';

const STORAGE_KEYS = {
  menu: 'mm_menu',
  orders: 'mm_orders',
  balance: 'mm_balance',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const TABS = [
  { id: 'menu', label: 'Menu', icon: '🍽️' },
  { id: 'order', label: 'New Order', icon: '🛒' },
  { id: 'dashboard', label: 'Dashboard', icon: '💰' },
];

export default function App() {
  const [tab, setTab] = useState('menu');
  const [menuItems, setMenuItems] = useState(() => load(STORAGE_KEYS.menu, []));
  const [orders, setOrders] = useState(() => load(STORAGE_KEYS.orders, []));
  const [balance, setBalance] = useState(() => load(STORAGE_KEYS.balance, 0));

  useEffect(() => { save(STORAGE_KEYS.menu, menuItems); }, [menuItems]);
  useEffect(() => { save(STORAGE_KEYS.orders, orders); }, [orders]);
  useEffect(() => { save(STORAGE_KEYS.balance, balance); }, [balance]);

  const handleAddItem = (item) => {
    setMenuItems((prev) => [...prev, { ...item, id: Date.now() }]);
  };

  const handleDeleteItem = (id) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEditItem = (id, updates) => {
    setMenuItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleSubmitOrder = (order) => {
    const newOrder = { ...order, id: Date.now(), timestamp: new Date().toISOString() };
    setOrders((prev) => [...prev, newOrder]);
    setBalance((prev) => +(prev + order.total).toFixed(2));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍴</span>
            <div>
              <h1 className="text-xl font-extrabold text-white leading-tight">Menu Manager</h1>
              <p className="text-xs text-gray-500">Restaurant POS System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2">
            <span className="text-emerald-400 text-sm font-semibold">Balance</span>
            <span className="text-emerald-400 font-extrabold text-lg">${balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="bg-gray-900/60 border-b border-gray-800 sticky top-[73px] z-10">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn flex items-center gap-2 ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {t.id === 'order' && menuItems.length > 0 && (
                <span className="badge bg-amber-500/20 text-amber-400">{menuItems.length}</span>
              )}
              {t.id === 'dashboard' && orders.length > 0 && (
                <span className="badge bg-emerald-500/20 text-emerald-400">{orders.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {tab === 'menu' && (
          <MenuManager
            menuItems={menuItems}
            onAdd={handleAddItem}
            onDelete={handleDeleteItem}
            onEdit={handleEditItem}
          />
        )}
        {tab === 'order' && (
          <OrderBuilder menuItems={menuItems} onSubmitOrder={handleSubmitOrder} />
        )}
        {tab === 'dashboard' && (
          <BalanceDashboard orders={orders} balance={balance} />
        )}
      </main>

      <footer className="border-t border-gray-800 text-center py-4 text-xs text-gray-600">
        Menu Manager — All amounts are simulated (fake money)
      </footer>
    </div>
  );
}
