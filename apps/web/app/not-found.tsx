import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">404</span>
        <h1>That system does not exist.</h1>
        <p className="hero-copy">The page you requested could not be found. Return to the Tinlance home page and continue from there.</p>
        <div className="hero-actions">
          <Link className="button button-dark" href="/">Back home</Link>
        </div>
      </div>
    </section>
  );
}
