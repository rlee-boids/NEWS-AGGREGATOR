# NEWS AGGREGATOR

## Project Overview

The News Aggregator is a web application designed to aggregate, filter, and personalize news articles related to state and topics of interest. It provides users with the ability to view news, subscribe to updates, and receive notifications.

### Key Features:
1. Filter and search news by state, topic, and keywords.
2. Subscribe to states and topics of interest for personalized updates.
3. Real-time notifications for new articles matching subscriptions.
4. Responsive design suitable for desktop and mobile.

## Tech Stack

### Back-End:
- Node.js
- SQLite
- TypeScript
- RESTful APIs

### Front-End:
- Next.js
- React-Bootstrap

### Utilities:
- EventEmitter for notifications
- Rate-limiter-flexible for API rate-limiting

## Setup Instructions

1. Clone Repository:
   ```bash
   git clone https://github.com/rlee-boids/NEWS-AGGREGATOR.git
   cd news-aggregator
   ```

2. Install Dependencies:
   ```bash
   cd server
   npm install
   cd ui
   npm install  
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the project root and set the following:
   ```
   NEWS_API_KEY=<your_news_api_key>
   PORT=5000
   ```

4. Initialize the Database:
   - Ensure `news.db` exists in the project root. 
   - Optionally run the initialization script:
     ```bash
     node init_db.mjs
     ```

5. Start Development Server:
   ```bash
   cd server
   npm run dev
   cd ui
   npm run dev
   ```

6. Access the Application:
   - Front-End: http://localhost:3000
   - Back-End API: http://localhost:5000

## Project Structure

- `pages/`: Next.js pages for routing (`/home`, `/subscriptions`, `/login`).
- `routes/`: Router for news, subscriptions, and users.
- `components/`: React components (NewsList, FilterSearch).
- `controllers/`: Controllers for news, subscriptions, and user management.
- `models/`: Database models for managing users, news, and subscriptions.
- `middleware/`: Middleware for rate limit.
- `utils/`: Utility files for caching, notifications, and helper functions.
- `db/`: SQLite database initialization and connection handling.

## API Endpoints

### News:
- `GET /news?state=x&topic=y&search=keyword&page=n&limit=i`: Filter, search and pagination.
- `GET /news/:id`: Get specific news article by ID.
- `POST /news`: Create specific news article.

### Subscriptions:
- `GET /subscriptions?userId=x`: Fetch user subscriptions.
- `POST /news/subscribe`: Add or update user subscriptions.

### Get News from External:
- `GET /news/external`: Get news from external sources.

### Authentication:
- `POST /register`: Register new user.
- `POST /login`: Login.

## Scalability and Performance

### Indexed Database:
- News table indexed on `state`, `topic`, and `date` for quick queries.
- Subscriptions table indexed on `userId`, `state`, and `topic`.
- Users table indexed on `userName`.

### Caching:
- In-memory caching for news list with a TTL of 10 minutes.

### Rate-Limiting:
- Limits excessive API requests to prevent abuse.

### Scrolling Pagination:
- Large datasets are paginated for optimal performance.

## System Design Considerations

### Aggregating News Articles
The system aggregates news articles from multiple external sources (NewsAPI) using a combination of user-specified states, topics, and optional search terms. Below is a breakdown of the process:

#### Query Construction:
The query combines states, topics, and an optional search term using logical OR. This ensures that the query fetches articles related to any of these parameters.

#### Determining Time Range:
The system keeps track of the latest publication dates for articles stored in the database (per state and topic). When fetching new articles, it uses the earliest recorded date as the starting point to minimize duplicate fetches.

#### External API Call:
The system makes a call to the external API (NewsAPI) with the constructed query and date filters. API parameters include language, sorting order (publishedAt), and pagination size (100 articles per page).

### Handling Deduplication

#### Filtering Duplicate Articles:
Before storing articles in the database, the system checks the existence of articles with the same state, topic, and publication date.
Only articles that are newer than the latest stored article for a specific state/topic combination are added to the database.

#### Using Combined Keys:
Articles are uniquely identified using a combination of state, topic, and date. This prevents duplicate entries across fetch operations.

### Storing Articles

#### Database Schema:
Articles are stored in a SQLite database with the following schema:
```sql
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  summary TEXT,
  state TEXT,
  topic TEXT,
  date TEXT,
  link TEXT
);
```
Additional indices (on state, topic, and date) are used to speed up query operations.

### Ensuring Fresh Data

#### Cron Job Integration:
A scheduled cron job fetches new articles periodically by querying the external API based on distinct states and topics from user subscriptions. This ensures fresh data is available even if users do not actively initiate requests.

#### User-Specific Updates:
When a user subscribes to new states or topics, a pre-fetch operation is triggered to ensure their news feed reflects the latest articles.

#### Cache System:
Articles are cached in memory for a short duration (10 minutes) to reduce database queries for repeated requests. Cached articles are invalidated if new data is fetched or if a user updates their subscription.

## Scalability Considerations

### Indexing:
- Use single-column and composite indexes for filtering.
- Implement full-text search for keywords.

### Storage Strategies:
- Normalize schema and partition large tables.
- Archive old data and cache frequently accessed results.

### Ensuring Fresh Data:
- Use incremental updates and scheduled fetches.
- Consider webhook/event-driven updates for real-time freshness.

### Search Optimization:

#### Query Optimization:
- Use pagination, filtering, and efficient SELECT statements.

#### Preprocessing:
- Normalize and preprocess data for faster queries.

#### Scaling:
- Implement sharding, replication, or search engines for distributed systems.

#### Real-Time Updates:
- Maintain fresh and up-to-date indexes with event-driven architectures.
