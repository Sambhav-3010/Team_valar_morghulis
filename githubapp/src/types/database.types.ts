/**
 * Database model interfaces
 * These represent the shape of data stored in the database
 */

// Installation model
export interface Installation {
    id: string;
    installationId: number;
    accountLogin: string;
    accountType: 'User' | 'Organization';
    accountId: number;
    repositorySelection: 'all' | 'selected';
    permissions: Record<string, string>;
    events: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Webhook Event model
export interface WebhookEvent {
    id: string;
    eventType: string;
    eventAction: string;
    installationId: number;
    repositoryId: number;
    repositoryFullName: string;
    senderId: number;
    senderLogin: string;
    payload: any; // Raw webhook payload
    createdAt: Date;
}

// Repository model
export interface Repository {
    id: string;
    githubId: number;
    name: string;
    fullName: string;
    owner: string;
    ownerType: 'User' | 'Organization';
    private: boolean;
    description: string | null;
    language: string | null;
    defaultBranch: string;
    stargazersCount: number;
    forksCount: number;
    openIssuesCount: number;
    createdAt: Date;
    updatedAt: Date;
    lastSyncedAt: Date | null;
}

// Organization model
export interface Organization {
    id: string;
    githubId: number;
    login: string;
    name: string | null;
    description: string | null;
    avatarUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

// User model
export interface User {
    id: string;
    githubId: number;
    login: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
    type: 'User' | 'Organization';
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    scope: string;
    createdAt: Date;
    updatedAt: Date;
}
