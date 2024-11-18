import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

// Sanitize user input
const sanitizeInput = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

interface FilterSearchProps {
  onFilterChange: (filters: { state: string; topic: string; search: string }) => void;
  subscriptions: { states: string[]; topics: string[] };
}

const FilterSearch: React.FC<FilterSearchProps> = ({ onFilterChange, subscriptions }) => {
  const [filters, setFilters] = useState({ state: '', topic: '', search: '' });
  const [states, setStates] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  useEffect(() => {
    setStates(subscriptions.states);
    setTopics(subscriptions.topics);
  }, [subscriptions]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setFilters({ ...filters, [name]: sanitizedValue });
  };

  const handleSearch = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const defaultFilters = { state: '', topic: '', search: '' };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Form className="mb-4">
      <Row className="g-2 align-items-end">
        <Col xs={12} md={3}>
          <Form.Group controlId="stateSelect">
            <Form.Label>State</Form.Label>
            <Form.Select name="state" value={filters.state} onChange={handleChange}>
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} md={3}>
          <Form.Group controlId="topicSelect">
            <Form.Label>Topic</Form.Label>
            <Form.Select name="topic" value={filters.topic} onChange={handleChange}>
              <option value="">Select Topic</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs={12} md={3}>
          <Form.Group controlId="searchInput">
            <Form.Label>Keyword</Form.Label>
            <Form.Control
              type="text"
              name="search"
              placeholder="Search"
              value={filters.search}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col xs={6} md={1} className="d-grid">
          <Button variant="primary" onClick={handleSearch}>
            Search
          </Button>
        </Col>

        <Col xs={6} md={1} className="d-grid">
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default FilterSearch;
