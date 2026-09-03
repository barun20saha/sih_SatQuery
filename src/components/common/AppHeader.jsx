import { Link } from 'react-router-dom';

export default function AppHeader() {
  return (
    <header className="app-header" role="banner">
      <Link to="/" className="logo" aria-label="SatQuery AI — Home">
        <div className="logo__icon" aria-hidden="true">S</div>
        <span className="logo__text">
          Sat<span>Query</span> AI
        </span>
      </Link>
    </header>
  );
}
