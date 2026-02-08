# Engineering Intelligence Platform (Team Valar Morghulis)

An AI-powered platform for engineering analytics, aggregating data from development tools (GitHub, Jira), communication channels (Slack, Email), and providing actionable insights for engineering leaders.

## Project Structure

This monorepo contains multiple services:

| Service | Description | Path |
|---------|-------------|------|
| **[Backend](Backend/README.md)** | Core API, Data Processing, and Analytics Engine | `Backend/` |
| **[Frontend](frontend/README.md)** | Next.js Dashboard for visualization | `frontend/` |
| **[GitHub App](githubapp/README.md)** | Service handling GitHub Webhooks and permissions | `githubapp/` |
| **[Slack Service](Slack/README.md)** | Service for capturing Slack communication metadata | `Slack/` |
| **[Jira Service](JIRA/README.md)** | Service for syncing Jira issue data | `JIRA/` |
| **[Email Service](Email/README.md)** | Service for syncing Email metadata | `Email/` |

## Quick Start
1. **Set up Backend**: Follow instructions in [Backend/README.md](Backend/README.md).
2. **Start Services**: Run the auxiliary services (Slack, Jira, etc.) as needed using Docker or local Node.js.
3. **Run Frontend**: Start the dashboard as described in [frontend/README.md](frontend/README.md).

## Architecture
The platform follows a microservices-inspired architecture where specialized data collectors (Slack, Jira, Email, GitHub) feed normalized data into a central MongoDB. The core Backend aggregates this data to compute metrics (SPACE, DORA) and generate AI insights.

## License
Confidential - Datathon 2026.
