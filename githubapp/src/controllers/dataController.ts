
import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { successResponse, errorResponse } from '../types/api.types';
import { getInstallationOctokit } from '../services/githubApp';
import { User } from '../models/User';

// Helper to get Octokit instance (duplicated from userController for now)
async function getUserOctokit(accessToken: string): Promise<Octokit> {
    const user = await User.findOne({ accessToken });
    if (user?.installationId) {
        return getInstallationOctokit(user.installationId);
    }
    return new Octokit({
        auth: accessToken,
        userAgent: 'github-app-analytics-backend/1.0.0',
    });
}

function getAccessToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

// 1. Get Repo Commits with Patch/Diff
export async function getRepoCommitDetails(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }

        const { owner, repo, ref } = req.params;
        const octokit = await getUserOctokit(accessToken);

        // Fetch commit details
        const { data: commit } = await octokit.repos.getCommit({
            owner,
            repo,
            ref,
        });

        // Map relevant fields
        const result = {
            sha: commit.sha,
            author: {
                name: commit.commit.author?.name,
                email: commit.commit.author?.email,
                date: commit.commit.author?.date,
                login: commit.author?.login,
                id: commit.author?.id,
            },
            message: commit.commit.message,
            stats: commit.stats,
            files: commit.files?.map(file => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                patch: file.patch, // The code snippet/diff
            })),
            timestamp: commit.commit.author?.date,
        };

        res.json(successResponse(result));
    } catch (error: any) {
        console.error('Error fetching commit details:', error);
        res.status(500).json(errorResponse(`Failed to fetch commit details: ${error.message}`));
    }
}

// 2. Get CI/CD Workflow Runs
export async function getRepoWorkflowRuns(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }

        const { owner, repo } = req.params;
        const octokit = await getUserOctokit(accessToken);

        const { data } = await octokit.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            per_page: 50, // Get recent 50 runs
        });

        const runs = data.workflow_runs.map(run => ({
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            created_at: run.created_at,
            updated_at: run.updated_at, // Use (updated_at - created_at) for build time
            triggering_actor: {
                login: run.triggering_actor?.login,
                id: run.triggering_actor?.id,
            },
            head_branch: run.head_branch,
            head_sha: run.head_sha,
        }));

        res.json(successResponse({ runs, total_count: data.total_count }));
    } catch (error: any) {
        console.error('Error fetching workflow runs:', error);
        res.status(500).json(errorResponse(`Failed to fetch workflow runs: ${error.message}`));
    }
}

// 3. Get Repo Pull Requests (Created, Reviewers, Comments)
export async function getRepoPRDetails(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }

        const { owner, repo } = req.params;
        const octokit = await getUserOctokit(accessToken);

        // Fetch PRs
        const { data: prs } = await octokit.pulls.list({
            owner,
            repo,
            state: 'all', // Open and closed
            per_page: 20,
        });

        const detailedPRs = await Promise.all(prs.map(async (pr) => {
            // Fetch reviews for each PR
            const { data: reviews } = await octokit.pulls.listReviews({
                owner,
                repo,
                pull_number: pr.number,
            });

            // Fetch comments count (fetching content might be heavy for list, but we can do it if needed)
            // For now, we return basic PR info + reviewers

            return {
                number: pr.number,
                state: pr.state,
                title: pr.title,
                body: pr.body,
                user: {
                    login: pr.user?.login,
                    id: pr.user?.id,
                },
                created_at: pr.created_at,
                closed_at: pr.closed_at,
                merged_at: pr.merged_at,
                assignees: pr.assignees?.map(assignee => assignee.login),
                requested_reviewers: pr.requested_reviewers?.map(reviewer => reviewer.login),
                reviews: reviews.map(review => ({
                    user: review.user?.login,
                    state: review.state,
                    submitted_at: review.submitted_at,
                })),
            };
        }));

        res.json(successResponse(detailedPRs));
    } catch (error: any) {
        console.error('Error fetching PR details:', error);
        res.status(500).json(errorResponse(`Failed to fetch PR details: ${error.message}`));
    }
}

// 4. Get Repo Issues (Creation, Closure, Assignments, Comments)
export async function getRepoIssueDetails(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }

        const { owner, repo } = req.params;
        const octokit = await getUserOctokit(accessToken);

        const { data: issues } = await octokit.issues.listForRepo({
            owner,
            repo,
            state: 'all',
            per_page: 20,
        });

        // Filter out PRs (GitHub API returns PRs as issues)
        const realIssues = issues.filter(issue => !issue.pull_request);

        const detailedIssues = realIssues.map(issue => ({
            number: issue.number,
            state: issue.state,
            title: issue.title,
            body: issue.body,
            user: {
                login: issue.user?.login,
                id: issue.user?.id,
            },
            created_at: issue.created_at,
            closed_at: issue.closed_at,
            assignees: issue.assignees?.map(assignee => assignee.login),
            comments_count: issue.comments,
            // To get discussion/comments, we would need to fetch generic comments endpoint
            // /repos/{owner}/{repo}/issues/{issue_number}/comments
        }));

        res.json(successResponse(detailedIssues));
    } catch (error: any) {
        console.error('Error fetching issue details:', error);
        res.status(500).json(errorResponse(`Failed to fetch issue details: ${error.message}`));
    }
}
