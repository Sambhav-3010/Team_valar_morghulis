# GitHub App Analytics Backend

Production-ready GitHub App backend in Node.js with TypeScript using Octokit.js for collecting engineering analytics data across multiple organizations and repositories.

## Features

✅ **GitHub App Authentication** - JWT tokens and installation access tokens with caching  
✅ **OAuth Flow** - Complete installation flow for organizations  
✅ **Webhook Handling** - Real-time event ingestion for push, PR, issues, workflows, and checks  
✅ **Data Collection APIs** - REST endpoints for repositories, commits, PRs, issues, and workflows  
✅ **Database Layer** - Generic repository pattern (swap Prisma/MongoDB easily)  
✅ **Security** - Webhook signature verification, error handling, rate limiting  
✅ **Production Ready** - TypeScript, retry logic, pagination, logging

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **GitHub SDK**: @octokit/app, @octokit/rest, @octokit/webhooks
- **Database**: Generic interface (Prisma/MongoDB compatible)

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **GitHub App** created in GitHub developer settings

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create GitHub App

1. Go to https://github.com/settings/apps/new
2. Fill in the following:
   - **GitHub App name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Webhook URL**: `http://localhost:3000/webhook` (use ngrok for testing)
   - **Webhook secret**: Generate a random string
   - **Permissions** (Repository permissions):
     - Contents: Read-only
     - Issues: Read-only
     - Pull requests: Read-only
     - Metadata: Read-only
     - Workflows: Read-only
   - **Subscribe to events**:
     - Push
     - Pull request
     - Issues
     - Workflow run
     - Check suite
     - Check run
3. Generate a private key and download it
4. Install the app on your organization or repositories

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your GitHub App credentials:

```env
NODE_ENV=development
PORT=3000

# From your GitHub App settings
APP_ID=123456
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END RSA PRIVATE KEY-----"
WEBHOOK_SECRET=your_webhook_secret
CLIENT_ID=Iv1.your_client_id
CLIENT_SECRET=your_client_secret

OAUTH_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

**Note**: For the private key, replace newlines with `\n` or paste the entire key as-is.

### 4. Run the Application

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

### 5. Test the Installation

```bash
# Health check
curl http://localhost:3000/health

# Start OAuth flow (visit in browser)
open http://localhost:3000/auth/github
```

## API Documentation

### Authentication Endpoints

#### Start OAuth Flow
```bash
GET /auth/github
```
Redirects to GitHub App installation page.

#### OAuth Callback
```bash
GET /auth/github/callback?installation_id={id}
```
Handles OAuth callback after installation.

#### List Installations
```bash
curl http://localhost:3000/auth/installations
```

### Webhook Endpoint

```bash
POST /webhook
```
Receives GitHub webhooks. Must include `X-Hub-Signature-256` header for verification.

### Data Collection APIs

#### Get All Repositories
```bash
curl "http://localhost:3000/api/repos?page=1&perPage=30"
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `perPage` (optional) - Items per page (default: 30)

#### Get Commits
```bash
curl "http://localhost:3000/api/repos/owner/repo/commits?page=1&perPage=30&since=2024-01-01"
```

**Query Parameters:**
- `page`, `perPage` - Pagination
- `since` - ISO 8601 date (commits after this date)
- `until` - ISO 8601 date (commits before this date)
- `author` - Filter by author username
- `path` - Filter by file path

#### Get Pull Requests
```bash
curl "http://localhost:3000/api/repos/owner/repo/pull-requests?state=all&page=1"
```

**Query Parameters:**
- `page`, `perPage` - Pagination
- `state` - `open`, `closed`, or `all` (default: `all`)
- `head` - Filter by head branch
- `base` - Filter by base branch

#### Get Issues
```bash
curl "http://localhost:3000/api/repos/owner/repo/issues?state=open&labels=bug"
```

**Query Parameters:**
- `page`, `perPage` - Pagination
- `state` - `open`, `closed`, or `all`
- `labels` - Comma-separated label names
- `assignee` - Filter by assignee username
- `creator` - Filter by creator username
- `since` - ISO 8601 date

#### Get Workflow Runs
```bash
curl "http://localhost:3000/api/repos/owner/repo/workflows?status=completed&branch=main"
```

**Query Parameters:**
- `page`, `perPage` - Pagination
- `status` - `queued`, `in_progress`, or `completed`
- `branch` - Filter by branch name
- `event` - Filter by event type
- `actor` - Filter by actor username

## Project Structure

```
githubapp/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── services/
│   │   ├── github/
│   │   │   ├── auth.ts         # GitHub authentication
│   │   │   ├── webhooks.ts     # Webhook handling
│   │   │   └── api.ts          # GitHub API client
│   │   └── database/
│   │       ├── repositories/   # Database repositories
│   │       └── index.ts        # Database connection
│   ├── controllers/
│   │   ├── auth.controller.ts  # OAuth endpoints
│   │   ├── webhook.controller.ts
│   │   └── api.controller.ts   # Data collection endpoints
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── auth.middleware.ts
│   ├── types/
│   │   ├── github.types.ts     # GitHub API types
│   │   ├── database.types.ts   # Database models
│   │   └── api.types.ts        # API types
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── cache.ts
│   │   └── retry.ts
│   ├── routes/
│   │   └── index.ts
│   └── index.ts                # Application entry
├── package.json
├── tsconfig.json
└── .env.example
```

## Database Integration

The application uses a **generic repository pattern** with in-memory storage by default. To integrate a real database:

### Option 1: Prisma + PostgreSQL

1. Install Prisma:
```bash
npm install prisma @prisma/client
npx prisma init
```

2. Define your schema in `prisma/schema.prisma`

3. Replace repository implementations in `src/services/database/repositories/`

4. Update `src/services/database/index.ts` with Prisma client

### Option 2: MongoDB + Mongoose

1. Install Mongoose:
```bash
npm install mongoose
```

2. Create Mongoose models based on interfaces in `src/types/database.types.ts`

3. Replace repository implementations

4. Update database initialization in `src/services/database/index.ts`

## Development

### Type Checking
```bash
npm run type-check
```

### Build
```bash
npm run build
```

## Testing with ngrok

For webhook testing, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Update your GitHub App webhook URL with the ngrok URL
# https://your-ngrok-url.ngrok.io/webhook
```

## Security Features

- ✅ Webhook signature verification using `WEBHOOK_SECRET`
- ✅ Environment variable validation on startup
- ✅ Error handling and logging
- ✅ Rate limit handling with retry logic
- ✅ Token caching (55-minute TTL for 60-minute tokens)

## Architecture

```
┌─────────────┐
│   GitHub    │
│  Webhooks   │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│  Express Server                     │
│  ┌─────────────────────────────┐   │
│  │  Webhook Controller          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  API Controllers             │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  GitHub Auth Service         │   │
│  │  - JWT Generation            │   │
│  │  - Installation Tokens       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Database Repositories       │   │
│  │  - Installations             │   │
│  │  - Webhook Events            │   │
│  │  - Repository Metadata       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Troubleshooting

### "Missing required environment variable"
Make sure all variables in `.env.example` are set in your `.env` file.

### "Webhook verification failed"
Ensure your `WEBHOOK_SECRET` matches the one in your GitHub App settings.

### "No installations found"
Visit `/auth/github` to install the app on your organization/repository.

### Rate Limiting
The app automatically retries failed requests with exponential backoff. Check logs for rate limit status.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
