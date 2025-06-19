import './AppFeatures.css'

export default function AppFeatures() {
  return (
    <div className="features-container">
      <h1>What Our App Offers</h1>
      <p>
        Packed with powerful tools designed to boost your productivity and streamline your workflow.
      </p>

      <hr className="divider" />

      <div className="feature-section">
        <h2>Real-Time Sync</h2>
        <p>Keep all your devices up to date instantly—no manual refresh needed.</p>
      </div>

      <hr className="divider" />

      <div className="feature-section">
        <h2>Secure by Design</h2>
        <p>Enterprise-grade encryption ensures your data stays private and protected.</p>
      </div>

      <hr className="divider" />

      <div className="feature-section">
        <h2>Offline Mode</h2>
        <p>Continue working even without internet—your changes sync when you're back online.</p>
      </div>

      <hr className="divider" />

      <div className="feature-section">
        <h2>Customizable Layouts</h2>
        <p>Tailor your dashboard with drag-and-drop widgets and adaptable themes.</p>
      </div>
    </div>
  );
}
