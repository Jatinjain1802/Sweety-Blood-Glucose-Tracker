import { Link } from "react-router-dom";
function Landing() {
    // Check if the user is already authenticated
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
    const isAuthenticated = Boolean(token);
    const userName = user.name || "User";

    return (
        <div className="landing-page">
            {/* Top Navigation Bar */}
            <header className="landing-nav">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-brand" aria-label="Sweety Home">
                        <span className="landing-brand-mark" aria-hidden="true">🌸</span>
                        <span>Sweety</span>
                    </Link>

                    {/* On-page section jump links */}
                    <nav className="landing-nav-links" aria-label="Main Navigation">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                    </nav>

                    {/* Navigation Actions: Dynamic based on auth status */}
                    <div className="landing-nav-actions">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="landing-button landing-button-small">
                                Dashboard ({userName}) <span aria-hidden="true">→</span>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="landing-login">
                                    Log in
                                </Link>
                                <Link to="/signup" className="landing-button landing-button-small">
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="landing-hero">
                    <div className="landing-hero-inner">
                        <div className="landing-hero-copy">
                            <div className="landing-eyebrow">
                                <span className="landing-eyebrow-dot" aria-hidden="true" />
                                A simpler way to track your health
                            </div>

                            <h1>
                                Understand your numbers.
                                <span> Take charge of your health.</span>
                            </h1>

                            <p>
                                Keep your blood glucose readings organised, follow your
                                progress, and get a clearer picture of your daily patterns
                                with Sweety.
                            </p>

                            <div className="landing-hero-actions">
                                {isAuthenticated ? (
                                    <Link to="/dashboard" className="landing-button">
                                        Open your dashboard <span aria-hidden="true">→</span>
                                    </Link>
                                ) : (
                                    <Link to="/signup" className="landing-button">
                                        Start tracking free <span aria-hidden="true">→</span>
                                    </Link>
                                )}
                                <a href="#features" className="landing-secondary-link">
                                    Explore features
                                </a>
                            </div>

                            <div className="landing-trust-note">
                                <span aria-hidden="true">✓</span>
                                <span>Your readings. Your account. Your private records.</span>
                            </div>
                        </div>

                        {/* Interactive UI Mockup Showcase */}
                        <div className="landing-preview-wrap">
                            <div className="landing-preview">
                                <div className="preview-topbar">
                                    <div>
                                        <span className="preview-overline">YOUR OVERVIEW</span>
                                        <h3>Daily summary</h3>
                                    </div>
                                    <span className="preview-date">Today</span>
                                </div>

                                <div className="preview-main-stat">
                                    <div>
                                        <span className="preview-stat-label">Average glucose</span>
                                        <div className="preview-stat-value">
                                            112 <small>mg/dL</small>
                                        </div>
                                    </div>
                                    <span className="preview-status" title="Glucose is in the optimal clinical target range">
                                        <span className="preview-status-dot" aria-hidden="true">●</span>
                                        In Target Range
                                    </span>
                                </div>

                                <div className="preview-divider" />

                                <div className="preview-metrics">
                                    <div>
                                        <span className="preview-metric-label">Highest</span>
                                        <strong>138</strong>
                                        <small>mg/dL</small>
                                    </div>
                                    <div>
                                        <span className="preview-metric-label">Lowest</span>
                                        <strong>89</strong>
                                        <small>mg/dL</small>
                                    </div>
                                    <div>
                                        <span className="preview-metric-label">Readings</span>
                                        <strong>4</strong>
                                        <small>today</small>
                                    </div>
                                </div>

                                <div className="preview-chart-heading">
                                    <strong>Reading history</strong>
                                    <span>Illustrative preview</span>
                                </div>

                                <div className="preview-chart">
                                    <div className="preview-chart-grid">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <svg
                                        viewBox="0 0 440 125"
                                        role="img"
                                        aria-label="Illustrative glucose trend line"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#e11d48" stopOpacity=".18" />
                                                <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M0 77 C45 65 55 83 95 57 S155 35 190 56 S255 82 290 48 S355 32 390 43 S420 36 440 23 L440 125 L0 125 Z"
                                            fill="url(#previewFill)"
                                        />
                                        <path
                                            d="M0 77 C45 65 55 83 95 57 S155 35 190 56 S255 82 290 48 S355 32 390 43 S420 36 440 23"
                                            fill="none"
                                            stroke="#e11d48"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <circle cx="95" cy="57" r="4.5" fill="#fff" stroke="#e11d48" strokeWidth="2.5" />
                                        <circle cx="190" cy="56" r="4.5" fill="#fff" stroke="#e11d48" strokeWidth="2.5" />
                                        <circle cx="290" cy="48" r="4.5" fill="#fff" stroke="#e11d48" strokeWidth="2.5" />
                                        <circle cx="440" cy="23" r="4.5" fill="#fff" stroke="#e11d48" strokeWidth="2.5" />
                                    </svg>
                                </div>

                                <div className="preview-chart-labels">
                                    <span>Morning</span>
                                    <span>Breakfast</span>
                                    <span>Lunch</span>
                                    <span>Dinner</span>
                                </div>
                            </div>

                            <div className="preview-floating-note">
                                <span className="preview-note-icon" aria-hidden="true">✓</span>
                                <span>
                                    <strong>Stay organised</strong>
                                    <small>One place for your readings</small>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="landing-features" id="features">
                    <div className="landing-section-heading">
                        <span className="landing-section-kicker">MADE FOR EVERYDAY USE</span>
                        <h2>Your health records, without the hassle.</h2>
                        <p>
                            Simple tools to help you record, review and understand your
                            glucose readings.
                        </p>
                    </div>

                    <div className="landing-feature-grid">
                        <article className="landing-feature-card">
                            <div className="landing-feature-icon" aria-hidden="true">01</div>
                            <h3>Easy daily tracking</h3>
                            <p>
                                Record readings by date and meal slot. Add, edit and manage
                                your entries in one organised place.
                            </p>
                        </article>

                        <article className="landing-feature-card">
                            <div className="landing-feature-icon" aria-hidden="true">02</div>
                            <h3>Clear visual trends</h3>
                            <p>
                                View your glucose history through charts and see how your
                                readings change over time.
                            </p>
                        </article>

                        <article className="landing-feature-card">
                            <div className="landing-feature-icon" aria-hidden="true">03</div>
                            <h3>Useful summaries</h3>
                            <p>
                                Review highest, lowest and average readings with daily and
                                monthly reports.
                            </p>
                        </article>
                    </div>
                </section>

                {/* How it Works Section */}
                <section className="landing-how" id="how-it-works">
                    <div className="landing-how-copy">
                        <span className="landing-section-kicker">GETTING STARTED</span>
                        <h2>A straightforward routine, made easier.</h2>
                        <p>
                            Sweety keeps the process simple, so you can spend less time
                            organising records and more time understanding them.
                        </p>
                    </div>

                    <div className="landing-steps">
                        <div className="landing-step">
                            <span aria-hidden="true">1</span>
                            <div>
                                <h3>Create your account</h3>
                                <p>Sign up for your personal glucose tracking space.</p>
                            </div>
                        </div>
                        <div className="landing-step">
                            <span aria-hidden="true">2</span>
                            <div>
                                <h3>Record your readings</h3>
                                <p>Add your measurements under the relevant daily slot.</p>
                            </div>
                        </div>
                        <div className="landing-step">
                            <span aria-hidden="true">3</span>
                            <div>
                                <h3>Review your progress</h3>
                                <p>Use reports and charts to look back at your records.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="landing-cta">
                    <div>
                        <span className="landing-section-kicker">A GOOD PLACE TO BEGIN</span>
                        <h2>Make tracking part of your routine.</h2>
                        <p>Create your account and keep your readings organised with Sweety.</p>
                    </div>
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="landing-button landing-cta-button">
                            Go to dashboard <span aria-hidden="true">→</span>
                        </Link>
                    ) : (
                        <Link to="/signup" className="landing-button landing-cta-button">
                            Create your account <span aria-hidden="true">→</span>
                        </Link>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="landing-footer">
                <Link to="/" className="landing-brand" aria-label="Sweety Home">
                    <span className="landing-brand-mark" aria-hidden="true">🌸</span>
                    <span>Sweety</span>
                </Link>
                <p>Small steps towards better health awareness.</p>
                <span>© {new Date().getFullYear()} Sweety</span>
            </footer>
        </div>
    );
}

export default Landing;
