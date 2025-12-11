'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="home-link">
          Go Back Home
        </Link>
      </div>
      <style jsx>{`
        .not-found-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          color: var(--text);
          text-align: center;
          padding: 20px;
        }
        .not-found-content {
          max-width: 500px;
        }
        h1 {
          font-size: 8rem;
          margin: 0;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        h2 {
          font-size: 2rem;
          margin: 1rem 0;
        }
        p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        .home-link {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .home-link:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
