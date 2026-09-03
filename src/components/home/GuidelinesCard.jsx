import Card from '../common/Card';

const GUIDELINES = [
  'GeoTIFF files preserve geolocation data and enable region detection',
  'Bi-temporal queries need two time-ordered images',
  'Optical + SAR requires both modalities (name one file with "sar" or "radar")',
  'Higher resolution images (GSD ≤ 10m) yield more precise results',
];

export default function GuidelinesCard() {
  return (
    <Card id="guidelines-card">
      <p className="card-subheading">Guidelines</p>
      <ul className="guideline-list">
        {GUIDELINES.map((g) => (
          <li key={g} className="guideline-item">{g}</li>
        ))}
      </ul>
    </Card>
  );
}
