export default function Input({ label, id, error, ...props }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} className={error ? 'input input-error' : 'input'} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
