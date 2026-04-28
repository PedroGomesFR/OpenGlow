import "../../components/css/Input.css";

function Input({ label, type, name, errorMessage, required = false, value, onChange }) {
  return (
    <div className="input-group">
      <label>{label}</label>

      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
      />

      {errorMessage && <span className="error-message">{errorMessage}</span>}
    </div>
  );
}
export default Input;