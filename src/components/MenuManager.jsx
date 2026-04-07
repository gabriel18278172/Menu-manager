import { useState } from 'react';

export default function MenuManager({ menuItems, onAdd, onDelete, onEdit }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!name.trim()) { setError('Item name is required.'); return; }
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError('Enter a valid price.'); return; }
    onAdd({ name: name.trim(), price: parsedPrice, category: category.trim() || 'General' });
    setName('');
    setPrice('');
    setCategory('');
    setError('');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditCategory(item.category);
  };

  const saveEdit = (id) => {
    const parsedPrice = parseFloat(editPrice);
    if (!editName.trim() || isNaN(parsedPrice) || parsedPrice < 0) return;
    onEdit(id, { name: editName.trim(), price: parsedPrice, category: editCategory.trim() || 'General' });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // Group by category
  const grouped = menuItems.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add Item Form */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          <span className="text-2xl">🍽️</span> Add Menu Item
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-[2]"
            placeholder="Item name (e.g. Burger)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input flex-1"
            placeholder="Category (e.g. Mains)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
            <input
              className="input pl-7"
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">
            + Add Item
          </button>
        </form>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Menu Items List */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span> Menu
          <span className="badge bg-amber-500/20 text-amber-400 ml-1">{menuItems.length}</span>
        </h2>

        {menuItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-5xl mb-3">🍴</p>
            <p className="text-lg font-medium">No menu items yet</p>
            <p className="text-sm">Add your first item above to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 pl-1">{cat}</h3>
                <div className="divide-y divide-gray-800 rounded-xl overflow-hidden border border-gray-800">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-850 hover:bg-gray-800/60 transition px-4 py-3">
                      {editingId === item.id ? (
                        <>
                          <input
                            className="input flex-[2] py-1.5 text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <input
                            className="input flex-1 py-1.5 text-sm"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                          />
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              className="input pl-6 py-1.5 text-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                            />
                          </div>
                          <button onClick={() => saveEdit(item.id)} className="btn-primary text-sm py-1.5 px-3">Save</button>
                          <button onClick={cancelEdit} className="btn-secondary text-sm py-1.5 px-3">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className="flex-[2] font-medium text-gray-100">{item.name}</span>
                          <span className="flex-1 text-emerald-400 font-bold">${item.price.toFixed(2)}</span>
                          <button onClick={() => startEdit(item)} className="btn-secondary text-sm py-1.5 px-3">Edit</button>
                          <button onClick={() => onDelete(item.id)} className="btn-danger text-sm">Remove</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
