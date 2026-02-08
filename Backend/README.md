# Backend Service

The core backend service for the Engineering Intelligence Platform. It aggregates data from various sources (GitHub, Jira, Slack, Email), transforms it into a unified schema, and provides analytics APIs.

## Tech Stack
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)

## Features
- **Data Ingestion**: Webhooks and polling for GitHub, Jira, Slack.
- **Transformation Pipeline**: Normalizes raw data into `Activity` and `Identity` models.
- **Analytics Engine**: Calculates DORA metrics, team velocity, and generates AI-driven insights.

## Setup
### Prerequisites
- Node.js v18+
- MongoDB instance

### Environment Variables
Create a `.env` file with:
```bash
PORT=3001
MONGO_URI=mongodb://localhost:27017/engineering-intelligence
```

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

### Scripts
- `npm run dev`: Start development server.
- `npm run build`: Compile TypeScript.
- `npm start`: Run production build.
- `npx ts-node scripts/seedData.ts`: Seed mock data.
- `npx ts-node scripts/runPipeline.ts`: Manual trigger for data transformation pipeline.
