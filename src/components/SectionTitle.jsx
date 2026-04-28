export function SectionTitle({ children, number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {number && (
        <span className="text-xs font-bold text-white px-2 py-1 rounded" style={{ background: '#1E3A5F' }}>
          {number}
        </span>
      )}
      <h2 className="text-base font-bold uppercase tracking-widest" style={{ color: '#1E3A5F', fontFamily: 'Montserrat' }}>
        {children}
      </h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
