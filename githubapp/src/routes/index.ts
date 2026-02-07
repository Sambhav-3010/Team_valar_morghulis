import { Router } from 'express';
import {
    initiateUserOAuth,
    handleUserCallback,
    refreshUserTokenEndpoint,
    getCurrentUser,
} from '../controllers/authController';
import { handleWebhook } from '../controllers/webhookController';
import {
    getMyRepos,
    getMyCommits,
    getMyPullRequests,
    getMyIssues,
    getMyOrganizations,
    getOrgMembers,
    getOrgRepos,
    getMyEvents,
    getMyReviews,
    getMyStats,
} from '../controllers/userController';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// User OAuth routes
router.get('/auth/user/login', initiateUserOAuth);
router.get('/auth/github/callback', handleUserCallback);
router.post('/auth/user/refresh', refreshUserTokenEndpoint);
router.get('/auth/user/me', getCurrentUser);

// Webhook
router.post('/webhook', handleWebhook);

// User-level API (using user access token)
router.get('/api/user/repos', getMyRepos);
router.get('/api/user/commits', getMyCommits);
router.get('/api/user/pull-requests', getMyPullRequests);
router.get('/api/user/issues', getMyIssues);
router.get('/api/user/orgs', getMyOrganizations);
router.get('/api/user/orgs/:org/members', getOrgMembers);
router.get('/api/user/orgs/:org/repos', getOrgRepos);
router.get('/api/user/events', getMyEvents);
router.get('/api/user/reviews', getMyReviews);
router.get('/api/user/stats', getMyStats);

export default router;
