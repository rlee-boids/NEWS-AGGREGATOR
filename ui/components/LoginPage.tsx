import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Display rate-limit error
    if (router.query.error === 'rate-limit') {
      setErrorMessage('You have exceeded the maximum number of requests. Please log in again.');
    }
  }, [router.query.error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(''); // Clear any previous error message

    const response = await fetch('http://localhost:5000/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store user data in session storage, remove password!
      delete data.user.password;
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to homepage
      router.push('/home');
    } else {
      setErrorMessage('Invalid username or password. Please try again.');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center">Login</h2>

          {router.query.success && (
            <Alert variant="success" className="text-center">
              Registration successful! Please log in.
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="danger" className="text-center">
              {errorMessage}
            </Alert>
          )}

          <Form onSubmit={handleLogin}>
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

            <Button variant="primary" type="submit" className="w-100">
              Login
            </Button>
            <div className="text-center mt-3">
                <span>Don’t have an account? </span>
                <Link href="/register" passHref>
                Register here
                </Link>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
