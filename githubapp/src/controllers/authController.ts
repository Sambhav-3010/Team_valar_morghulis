import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { User } from '../models';
import { successResponse, errorResponse } from '../types/api.types';
import { getUserInstallationId } from '../services/githubApp';

const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_OAUTH_TOKEN_URL = 'https://github.com/login/oauth/access_token';

interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
}

interface OAuthErrorResponse {
    error: string;
    error_description?: string;
}

function getOAuthLoginUrl(state?: string): string {
    const clientId = process.env.CLIENT_ID!;
    const redirectUri = process.env.OAUTH_CALLBACK_URL!;
    const scope = 'read:user user:email repo read:org';

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        ...(state && { state }),
    });

    return `${GITHUB_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    const redirectUri = process.env.OAUTH_CALLBACK_URL!;

    const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
        }),
    });

    const data = await response.json() as OAuthTokenResponse | OAuthErrorResponse;

    if ('error' in data) {
        throw new Error(`OAuth error: ${data.error_description || data.error}`);
    }

    return data;
}

async function refreshUserToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;

    const response = await fetch(GITHUB_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });

    const data = await response.json() as OAuthTokenResponse | OAuthErrorResponse;

    if ('error' in data) {
        throw new Error(`OAuth refresh error: ${data.error_description || data.error}`);
    }

    return data;
}

function getUserOctokit(accessToken: string): Octokit {
    return new Octokit({
        auth: accessToken,
        userAgent: 'github-app-analytics-backend/1.0.0',
    });
}

async function getUserProfile(accessToken: string) {
    const octokit = getUserOctokit(accessToken);
    const { data } = await octokit.users.getAuthenticated();
    return data;
}

export async function initiateUserOAuth(_req: Request, res: Response): Promise<void> {
    try {
        const state = Math.random().toString(36).substring(7);
        const loginUrl = getOAuthLoginUrl(state);
        res.redirect(loginUrl);
    } catch (error) {
        res.status(500).json(errorResponse('Failed to initiate user OAuth'));
    }
}

export async function handleUserCallback(req: Request, res: Response): Promise<void> {
    try {
        const { code, installation_id, error, error_description } = req.query;

        if (error) {
            res.status(400).json(errorResponse(`OAuth error: ${error_description || error}`));
            return;
        }

        if (!code || typeof code !== 'string') {
            res.status(400).json(errorResponse('Missing authorization code'));
            return;
        }

        const tokenResponse = await exchangeCodeForToken(code);
        const profile = await getUserProfile(tokenResponse.access_token);
        const tokenExpiresAt = tokenResponse.expires_in
            ? new Date(Date.now() + tokenResponse.expires_in * 1000)
            : null;

        let user = await User.findOne({ githubId: profile.id });

        // Determine installation ID: Query param > Existing DB value > Fetch from API
        let finalInstallationId: number | null = null;

        if (installation_id) {
            finalInstallationId = parseInt(installation_id as string, 10);
        }

        if (user) {
            user.login = profile.login;
            user.name = profile.name;
            user.email = profile.email;
            user.avatarUrl = profile.avatar_url;
            user.accessToken = tokenResponse.access_token;
            user.refreshToken = tokenResponse.refresh_token || null;
            user.tokenExpiresAt = tokenExpiresAt;
            user.scope = tokenResponse.scope;

            // Update installation ID if provided in query or if missing in DB
            if (finalInstallationId) {
                user.installationId = finalInstallationId;
            } else if (!user.installationId) {
                const fetchedId = await getUserInstallationId(profile.login);
                if (fetchedId) {
                    user.installationId = fetchedId;
                }
            }

            await user.save();
        } else {
            // If not in query, try to fetch
            if (!finalInstallationId) {
                finalInstallationId = await getUserInstallationId(profile.login);
            }

            user = await User.create({
                githubId: profile.id,
                login: profile.login,
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatar_url,
                type: profile.type as 'User' | 'Organization',
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || null,
                tokenExpiresAt,
                scope: tokenResponse.scope,
                installationId: finalInstallationId,
            });
        }

        res.json(
            successResponse({
                message: 'Successfully authenticated with GitHub',
                user: {
                    id: user._id,
                    githubId: user.githubId,
                    login: user.login,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                },
                accessToken: tokenResponse.access_token,
            })
        );
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json(errorResponse('Failed to process user OAuth callback'));
    }
}

export async function refreshUserTokenEndpoint(req: Request, res: Response): Promise<void> {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json(errorResponse('Missing refresh token'));
            return;
        }

        const tokenResponse = await refreshUserToken(refreshToken);
        const profile = await getUserProfile(tokenResponse.access_token);
        const tokenExpiresAt = tokenResponse.expires_in
            ? new Date(Date.now() + tokenResponse.expires_in * 1000)
            : null;

        await User.findOneAndUpdate(
            { githubId: profile.id },
            {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || null,
                tokenExpiresAt,
                scope: tokenResponse.scope,
            }
        );

        res.json(
            successResponse({
                accessToken: tokenResponse.access_token,
                expiresIn: tokenResponse.expires_in,
            })
        );
    } catch (error) {
        res.status(500).json(errorResponse('Failed to refresh token'));
    }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json(errorResponse('Missing or invalid authorization header'));
            return;
        }

        const accessToken = authHeader.substring(7);
        const profile = await getUserProfile(accessToken);
        const user = await User.findOne({ githubId: profile.id });

        res.json(
            successResponse({
                user: {
                    id: user?._id,
                    githubId: profile.id,
                    login: profile.login,
                    name: profile.name,
                    email: profile.email,
                    avatarUrl: profile.avatar_url,
                    type: profile.type,
                },
            })
        );
    } catch (error) {
        res.status(401).json(errorResponse('Invalid or expired access token'));
    }
}
