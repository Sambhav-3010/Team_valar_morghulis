import { Identity, IIdentity } from '../models';

/**
 * Identity Service
 * Handles cross-tool user identity resolution and management
 */

/**
 * Find or create an identity by email
 */
export async function findOrCreateIdentity(
    email: string,
    displayName: string,
    orgId: string = 'default'
): Promise<IIdentity> {
    const normalizedEmail = email.toLowerCase().trim();

    // Try to find by primary email
    let identity = await Identity.findOne({ primaryEmail: normalizedEmail });

    // Try alternate emails
    if (!identity) {
        identity = await Identity.findOne({ alternateEmails: normalizedEmail });
    }

    // Create new identity if not found
    if (!identity) {
        identity = await Identity.create({
            primaryEmail: normalizedEmail,
            alternateEmails: [],
            displayName: displayName || normalizedEmail.split('@')[0],
            orgId
        });
    }

    return identity;
}

/**
 * Resolve email to identity ID
 */
export async function resolveIdentity(email: string): Promise<string | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const identity = await Identity.findOne({
        $or: [
            { primaryEmail: normalizedEmail },
            { alternateEmails: normalizedEmail }
        ]
    });

    return identity?._id?.toString() || null;
}

/**
 * Link a GitHub account to an identity
 */
export async function linkGitHubAccount(
    email: string,
    githubLogin: string,
    githubId: number
): Promise<IIdentity | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const identity = await Identity.findOneAndUpdate(
        {
            $or: [
                { primaryEmail: normalizedEmail },
                { alternateEmails: normalizedEmail }
            ]
        },
        {
            $set: { githubLogin, githubId }
        },
        { new: true }
    );

    return identity;
}

/**
 * Link a Slack account to an identity
 */
export async function linkSlackAccount(
    email: string,
    slackUserId: string,
    slackTeamId: string
): Promise<IIdentity | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const identity = await Identity.findOneAndUpdate(
        {
            $or: [
                { primaryEmail: normalizedEmail },
                { alternateEmails: normalizedEmail }
            ]
        },
        {
            $set: { slackUserId, slackTeamId }
        },
        { new: true }
    );

    return identity;
}

/**
 * Link a Jira account to an identity
 */
export async function linkJiraAccount(
    email: string,
    jiraAccountId: string
): Promise<IIdentity | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const identity = await Identity.findOneAndUpdate(
        {
            $or: [
                { primaryEmail: normalizedEmail },
                { alternateEmails: normalizedEmail }
            ]
        },
        {
            $set: { jiraAccountId }
        },
        { new: true }
    );

    return identity;
}

/**
 * Add an alternate email to an identity
 */
export async function addAlternateEmail(
    primaryEmail: string,
    alternateEmail: string
): Promise<IIdentity | null> {
    const normalizedPrimary = primaryEmail.toLowerCase().trim();
    const normalizedAlt = alternateEmail.toLowerCase().trim();

    const identity = await Identity.findOneAndUpdate(
        { primaryEmail: normalizedPrimary },
        { $addToSet: { alternateEmails: normalizedAlt } },
        { new: true }
    );

    return identity;
}

/**
 * Get all identities for an organization
 */
export async function getOrgIdentities(orgId: string): Promise<IIdentity[]> {
    return Identity.find({ orgId }).lean();
}

/**
 * Find identity by any linked account
 */
export async function findIdentityByAccount(options: {
    email?: string;
    githubLogin?: string;
    slackUserId?: string;
    jiraAccountId?: string;
}): Promise<IIdentity | null> {
    const conditions: any[] = [];

    if (options.email) {
        const normalizedEmail = options.email.toLowerCase().trim();
        conditions.push({ primaryEmail: normalizedEmail });
        conditions.push({ alternateEmails: normalizedEmail });
    }
    if (options.githubLogin) {
        conditions.push({ githubLogin: options.githubLogin });
    }
    if (options.slackUserId) {
        conditions.push({ slackUserId: options.slackUserId });
    }
    if (options.jiraAccountId) {
        conditions.push({ jiraAccountId: options.jiraAccountId });
    }

    if (conditions.length === 0) return null;

    return Identity.findOne({ $or: conditions });
}

export default {
    findOrCreateIdentity,
    resolveIdentity,
    linkGitHubAccount,
    linkSlackAccount,
    linkJiraAccount,
    addAlternateEmail,
    getOrgIdentities,
    findIdentityByAccount
};
