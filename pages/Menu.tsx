import React, { useEffect, useMemo, useState } from 'react';
import {
  Leaf,
  UtensilsCrossed,
  Cake,
  Wine,
  Coffee,
  Sandwich,
  Plus,
  Trash2,
  Pencil,
  LogIn,
  LogOut,
} from 'lucide-react';
import { MenuCategory, MenuItem } from '../types';
import { supabase } from '../supabaseClient';

type IconKey = 'Leaf' | 'UtensilsCrossed' | 'Cake' | 'Wine' | 'Coffee' | 'Sandwich';

const COURSE_TYPES = [
  { value: 'Appetizer', label: 'Appetizer', iconKey: 'Leaf' as IconKey },
  { value: 'Main Course', label: 'Main Course', iconKey: 'UtensilsCrossed' as IconKey },
  { value: 'Dessert', label: 'Dessert', iconKey: 'Cake' as IconKey },
  { value: 'Snack', label: 'Snack', iconKey: 'Sandwich' as IconKey },
  { value: 'Beverage', label: 'Beverage', iconKey: 'Wine' as IconKey },
];

const ICON_MAP: Record<IconKey, { label: string; icon: React.ElementType; colorClass: string }> = {
  Leaf: { label: 'Leaf', icon: Leaf, colorClass: 'text-emerald-500 bg-emerald-500/10' },
  UtensilsCrossed: { label: 'Utensils', icon: UtensilsCrossed, colorClass: 'text-amber-600 bg-amber-600/10' },
  Cake: { label: 'Cake', icon: Cake, colorClass: 'text-pink-500 bg-pink-500/10' },
  Wine: { label: 'Wine', icon: Wine, colorClass: 'text-red-500 bg-red-500/10' },
  Coffee: { label: 'Coffee', icon: Coffee, colorClass: 'text-orange-500 bg-orange-500/10' },
  Sandwich: { label: 'Sandwich', icon: Sandwich, colorClass: 'text-sky-500 bg-sky-500/10' },
};

interface MenuCategoryWithIds extends MenuCategory {
  id: string;
  iconKey: IconKey;
  items: (MenuItem & { id?: string })[];
}

