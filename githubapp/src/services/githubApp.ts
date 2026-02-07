import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';
import { User } from '../models/User';
import { Organization } from '../models/Organization';

// Singleton instance of the GitHub App
let app: App | null = null;

function getApp(): App {
    if (!app) {
        const appId = process.env.APP_ID;
        const privateKey = process.env.PRIVATE_KEY;

        if (!appId || !privateKey) {
            throw new Error('Missing APP_ID or PRIVATE_KEY environment variables');
        }

        app = new App({
            appId: appId,
            privateKey: privateKey,
        });
    }
    return app;
}

/**
 * Get an authenticated Octokit instance for a specific installation.
 * This is used to perform actions on behalf of the installation (e.g., listing repos).
 */
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
    const app = getApp();
    return await app.getInstallationOctokit(installationId) as unknown as Octokit;
}

/**
 * Get an authenticated Octokit instance for the GitHub App itself.
 * This is used for app-level operations like listing installations.
 */
export function getAppOctokit(): Octokit {
    const app = getApp();
    return app.octokit as unknown as Octokit;
}

/**
 * Find the installation ID for a given user.
 * Tries to find it in the local DB first, then queries GitHub if missing.
 */
export async function getUserInstallationId(username: string): Promise<number | null> {
    // 1. Check local User model
    const user = await User.findOne({ login: username });
    if (user?.installationId) {
        return user.installationId;
    }

    // 2. Check local Organization model
    const org = await Organization.findOne({ login: username });
    if (org?.installationId) {
        return org.installationId;
    }

    // 3. Fallback: Query GitHub API to find installation for this user/org
    try {
        const appOctokit = getAppOctokit();

        // Check if it's a user installation
        try {
            const { data: installation } = await appOctokit.rest.apps.getUserInstallation({
                username,
            });
            return installation.id;
        } catch (e) {
            // Check if it's an org installation
            const { data: installation } = await appOctokit.rest.apps.getOrgInstallation({
                org: username,
            });
            return installation.id;
        }
    } catch (error) {
        console.error(`Failed to find installation ID for ${username}:`, error);
        return null;
    }
}
