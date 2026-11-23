import { useState } from 'react';
import { SectionTitle } from '../components/SectionTitle';

const BLOCKS = [
  { key: 'positive',        label: 'Положительная динамика',    variant: 'positive', placeholder: '• Добавь наблюдение...' },
  { key: 'attention',       label: 'Зоны внимания',              variant: 'warning',  placeholder: '• Добавь зону внимания...' },
  { key: 'recommendations', label: 'Приоритетные рекомендации',  variant: 'action',   placeholder: 'Добавь рекомендации...' },
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
    <div className="section-content">
      <SectionTitle number="05">Выводы и рекомендации</SectionTitle>
      <div className="conclusions-grid">
        {BLOCKS.map(b => (
          <div key={b.key} className={`conclusion-card conclusion-card--${b.variant}`}>
            <div className="conclusion-card-header">
              <h3 className="conclusion-card-title">{b.label}</h3>
              <button
                className="btn-save"
                onClick={() => setEditing(e => ({ ...e, [b.key]: !e[b.key] }))}
              >
                {editing[b.key] ? 'Сохранить' : 'Изменить'}
              </button>
            </div>
            {editing[b.key] ? (
              <textarea
                className="conclusion-textarea"
                value={values[b.key]}
                onChange={e => save(b.key, e.target.value)}
                placeholder={b.placeholder}
              />
            ) : (
              <div className={`conclusion-display${values[b.key] ? '' : ' conclusion-display--empty'}`}>
                {values[b.key] || b.placeholder}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
