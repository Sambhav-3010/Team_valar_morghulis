import { Webhooks } from '@octokit/webhooks';
import { Request, Response } from 'express';
import { WebhookEvent, User, Organization } from '../models';

const webhooks = new Webhooks({
    secret: process.env.WEBHOOK_SECRET!,
});

webhooks.on('push', async ({ payload }) => {
    await WebhookEvent.create({
        eventType: 'push',
        eventAction: 'pushed',
        installationId: payload.installation?.id || 0,
        repositoryId: payload.repository.id,
        repositoryFullName: payload.repository.full_name,
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});

webhooks.on('pull_request', async ({ payload }) => {
    await WebhookEvent.create({
        eventType: 'pull_request',
        eventAction: payload.action,
        installationId: payload.installation?.id || 0,
        repositoryId: payload.repository.id,
        repositoryFullName: payload.repository.full_name,
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});

webhooks.on('issues', async ({ payload }) => {
    await WebhookEvent.create({
        eventType: 'issues',
        eventAction: payload.action,
        installationId: payload.installation?.id || 0,
        repositoryId: payload.repository.id,
        repositoryFullName: payload.repository.full_name,
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});

webhooks.on('workflow_run', async ({ payload }) => {
    await WebhookEvent.create({
        eventType: 'workflow_run',
        eventAction: payload.action,
        installationId: payload.installation?.id || 0,
        repositoryId: payload.repository.id,
        repositoryFullName: payload.repository.full_name,
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});

webhooks.on('check_suite', async ({ payload }) => {
    await WebhookEvent.create({
        eventType: 'check_suite',
        eventAction: payload.action,
        installationId: payload.installation?.id || 0,
        repositoryId: payload.repository.id,
        repositoryFullName: payload.repository.full_name,
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});

webhooks.on('check_run', async ({ payload }) => {
    await WebhookEvent.create({
        eventType: 'check_run',
        eventAction: payload.action,
        installationId: payload.installation?.id || 0,
        repositoryId: payload.repository.id,
        repositoryFullName: payload.repository.full_name,
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});


webhooks.on('installation', async ({ payload }) => {
    const { installation, action } = payload;
    const account = installation.account;

    if (!account) return;

    if (action === 'created' || action === 'new_permissions_accepted') {
        const githubId = account.id;
        const installationId = installation.id;

        // Try to update User
        if (account.type === 'User') {
            await User.findOneAndUpdate(
                { githubId: githubId },
                { installationId: installationId },
                { new: true }
            );
        }
        // Try to update Organization
        else if (account.type === 'Organization') {
            await Organization.findOneAndUpdate(
                { githubId: githubId },
                { installationId: installationId },
                { new: true }
            );
        }
    } else if (action === 'deleted') {
        const githubId = account.id;

        // Try to unset installationId for User
        if (account.type === 'User') {
            await User.findOneAndUpdate(
                { githubId: githubId },
                { installationId: null }
            );
        }
        // Try to unset installationId for Organization
        else if (account.type === 'Organization') {
            await Organization.findOneAndUpdate(
                { githubId: githubId },
                { installationId: null }
            );
        }
    }

    // Log the event as usual
    await WebhookEvent.create({
        eventType: 'installation',
        eventAction: action,
        installationId: installation.id,
        repositoryId: 0, // Installation events might not have a repo
        repositoryFullName: '',
        senderId: payload.sender.id,
        senderLogin: payload.sender.login,
        payload: payload,
    });
});

webhooks.onError((_error) => { });

export async function handleWebhook(req: Request, res: Response): Promise<void> {
    try {
        const signature = req.headers['x-hub-signature-256'] as string;
        const event = req.headers['x-github-event'] as string;
        const id = req.headers['x-github-delivery'] as string;

        if (!signature || !event) {
            res.status(400).json({ error: 'Missing required headers' });
            return;
        }

        await webhooks.verifyAndReceive({
            id,
            name: event as any,
            payload: req.body,
            signature,
        });

        res.status(200).json({ success: true });
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
