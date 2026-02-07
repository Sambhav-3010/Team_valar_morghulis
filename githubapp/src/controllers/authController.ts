import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import { User } from '../models';
import { successResponse, errorResponse } from '../types/api.types';
import { getUserInstallationId, getAppNode } from '../services/githubApp';





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
        const app = getAppNode();
        const { url } = app.oauth.getWebFlowAuthorizationUrl({
            redirectUrl: process.env.OAUTH_CALLBACK_URL,
            // scopes: ['read:user', 'user:email', 'repo', 'read:org'], // GitHub Apps use permissions, but for user-to-server token we might need them? 
            // Actually, for GitHub Apps, we request permissions during installation. 
            // For user identification, we might not need explicit scopes if we just want identity?
            // But if we want to act on behalf of user?
            // Let's try to check what options are allowed or just remove it if it causes error and rely on app configuration.
        });

        res.redirect(url);
    } catch (error) {
        console.error('Failed to initiate OAuth:', error);
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

        const app = getAppNode();
        const { authentication } = await app.oauth.createToken({
            code,
            redirectUrl: process.env.OAUTH_CALLBACK_URL,
        });

        const profile = await getUserProfile(authentication.token);


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
            user.accessToken = authentication.token;
            // user.scope = ... // Scope is not directly available in the typed response? 
            user.scope = '';

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
                accessToken: authentication.token,
                scope: '', // Scope handling simplified
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
                accessToken: authentication.token,
            })
        );
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json(errorResponse('Failed to process user OAuth callback'));
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
