import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
    </Modal>
  );
}
