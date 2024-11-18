import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';

interface Article {
  id: number;
  title: string;
  summary: string;
  state: string;
  topic: string;
  date: string;
}

interface NewsListProps {
  articles: Article[];
  onArticleClick: (id: number) => void;
}

const NewsList: React.FC<NewsListProps> = ({ articles, onArticleClick }) => {
  return (
    <Row xs={1} md={2} lg={3} className="g-4">
      {articles.map((article) => (
        <Col key={article.id}>
          <Card className="h-100" onClick={() => onArticleClick(article.id)} style={{ cursor: 'pointer' }}>
            <Card.Body>
              <Card.Title>{article.title}</Card.Title>
              <Card.Text>{article.summary}</Card.Text>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                {article.state} - {article.topic} - {new Date(article.date).toLocaleDateString()}
              </small>
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default NewsList;
