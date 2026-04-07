import { useState } from 'react';

export default function OrderBuilder({ menuItems, onSubmitOrder }) {
  const [orderItems, setOrderItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const addToOrder = (menuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((o) => o.id === menuItem.id);
      if (existing) {
        return prev.map((o) =>
          o.id === menuItem.id ? { ...o, qty: o.qty + 1 } : o
        );
      }
      return [...prev, { ...menuItem, qty: 1 }];
    });
    setSuccess(false);
  };

  const updateQty = (id, delta) => {
    setOrderItems((prev) =>
      prev
        .map((o) => (o.id === id ? { ...o, qty: o.qty + delta } : o))
        .filter((o) => o.qty > 0)
    );
  };

  const removeFromOrder = (id) => {
    setOrderItems((prev) => prev.filter((o) => o.id !== id));
  };

  const total = orderItems.reduce((sum, o) => sum + o.price * o.qty, 0);

  const handleSubmit = () => {
    if (orderItems.length === 0) return;
    onSubmitOrder({
      customer: customerName.trim() || 'Guest',
      items: orderItems,
      total,
      note: note.trim(),
    });
    setOrderItems([]);
    setCustomerName('');
    setNote('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Group menu items by category
  const grouped = menuItems.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Menu selection */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          <span className="text-2xl">🛒</span> Select Items
        </h2>

        {menuItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-5xl mb-3">🍴</p>
            <p className="text-lg font-medium">No menu items yet</p>
            <p className="text-sm">Add items in the Menu tab first.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">{cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((item) => {
                    const inOrder = orderItems.find((o) => o.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToOrder(item)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                          inOrder
                            ? 'border-amber-500 bg-amber-500/10 shadow-md shadow-amber-900/20'
                            : 'border-gray-800 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                        }`}
                      >
                        <span className="font-medium text-gray-100 truncate">{item.name}</span>
                        <span className="ml-2 shrink-0 text-emerald-400 font-bold">${item.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="flex flex-col gap-4">
        <div className="card p-6 flex-1">
          <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> Order Summary
            {orderItems.length > 0 && (
              <span className="badge bg-amber-500/20 text-amber-400 ml-1">{orderItems.reduce((s, o) => s + o.qty, 0)}</span>
            )}
          </h2>

          <div className="mb-4 space-y-3">
            <input
              className="input"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Order note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-4xl mb-2">🛍️</p>
              <p className="text-sm">Tap items on the left to add them here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orderItems.map((o) => (
                <div key={o.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-800">
                  <span className="flex-1 font-medium text-gray-200 truncate">{o.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(o.id, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold transition"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-gray-200">{o.qty}</span>
                    <button
                      onClick={() => updateQty(o.id, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold transition"
                    >+</button>
                  </div>
                  <span className="w-16 text-right text-emerald-400 font-bold shrink-0">${(o.price * o.qty).toFixed(2)}</span>
                  <button onClick={() => removeFromOrder(o.id)} className="text-red-500 hover:text-red-400 transition ml-1 text-lg leading-none">&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total & Charge */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 font-semibold text-lg">Total</span>
            <span className="text-3xl font-extrabold text-emerald-400">${total.toFixed(2)}</span>
          </div>

          {success && (
            <div className="mb-3 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-2">
              <span>✅</span> Order placed & payment received!
            </div>
          )}

          <button
            className="btn-success w-full text-base"
            onClick={handleSubmit}
            disabled={orderItems.length === 0}
          >
            💳 Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
