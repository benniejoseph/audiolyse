import '../globals.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-brand">
          <div className="brand-icon">🎧</div>
          <h1>CallTranscribe</h1>
          <p>AI-Powered Call Analysis Platform</p>
        </div>
        {children}
      </div>
      <div className="auth-features">
        <h2>Why CallTranscribe?</h2>
        <ul>
          <li>
            <span className="feature-icon">📊</span>
            <div>
              <strong>Deep Analytics</strong>
              <p>Get detailed insights from every call with AI-powered analysis</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">🎯</span>
            <div>
              <strong>Coaching Scores</strong>
              <p>Improve team performance with actionable feedback</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">🔮</span>
            <div>
              <strong>Predictive Insights</strong>
              <p>Conversion probability, churn risk, and more</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">👥</span>
            <div>
              <strong>Team Management</strong>
              <p>Manage teams and track performance across your organization</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}


