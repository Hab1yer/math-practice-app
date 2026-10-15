export default function App() {
  return (
    <main className="welcome" aria-labelledby="app-title">
      <div className="math-marks" aria-hidden="true">
        <span>+</span>
        <span>−</span>
        <span>×</span>
        <span>÷</span>
      </div>
      <p className="eyebrow">A little practice. A world of possibility.</p>
      <h1 id="app-title">Math Practice</h1>
      <p className="intro">Big discoveries start with small steps.</p>
      <div className="note">
        <span className="note-marker" aria-hidden="true">
          01
        </span>
        <div>
          <h2>Our first step is ready.</h2>
          <p>
            The foundation is in place. Your math adventures are coming next!
          </p>
        </div>
      </div>
      <p className="footer-note">Made for curious minds.</p>
    </main>
  );
}
