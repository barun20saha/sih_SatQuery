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

  return (
    <Card id="example-queries-card">
      <p className="card-subheading">Example questions you can ask:</p>
      <ul className="example-query-list">
        {EXAMPLES.map((ex) => (
          <li key={ex.text}>
            <button
              className="example-query-item"
              onClick={() => setQuery(ex.text)}
              aria-label={`Use example query: ${ex.text}`}
            >
              <span className="example-query-item__icon" aria-hidden="true">{ex.icon}</span>
              {ex.text}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
