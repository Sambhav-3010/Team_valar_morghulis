import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { successResponse, errorResponse } from '../types/api.types';

import { getInstallationOctokit } from '../services/githubApp';
import { User } from '../models/User';

async function getUserOctokit(accessToken: string): Promise<Octokit> {
    // Try to find user by access token to get installation ID
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

async function getUserRepos(accessToken: string) {
    const octokit = await getUserOctokit(accessToken);
    const data = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
        sort: 'updated',
        per_page: 100,
    });
    return { repositories: data, totalCount: data.length };
}

async function getUserCommits(
    accessToken: string,
    options: { author?: string; since?: string; until?: string; per_page?: number } = {}
) {
    const octokit = await getUserOctokit(accessToken);
    const { data: user } = await octokit.users.getAuthenticated();
    const author = options.author || user.login;

    const query = `author:${author}` +
        (options.since ? ` committer-date:>=${options.since}` : '') +
        (options.until ? ` committer-date:<=${options.until}` : '');

    const { data } = await octokit.search.commits({
        q: query,
        sort: 'committer-date',
        order: 'desc',
        per_page: options.per_page || 100,
    });

    return { commits: data.items, totalCount: data.total_count };
}

async function getUserPullRequests(
    accessToken: string,
    options: { state?: 'open' | 'closed' | 'all'; since?: string; per_page?: number } = {}
) {
    const octokit = await getUserOctokit(accessToken);
    const { data: user } = await octokit.users.getAuthenticated();

    const query = `type:pr author:${user.login}` +
        (options.state && options.state !== 'all' ? ` state:${options.state}` : '') +
        (options.since ? ` created:>=${options.since}` : '');

    const { data } = await octokit.search.issuesAndPullRequests({
        q: query,
        sort: 'created',
        order: 'desc',
        per_page: options.per_page || 100,
    });

    return { pullRequests: data.items, totalCount: data.total_count };
}

async function getUserIssues(
    accessToken: string,
    options: { filter?: 'assigned' | 'created' | 'mentioned' | 'subscribed' | 'all'; state?: 'open' | 'closed' | 'all'; since?: string; per_page?: number } = {}
) {
    const octokit = await getUserOctokit(accessToken);
    const { data } = await octokit.issues.list({
        filter: options.filter || 'all',
        state: options.state || 'all',
        since: options.since,
        per_page: options.per_page || 100,
    });

    return { issues: data, totalCount: data.length };
}

async function getUserOrganizations(accessToken: string) {
    const octokit = await getUserOctokit(accessToken);
    const { data } = await octokit.orgs.listForAuthenticatedUser({ per_page: 100 });
    return { organizations: data, totalCount: data.length };
}

async function getOrgMembersApi(accessToken: string, org: string) {
    const octokit = await getUserOctokit(accessToken);
    const { data } = await octokit.orgs.listMembers({ org, per_page: 100 });
    return { members: data, totalCount: data.length };
}

async function getOrgReposApi(accessToken: string, org: string) {
    const octokit = await getUserOctokit(accessToken);
    const { data } = await octokit.repos.listForOrg({ org, sort: 'updated', per_page: 100 });
    return { repositories: data, totalCount: data.length };
}

async function getUserEvents(accessToken: string, username?: string) {
    const octokit = await getUserOctokit(accessToken);
    const login = username || (await octokit.users.getAuthenticated()).data.login;
    const { data } = await octokit.activity.listEventsForAuthenticatedUser({ username: login, per_page: 100 });
    return { events: data, totalCount: data.length };
}

async function getUserReviews(accessToken: string, options: { since?: string; per_page?: number } = {}) {
    const octokit = await getUserOctokit(accessToken);
    const { data: user } = await octokit.users.getAuthenticated();

    const query = `type:pr reviewed-by:${user.login}` + (options.since ? ` created:>=${options.since}` : '');

    const { data } = await octokit.search.issuesAndPullRequests({
        q: query,
        sort: 'created',
        order: 'desc',
        per_page: options.per_page || 100,
    });

    return { reviews: data.items, totalCount: data.total_count };
}

async function getUserStats(accessToken: string, since?: string) {
    const [commits, pullRequests, issues, reviews] = await Promise.all([
        getUserCommits(accessToken, { since }),
        getUserPullRequests(accessToken, { since }),
        getUserIssues(accessToken, { filter: 'created', since }),
        getUserReviews(accessToken, { since }),
    ]);

    return {
        commits: commits.totalCount,
        pullRequests: pullRequests.totalCount,
        issues: issues.totalCount,
        reviews: reviews.totalCount,
    };
}

export async function getMyRepos(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const result = await getUserRepos(accessToken);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch repositories'));
    }
}

export async function getMyCommits(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const options = {
            since: req.query.since as string,
            until: req.query.until as string,
            per_page: req.query.per_page ? parseInt(req.query.per_page as string, 10) : undefined,
        };
        const result = await getUserCommits(accessToken, options);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch commits'));
    }
}

export async function getMyPullRequests(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const options = {
            state: (req.query.state as 'open' | 'closed' | 'all') || 'all',
            since: req.query.since as string,
            per_page: req.query.per_page ? parseInt(req.query.per_page as string, 10) : undefined,
        };
        const result = await getUserPullRequests(accessToken, options);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch pull requests'));
    }
}

export async function getMyIssues(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const options = {
            filter: (req.query.filter as 'assigned' | 'created' | 'mentioned' | 'subscribed' | 'all') || 'all',
            state: (req.query.state as 'open' | 'closed' | 'all') || 'all',
            since: req.query.since as string,
            per_page: req.query.per_page ? parseInt(req.query.per_page as string, 10) : undefined,
        };
        const result = await getUserIssues(accessToken, options);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch issues'));
    }
}

export async function getMyOrganizations(_req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(_req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const result = await getUserOrganizations(accessToken);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch organizations'));
    }
}

export async function getOrgMembers(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const { org } = req.params;
        const result = await getOrgMembersApi(accessToken, org);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch organization members'));
    }
}

export async function getOrgRepos(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const { org } = req.params;
        const result = await getOrgReposApi(accessToken, org);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch organization repositories'));
    }
}

export async function getMyEvents(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const result = await getUserEvents(accessToken);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch events'));
    }
}

export async function getMyReviews(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const options = {
            since: req.query.since as string,
            per_page: req.query.per_page ? parseInt(req.query.per_page as string, 10) : undefined,
        };
        const result = await getUserReviews(accessToken, options);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch reviews'));
    }
}

export async function getMyStats(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = getAccessToken(req);
        if (!accessToken) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }
        const since = req.query.since as string;
        const result = await getUserStats(accessToken, since);
        res.json(successResponse(result));
    } catch (error) {
        res.status(500).json(errorResponse('Failed to fetch user stats'));
    }
}
