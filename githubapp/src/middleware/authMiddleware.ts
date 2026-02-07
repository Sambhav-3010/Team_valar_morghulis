import { Request, Response, NextFunction } from 'express';
import { Octokit } from '@octokit/rest';
import { User } from '../models';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                githubId: number;
                login: string;
                accessToken: string;
            };
        }
    }
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

export function authMiddleware(_req: Request, _res: Response, next: NextFunction): void {
    next();
}

export async function requireUserAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
            return;
        }

        const accessToken = authHeader.substring(7);
        const profile = await getUserProfile(accessToken);

        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
            user = await User.create({
                githubId: profile.id,
                login: profile.login,
                name: profile.name,
                email: profile.email,
                avatarUrl: profile.avatar_url,
                type: profile.type as 'User' | 'Organization',
                accessToken,
                refreshToken: null,
                tokenExpiresAt: null,
                scope: '',
            });
        }

        req.user = {
            id: user._id.toString(),
            githubId: user.githubId,
            login: user.login,
            accessToken,
        };

        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid or expired access token' });
    }
}
