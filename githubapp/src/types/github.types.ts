/**
 * GitHub API response types and interfaces
 */

// Pagination metadata
export interface PaginationMeta {
    page: number;
    perPage: number;
    totalCount?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
}

// Repository interfaces
export interface GitHubRepository {
    id: number;
    nodeId: string;
    name: string;
    fullName: string;
    owner: GitHubUser;
    private: boolean;
    description: string | null;
    fork: boolean;
    createdAt: string;
    updatedAt: string;
    pushedAt: string;
    size: number;
    stargazersCount: number;
    watchersCount: number;
    language: string | null;
    forksCount: number;
    openIssuesCount: number;
    defaultBranch: string;
    topics?: string[];
}

// User/Organization interfaces
export interface GitHubUser {
    login: string;
    id: number;
    nodeId: string;
    avatarUrl: string;
    type: 'User' | 'Organization';
    siteAdmin: boolean;
}

// Commit interfaces
export interface GitHubCommit {
    sha: string;
    nodeId: string;
    commit: {
        author: {
            name: string;
            email: string;
            date: string;
        };
        committer: {
            name: string;
            email: string;
            date: string;
        };
        message: string;
        tree: {
            sha: string;
            url: string;
        };
        commentCount: number;
    };
    author: GitHubUser | null;
    committer: GitHubUser | null;
    parents: Array<{ sha: string; url: string }>;
    stats?: {
        total: number;
        additions: number;
        deletions: number;
    };
    files?: Array<{
        filename: string;
        status: string;
        additions: number;
        deletions: number;
        changes: number;
    }>;
}

// Pull Request interfaces
export interface GitHubPullRequest {
    id: number;
    nodeId: string;
    number: number;
    state: 'open' | 'closed';
    title: string;
    user: GitHubUser;
    body: string | null;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    mergedAt: string | null;
    mergeCommitSha: string | null;
    assignees: GitHubUser[];
    requestedReviewers: GitHubUser[];
    labels: Array<{
        id: number;
        name: string;
        color: string;
        description: string | null;
    }>;
    draft: boolean;
    head: {
        ref: string;
        sha: string;
        repo: GitHubRepository | null;
    };
    base: {
        ref: string;
        sha: string;
        repo: GitHubRepository;
    };
    additions: number;
    deletions: number;
    changedFiles: number;
    commits: number;
    reviewComments: number;
    comments: number;
}

// Issue interfaces
export interface GitHubIssue {
    id: number;
    nodeId: string;
    number: number;
    title: string;
    user: GitHubUser;
    state: 'open' | 'closed';
    locked: boolean;
    assignees: GitHubUser[];
    labels: Array<{
        id: number;
        name: string;
        color: string;
        description: string | null;
    }>;
    comments: number;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    body: string | null;
    pullRequest?: {
        url: string;
    };
}

// Workflow interfaces
export interface GitHubWorkflowRun {
    id: number;
    nodeId: string;
    name: string;
    headBranch: string;
    headSha: string;
    runNumber: number;
    event: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    workflowId: number;
    createdAt: string;
    updatedAt: string;
    runStartedAt: string;
    jobsUrl: string;
    logsUrl: string;
    checkSuiteUrl: string;
    artifactsUrl: string;
    cancelUrl: string;
    rerunUrl: string;
    headCommit: {
        id: string;
        message: string;
        timestamp: string;
        author: {
            name: string;
            email: string;
        };
    };
    repository: GitHubRepository;
    headRepository: GitHubRepository;
}

// Check Suite interfaces
export interface GitHubCheckSuite {
    id: number;
    nodeId: string;
    headBranch: string;
    headSha: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    url: string;
    before: string;
    after: string;
    pullRequests: Array<{
        id: number;
        number: number;
        url: string;
    }>;
    app: {
        id: number;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Check Run interfaces
export interface GitHubCheckRun {
    id: number;
    nodeId: string;
    headSha: string;
    externalId: string;
    url: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    startedAt: string;
    completedAt: string | null;
    name: string;
    checkSuite: {
        id: number;
    };
    app: {
        id: number;
        name: string;
    };
    pullRequests: Array<{
        id: number;
        number: number;
        url: string;
    }>;
}

// Installation interfaces
export interface GitHubInstallation {
    id: number;
    account: GitHubUser;
    repositorySelection: 'all' | 'selected';
    accessTokensUrl: string;
    repositoriesUrl: string;
    appId: number;
    targetId: number;
    targetType: 'User' | 'Organization';
    permissions: Record<string, string>;
    events: string[];
    createdAt: string;
    updatedAt: string;
    singleFileName: string | null;
}

// Installation Access Token
export interface InstallationAccessToken {
    token: string;
    expiresAt: string;
    permissions: Record<string, string>;
    repositorySelection: 'all' | 'selected';
}
