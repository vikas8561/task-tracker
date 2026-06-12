export default function ProgressBar({ value = 0, size = 'md', color }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className={`progress-bar-container progress-bar-${size}`}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${clampedValue}%`,
          ...(color ? { background: color } : {}),
        }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
