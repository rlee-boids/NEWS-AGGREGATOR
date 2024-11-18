import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import NewsDetails from '../components/NewsDetails';

export default function ArticlePage() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/news/${id}`)
        .then(response => response.json())
        .then(data => {
          console.log(data)
          setArticle(data)});
    }
  }, [id]);

  return (
    article ? <NewsDetails article={article} /> : <p>Loading...</p>
  );
}
