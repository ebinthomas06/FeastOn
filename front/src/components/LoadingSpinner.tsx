export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="d-flex align-items-center justify-content-center py-3">
      <div
        className="spinner-border text-success"
        role="status"
        aria-live="polite"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {label && <span className="ms-2 text-muted">{label}</span>}
    </div>
  );
}
