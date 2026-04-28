import "../../components/css/Input.css";

const CONTROL_KEYS = [
  "Backspace", "Delete", "Tab", "Enter", "Escape",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End", "Control", "Meta", "Alt", "Shift",
  "CapsLock",
];

const ALLOWED_PATTERN = /^[a-zA-Z0-9\u00C0-\u017E._-]$/;

function Input({ label, type, name, errorMessage, required = false, value, onChange }) {
  const handleKeyDown = (e) => {
    // Autoriser les combinaisons clavier (Ctrl+A, Ctrl+C, etc.)
    if (e.ctrlKey || e.metaKey) return;
    // Autoriser les touches de contrôle
    if (CONTROL_KEYS.includes(e.key)) return;
    // Bloquer tout caractère non autorisé
    if (!ALLOWED_PATTERN.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="input-group">
      <label>{label}</label>

      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        onKeyDown={type === "password" || type === "email" ? undefined : handleKeyDown}
      />

      {errorMessage && <span className="error-message">{errorMessage}</span>}
    </div>
  );
}
export default Input;