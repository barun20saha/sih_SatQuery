import Card from '../common/Card';

export default function MainAnswerCard({ answer }) {
  return (
    <Card id="main-answer-card">
      <h1 className="card-heading">Analysis Result</h1>
      <p className="answer-card__text">{answer}</p>
    </Card>
  );
}
