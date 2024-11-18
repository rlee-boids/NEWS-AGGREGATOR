import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { topics, states } from '../constants/constants'; 

const SubscriptionPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  // Load user info from session store
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  // Fetch user subscriptions
  useEffect(() => {
    if (!user) return;

    const fetchSubscriptions = async () => {
      try {
        const subscriptionsResponse = await fetch(`http://localhost:5000/subscriptions?userId=${user.id}`);
        const subscriptionsData = await subscriptionsResponse.json();
        setSelectedStates(subscriptionsData.states || []);
        setSelectedTopics(subscriptionsData.topics || []);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      }
    };

    fetchSubscriptions();
  }, [user]);

  // Handle state checkbox changes
  const handleStateChange = (state: string) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  // Handle topic checkbox changes
  const handleTopicChange = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // Save updated subscriptions
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/news/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          states: selectedStates,
          topics: selectedTopics,
        }),
      });

      if (response.ok) {
        setMessage('Subscriptions updated successfully!');
        router.push({
          pathname: '/',
          query: {
            state: selectedStates.join(','),
            topic: selectedTopics.join(','),
          },
        });
      } else {
        setMessage('Failed to update subscriptions.');
      }
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      setMessage('An error occurred while saving subscriptions.');
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div>
      <button
        onClick={handleBackClick}
        className="btn btn-link mb-3"
        style={{ textDecoration: 'none', fontSize: '16px' }}
      >
        ← Back
      </button>

      <h1>Manage Subscriptions</h1>
      {message && <Alert variant="info">{message}</Alert>}

      <Form>
        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Select States</Form.Label>
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  padding: '10px',
                }}
              >
                {states.map((state) => (
                  <Form.Check
                    key={state}
                    type="checkbox"
                    label={state}
                    checked={selectedStates.includes(state)}
                    onChange={() => handleStateChange(state)}
                  />
                ))}
              </div>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>Select Topics</Form.Label>
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  padding: '10px',
                }}
              >
                {topics.map((topic) => (
                  <Form.Check
                    key={topic}
                    type="checkbox"
                    label={topic}
                    checked={selectedTopics.includes(topic)}
                    onChange={() => handleTopicChange(topic)}
                  />
                ))}
              </div>
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" className="mt-3" onClick={handleSave}>
          Save Changes
        </Button>
      </Form>
    </div>
  );
};

export default SubscriptionPage;
