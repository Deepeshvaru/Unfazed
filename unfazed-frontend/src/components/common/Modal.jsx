function Modal({ title, children, onClose }) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default Modal;