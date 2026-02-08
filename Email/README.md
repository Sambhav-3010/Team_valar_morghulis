# Email Intelligence Service

A microservice that fetches email metadata from Gmail API and syncs it to the central MongoDB for analysis. It focuses on communication patterns without storing sensitive email bodies permanently (metadata only).

## Tech Stack
- **Runtime**: Node.js (TypeScript)
- **Integration**: Google APIs (Gmail)
- **Scheduler**: node-cron

## Configuration
Requires a Google Cloud Project with Gmail API enabled.
Environment Variables:
```bash
PORT=6000
MONGODB_URI=mongodb://localhost:27017/engineering-intelligence
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Running
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in Docker
docker build -t email-service .
docker run -p 6000:6000 -e PORT=6000 --env-file .env email-service
```
