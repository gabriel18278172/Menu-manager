export default function BalanceDashboard({ orders, balance }) {
  const asMoney = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? +parsed.toFixed(2) : fallback;
  };

  const normalizedOrders = orders.map((order) => {
    const subtotal = asMoney(order.subtotal, asMoney(order.total, 0));
    const tip = asMoney(order.tip, 0);
    return {
      ...order,
      subtotal,
      tip,
      total: +(subtotal + tip).toFixed(2),
      items: Array.isArray(order.items) ? order.items : [],
      customer: order.customer || 'Guest',
      note: typeof order.note === 'string' ? order.note : '',
    };
  });

  const grossRevenue = normalizedOrders.reduce((sum, order) => sum + order.total, 0);
  const subtotalRevenue = normalizedOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const tipsRevenue = normalizedOrders.reduce((sum, order) => sum + order.tip, 0);
  const avgOrder = normalizedOrders.length > 0 ? grossRevenue / normalizedOrders.length : 0;
  const avgTip = normalizedOrders.length > 0 ? tipsRevenue / normalizedOrders.length : 0;

  const todayOrders = normalizedOrders.filter((o) => {
    const d = new Date(o.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const todayTips = todayOrders.reduce((sum, order) => sum + order.tip, 0);

  const topItems = Object.values(
    normalizedOrders.flatMap((o) => o.items).reduce((acc, item) => {
      if (!acc[item.name]) acc[item.name] = { name: item.name, qty: 0, revenue: 0 };
      acc[item.name].qty += item.qty;
      acc[item.name].revenue += item.price * item.qty;
      return acc;
    }, {})
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon="💰"
          label="Total Balance"
          value={`$${balance.toFixed(2)}`}
          valueClass="text-emerald-400"
        />
        <StatCard
          icon="📦"
          label="Total Orders"
          value={normalizedOrders.length}
          valueClass="text-amber-400"
        />
        <StatCard
          icon="🧾"
          label="Subtotal Revenue"
          value={`$${subtotalRevenue.toFixed(2)}`}
          valueClass="text-sky-400"
        />
        <StatCard
          icon="💵"
          label="Tips Collected"
          value={`$${tipsRevenue.toFixed(2)}`}
          valueClass="text-amber-400"
        />
        <StatCard
          icon="📅"
          label="Today's Gross"
          value={`$${todayRevenue.toFixed(2)}`}
          valueClass="text-emerald-400"
        />
        <StatCard
          icon="✨"
          label="Today's Tips"
          value={`$${todayTips.toFixed(2)}`}
          valueClass="text-purple-400"
        />
        <StatCard
          icon="📊"
          label="Avg. Order"
          value={`$${avgOrder.toFixed(2)}`}
          valueClass="text-blue-400"
        />
        <StatCard
          icon="🪙"
          label="Avg. Tip"
          value={`$${avgTip.toFixed(2)}`}
          valueClass="text-amber-300"
        />
        <StatCard
          icon="💸"
          label="Gross Revenue"
          value={`$${grossRevenue.toFixed(2)}`}
          valueClass="text-emerald-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order History */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">🧾</span> Order History
          </h2>

          {normalizedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm">Completed orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {[...normalizedOrders].reverse().map((order) => (
                <div key={order.id} className="px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-800">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-semibold text-gray-100">{order.customer}</span>
                      {order.note && (
                        <span className="ml-2 text-xs text-gray-500 italic">"{order.note}"</span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-bold shrink-0">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="mb-1 text-xs text-gray-500 flex items-center gap-3 flex-wrap">
                    <span>Subtotal: ${order.subtotal.toFixed(2)}</span>
                    <span className="text-amber-400">Tip: ${order.tip.toFixed(2)}</span>
                    <span className="text-emerald-300">Total: ${order.total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    {order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                  </p>
                  <p className="text-xs text-gray-600">{new Date(order.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Items */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span> Top Selling Items
          </h2>

          {topItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-5xl mb-3">📈</p>
              <p className="text-lg font-medium">No data yet</p>
              <p className="text-sm">Complete orders to see your top items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => {
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div key={item.name} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-800">
                    <span className="text-xl w-8 text-center">{medals[i]}</span>
                    <span className="flex-1 font-medium text-gray-100">{item.name}</span>
                    <span className="text-gray-400 text-sm">{item.qty} sold</span>
                    <span className="text-emerald-400 font-bold">${item.revenue.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueClass }) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
      <span className={`text-2xl font-extrabold ${valueClass}`}>{value}</span>
    </div>
  );
}
