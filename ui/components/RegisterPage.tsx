import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { topics, states } from '../constants/constants';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const router = useRouter();

  // Handle checkbox change for topic
  const handleTopicChange = (topic: string) => {
    setSelectedTopics((prevSelectedTopics) =>
      prevSelectedTopics.includes(topic)
        ? prevSelectedTopics.filter((t) => t !== topic) // Unselect if selected
        : [...prevSelectedTopics, topic] // Add to selection if not selected
    );
  };

  // Handle selection change for states
  const handleStatesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedStates(selectedOptions);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const registrationData = {
      username,
      password,
      states: selectedStates,
      topics: selectedTopics,
    };

    const response = await fetch('http://localhost:5000/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });

    if (response.ok) {
      router.push({
        pathname: '/',
        query: { success: 'true' }
      });
    } else {
      alert('Registration failed');
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center">Register</h2>
          <Form onSubmit={handleRegister}>
            <Form.Group controlId="formUsername" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="formPassword" className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="formTopics" className="mb-3">
              <Form.Label>Select Topics of Interest</Form.Label>
              {topics.map((topic) => (
                <Form.Check
                  key={topic}
                  type="checkbox"
                  label={topic}
                  value={topic}
                  checked={selectedTopics.includes(topic)}
                  onChange={() => handleTopicChange(topic)}
                />
              ))}
            </Form.Group>

            <Form.Group controlId="formStates" className="mb-3">
              <Form.Label>Select States</Form.Label>
              <Form.Select
                multiple
                value={selectedStates}
                onChange={handleStatesChange}
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col xs={6}>
                <Button variant="primary" type="submit" className="w-100">
                  Register
                </Button>
              </Col>
              <Col xs={6}>
                <Button variant="secondary" onClick={handleCancel} className="w-100">
                  Cancel
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
