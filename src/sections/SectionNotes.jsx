import { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';

const BLOCKS = [
  { key: 'positive',        label: 'Положительная динамика',       placeholder: '• Добавь наблюдение...' },
  { key: 'attention',       label: 'Зоны внимания',                 placeholder: '• Добавь зону внимания...' },
  { key: 'recommendations', label: 'Приоритетные рекомендации',     placeholder: 'Добавь рекомендации...' },
];

export function SectionNotes() {
  const [values, setValues] = useState(() => {
    const saved = localStorage.getItem('liberty_notes');
    return saved ? JSON.parse(saved) : { positive: '', attention: '', recommendations: '' };
  });
  const [editing, setEditing] = useState({});

  const save = (key, val) => {
    const next = { ...values, [key]: val };
    setValues(next);
    localStorage.setItem('liberty_notes', JSON.stringify(next));
  };

  return (
    <div className="p-8 space-y-6">
      <SectionTitle number="05">Выводы и рекомендации</SectionTitle>
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {BLOCKS.map(b => (
          <div key={b.key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Montserrat' }}>{b.label}</h3>
              <button
                className="text-xs px-3 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                onClick={() => setEditing(e => ({ ...e, [b.key]: !e[b.key] }))}
              >
                {editing[b.key] ? 'Сохранить' : 'Редактировать'}
              </button>
            </div>
            {editing[b.key] ? (
              <textarea
                className="w-full min-h-32 p-3 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:border-blue-400"
                value={values[b.key]}
                onChange={e => save(b.key, e.target.value)}
                placeholder={b.placeholder}
              />
            ) : (
              <div className="text-sm text-gray-600 whitespace-pre-wrap min-h-8">
                {values[b.key] || <span className="text-gray-300 italic">{b.placeholder}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
