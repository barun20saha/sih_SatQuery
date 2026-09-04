import { useApp } from '../../context/AppContext';
import VoiceInput from '../common/VoiceInput';

export default function QueryInput() {
  const { query, setQuery } = useApp();

  const handleTranscript = (spokenText) => {
    if (typeof spokenText === 'string') {
      setQuery((prev) => {
        const current = typeof prev === 'string' ? prev : '';
        return current ? `${current} ${spokenText}` : spokenText;
      });
    }
  };

  return (
    <div className="query-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label className="query-section__label" htmlFor="query-textarea" style={{ margin: 0 }}>
          Your Query
        </label>
        <VoiceInput onTranscript={handleTranscript} />
      </div>

      <textarea
        id="query-textarea"
        className="textarea"
        placeholder="Ask a question about these images... e.g., 'What changed between these images?' or 'Identify water bodies using optical and SAR'"
        value={typeof query === 'string' ? query : ''}
        onChange={(e) => setQuery(e.target.value)}
        rows={5}
        maxLength={1000}
        aria-describedby="query-hint"
      />
      <p id="query-hint" className="text-xs text-muted" style={{ marginTop: '4px' }}>
        {(typeof query === 'string' ? query : '').length} / 1000 characters
      </p>
    </div>
  );
}