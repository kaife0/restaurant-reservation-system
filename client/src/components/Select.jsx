export default function Select({ label, id, options, ...props }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} className="input" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