const Menu: React.FC = () => {
  const [menu, setMenu] = useState<MenuCategoryWithIds[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newItem, setNewItem] = useState<{ name: string; description: string; courseType: string }>({
    name: '',
    description: '',
    courseType: COURSE_TYPES[0].value,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const adminUser = import.meta.env.VITE_ADMIN_USER;
  const adminPass = import.meta.env.VITE_ADMIN_PASS;
  const isAdminConfigured = useMemo(() => Boolean(adminUser && adminPass), [adminUser, adminPass]);

  const fetchMenu = async () => {
    if (!supabase) {
      setAuthError('Supabase not configured.');
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('menu_categories')
      .select('id, title, icon_key, menu_items(id, name, description)')
      .order('created_at', { ascending: true })
      .order('created_at', { foreignTable: 'menu_items', ascending: true });

    if (error) {
      setAuthError(error.message);
    } else if (data) {
      const mapped: MenuCategoryWithIds[] = data.map((cat: any) => {
        const iconDef = ICON_MAP[(cat.icon_key as IconKey) || 'Leaf'] || ICON_MAP.Leaf;
        return {
          id: cat.id,
          title: cat.title,
          iconKey: cat.icon_key as IconKey,
          icon: iconDef.icon,
          colorClass: iconDef.colorClass,
          items: (cat.menu_items || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            description: i.description,
          })),
        };
      });
      setMenu(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminConfigured) {
      setAuthError('Set VITE_ADMIN_USER dan VITE_ADMIN_PASS di .env.local.');
      return;
    }
    if (loginForm.username === adminUser && loginForm.password === adminPass) {
      setIsAdmin(true);
      setAuthError(null);
      setLoginForm({ username: '', password: '' });
    } else {
      setAuthError('Invalid admin username or password.');
    }
  };

  const ensureCategory = async (title: string, iconKey: IconKey) => {
    const existing = menu.find((c) => c.title === title);
    if (existing) return existing.id;
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({ title, icon_key: iconKey })
      .select()
      .single();
    if (error) throw error;
    const iconDef = ICON_MAP[iconKey];
    const newCat: MenuCategoryWithIds = {
      id: data.id,
      title: data.title,
      iconKey,
      icon: iconDef.icon,
      colorClass: iconDef.colorClass,
      items: [],
    };
    setMenu((prev) => [...prev, newCat]);
    return data.id as string;
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.description.trim()) return;
    if (!supabase) {
      setAuthError('Supabase not configured.');
      return;
    }
    const course = COURSE_TYPES.find((c) => c.value === newItem.courseType) || COURSE_TYPES[0];
    const categoryId = await ensureCategory(course.label, course.iconKey);
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category_id: categoryId,
        name: newItem.name.trim(),
        description: newItem.description.trim(),
      })
      .select()
      .single();
    if (error) {
      setAuthError(error.message);
      return;
    }
    setMenu((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: [...cat.items, { name: newItem.name.trim(), description: newItem.description.trim(), id: data.id }] }
          : cat
      )
    );
    setNewItem({ name: '', description: '', courseType: COURSE_TYPES[0].value });
  };

  const handleDeleteItem = async (categoryId: string, itemId?: string, index?: number) => {
    if (!itemId || !supabase) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', itemId);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setMenu((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((_, idx) => idx !== index) }
          : cat
      )
    );
  };

  const handleEditItem = async (categoryId: string, index: number, field: 'name' | 'description') => {
    const category = menu.find((c) => c.id === categoryId);
    const item = category?.items[index];
    if (!category || !item?.id || !supabase) return;
    const val = window.prompt(`Update ${field}`, item[field] || '');
    if (val === null) return;
    const { error } = await supabase.from('menu_items').update({ [field]: val }).eq('id', item.id);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setMenu((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((itm, idx) => (idx === index ? { ...itm, [field]: val } : itm)),
            }
          : cat
      )
    );
  };

  const renderCategory = (category: MenuCategoryWithIds, idx: number) => (
    <div key={category.id} className={`flex flex-col gap-4 ${idx === 1 ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2 px-2 flex-1">
          {category.title}
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100">
          {category.items.map((item, itemIdx) => (
            <div
              key={item.id || `${item.name}-${itemIdx}`}
              className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${category.colorClass}`}
                >
                  <category.icon size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                      {item.name}
                    </h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleEditItem(category.id, itemIdx, 'name')}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.description}{' '}
                    {isAdmin && (
                      <button
                        onClick={() => handleEditItem(category.id, itemIdx, 'description')}
                        className="text-xs text-blue-600 hover:underline ml-2"
                      >
                        Edit
                      </button>
                    )}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => handleDeleteItem(category.id, item.id, itemIdx)}
                    className="text-xs text-red-600 font-semibold hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {category.items.length === 0 && (
            <div className="p-5 text-sm text-gray-400">No items yet.</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 py-10 max-w-5xl mx-auto px-4 w-full">
      {/* Header */}
      <div className="text-center space-y-4 mb-4">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight font-display">
          Christmas Lunch Menu
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-sans">
          A festive feast to celebrate the season. Please let us know of any dietary requirements
          when you RSVP.
        </p>
      </div>

      {/* Admin login + add item */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {isAdmin ? <LogOut size={18} /> : <LogIn size={18} />}
          <span>{isAdmin ? 'Admin mode enabled' : 'Admin login'}</span>
        </div>
        {isAdmin ? (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>You can add, edit, or delete menu items.</span>
            <button
              onClick={() => {
                setIsAdmin(false);
                setAuthError(null);
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              Log out
            </button>
          </div>
        ) : (
          <form className="grid grid-cols-1 sm:grid-cols-3 gap-3" onSubmit={handleAdminLogin}>
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        )}
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        {!isAdminConfigured && (
          <p className="text-xs text-amber-600">
            Admin credentials not set. Add VITE_ADMIN_USER and VITE_ADMIN_PASS in .env.local.
          </p>
        )}

        {isAdmin && (
          <div className="border-t border-gray-200 pt-4 grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-gray-800">Add Menu Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Dish name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <select
                  value={newItem.courseType}
                  onChange={(e) => setNewItem({ ...newItem, courseType: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {COURSE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-20"
              />
              <button
                onClick={handleAddItem}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="w-full border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500 bg-white">
          Loading menu...
        </div>
      ) : menu.length === 0 ? (
        <div className="w-full border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500 bg-white">
          No menu items yet. {isAdmin ? 'Add a dish to get started.' : 'Admin can add menu items soon.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menu.map((category, idx) => renderCategory(category, idx))}
        </div>
      )}

      {/* Dietary Legend */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="font-bold text-gray-800">Dietary Information</h3>
          <p className="text-xs text-gray-400 mt-2">
            For severe allergies, please contact the committee directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
