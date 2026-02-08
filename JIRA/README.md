# JIRA Intelligence Service

A microservice for fetching and syncing Jira issue data. It tracks issue status changes, cycle time, and workload distribution.

## Tech Stack
- **Runtime**: Node.js (TypeScript)
- **Integration**: Jira REST API
- **Scheduler**: node-cron

## Configuration
Environment Variables:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/engineering-intelligence
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=user@example.com
JIRA_API_TOKEN=...
```

## Running
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in Docker
docker build -t jira-service .
docker run -p 3000:3000 --env-file .env jira-service
```
