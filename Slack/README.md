# Slack Intelligence Service

A Slack App backend that listens to message events and stores communication metadata for team collaboration analysis.

## Tech Stack
- **Runtime**: Node.js (TypeScript)
- **Integration**: Slack Events API (@slack/web-api)
- **Database**: MongoDB (Mongoose)

## Configuration
Requires a Slack App created in your workspace with Event Subscriptions enabled.
Environment Variables:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/engineering-intelligence
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
```

## Running
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in Docker
docker build -t slack-service .
docker run -p 3000:3000 --env-file .env slack-service
```
