/**
 * API request and response types
 */

// Generic API response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        details?: any;
    };
}

// Commits query parameters
export interface CommitsQueryParams {
    since?: string; // ISO 8601 date
    until?: string; // ISO 8601 date
    author?: string;
    path?: string;
}

// Pull requests query parameters
export interface PullRequestsQueryParams {
    state?: 'open' | 'closed' | 'all';
    head?: string;
    base?: string;
    direction?: 'asc' | 'desc';
}

// Issues query parameters
export interface IssuesQueryParams {
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    assignee?: string;
    creator?: string;
    mentioned?: string;
    since?: string;
}

// Workflows query parameters
export interface WorkflowsQueryParams {
    actor?: string;
    branch?: string;
    event?: string;
    status?: 'queued' | 'in_progress' | 'completed';
    created?: string;
}

// Error response
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        details?: any;
    };
}

// Success response helpers
export function successResponse<T>(data: T): ApiResponse<T> {
    return {
        success: true,
        data,
    };
}

export function errorResponse(message: string, code?: string, details?: any): ErrorResponse {
    return {
        success: false,
        error: {
            message,
            code,
            details,
        },
    };
}
