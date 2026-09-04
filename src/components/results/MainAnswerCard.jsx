import Card from '../common/Card';

export default function MainAnswerCard({ answer, main_answer, mainAnswer }) {
  // Fall back across all possible key names from the backend/contract
  const displayText = main_answer || answer || mainAnswer || "No analysis result available.";

  return (
    <Card id="main-answer-card">
      <h1 className="card-heading">Analysis Result</h1>
      <p className="answer-card__text">{displayText}</p>
    </Card>
  );
}