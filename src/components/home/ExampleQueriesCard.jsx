import Card from '../common/Card';
import { useApp } from '../../context/AppContext';

const EXAMPLES = [
  { icon: '🔍', text: 'Describe this satellite image' },
  { icon: '🏗️', text: 'Where are the buildings?' },
  { icon: '🔄', text: 'What changed between these two images?' },
  { icon: '🌊', text: 'Use optical and SAR to identify water bodies' },
];

export default function ExampleQueriesCard() {
  const { setQuery } = useApp();

  const handleSelectQuery = (text) => {
    setQuery(text);
  };

  return (
    <Card id="example-queries-card">
      <p className="card-subheading">EXAMPLE QUESTIONS YOU CAN ASK:</p>
      <ul className="example-query-list" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0' }}>
        {EXAMPLES.map((ex) => (
          <li key={ex.text} style={{ marginBottom: '6px' }}>
            <button
              type="button"
              className="example-query-item"
              onClick={() => handleSelectQuery(ex.text)}
              aria-label={`Use example query: ${ex.text}`}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #e0e0e0)',
                background: 'var(--bg-secondary, #f8f9fa)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                transition: 'background-color 0.15s ease'
              }}
            >
              <span className="example-query-item__icon" aria-hidden="true">{ex.icon}</span>
              <span>{ex.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}