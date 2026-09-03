import { useApp } from '../../context/AppContext';

export default function QueryInput() {
  const { query, setQuery } = useApp();

  return (
    <div className="query-section">
      <label className="query-section__label" htmlFor="query-textarea">
        Your Query
      </label>
      <textarea
        id="query-textarea"
        className="textarea"
        placeholder="Ask a question about these images... e.g., 'What changed between these images?' or 'Identify water bodies using optical and SAR'"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={5}
        maxLength={1000}
        aria-describedby="query-hint"
      />
      <p id="query-hint" className="text-xs text-muted" style={{ marginTop: '4px' }}>
        {query.length} / 1000 characters
      </p>
    </div>
  );
}
