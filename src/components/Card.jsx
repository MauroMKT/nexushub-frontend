export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-sm border border-slate-100 p-5 ${className}`}>
      {children}
    </div>
  );
}
