import React from 'react';

interface NewsDetailsProps {
  article: {
    title: string;
    summary: string;
    state: string;
    topic: string;
    date: string;
    link: string;
  };
}

const NewsDetails: React.FC<NewsDetailsProps> = ({ article }) => {
  const handleBackClick = () => {
    window.history.back(); // Back to the previous page
  };

  return (
    <div className="container mt-4">
      <button
        onClick={handleBackClick}
        className="btn btn-link mb-3"
        style={{ textDecoration: 'none', fontSize: '16px' }}
      >
        ← Back
      </button>

      <div className="card">
        <div className="card-body">
          <h1 className="card-title">{article.title}</h1>
          <p className="card-text">{article.summary}</p>
          <p className="card-text"><strong>State:</strong> {article.state}</p>
          <p className="card-text"><strong>Topic:</strong> {article.topic}</p>
          <p className="card-text"><strong>Date:</strong> {new Date(article.date).toLocaleDateString()}</p>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Read Full Article
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsDetails;
