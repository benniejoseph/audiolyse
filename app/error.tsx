'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-content">
        <h1>Something went wrong!</h1>
        <p>We apologize for the inconvenience. An unexpected error has occurred.</p>
        <button onClick={reset} className="retry-btn">
          Try again
        </button>
      </div>
      <style jsx>{`
        .error-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--text);
          text-align: center;
          padding: 20px;
        }
        .error-content {
          max-width: 500px;
          padding: 40px;
          background: var(--card);
          border-radius: 16px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        h1 {
          font-size: 2rem;
          margin: 0 0 1rem;
          background: linear-gradient(135deg, var(--danger), #ff6b6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        .retry-btn {
          padding: 12px 24px;
          background: var(--card-hover);
          color: var(--text);
          border: 1px solid var(--accent);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .retry-btn:hover {
          background: var(--accent);
          color: white;
        }
      `}</style>
    </div>
  );
}
