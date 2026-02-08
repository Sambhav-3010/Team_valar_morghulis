import express from 'express';
import { getSpaceMetrics, getFlowMetrics, getDoraMetrics } from '../services/metrics/metricsService';
import { Insight } from '../models/Insight';

const router = express.Router();

/**
 * GET /api/analytics/hr
 * Returns SPACE metrics and HR insights
 */
router.get('/hr', async (req, res) => {
    try {
        const metrics = getSpaceMetrics();
        const insights = await Insight.find({ persona: 'hr' }).sort({ generatedAt: -1 }).limit(10);

        res.json({
            metrics,
            insights: insights.map(i => ({
                id: i._id,
                category: i.category,
                persona: i.persona,
                title: i.title,
                body: i.body,
                confidence: i.confidence,
                timestamp: i.generatedAt,
                relatedMetric: i.relatedMetric,
                source: i.source
            }))
        });
    } catch (err) {
        console.error('Error fetching HR analytics:', err);
        res.status(500).json({ error: 'Failed to fetch HR analytics' });
    }
});

/**
 * GET /api/analytics/product
 * Returns FLOW metrics and Product insights
 */
router.get('/product', async (req, res) => {
    try {
        const metrics = getFlowMetrics();
        const insights = await Insight.find({ persona: 'product' }).sort({ generatedAt: -1 }).limit(10);

        res.json({
            metrics,
            insights: insights.map(i => ({
                id: i._id,
                category: i.category,
                persona: i.persona,
                title: i.title,
                body: i.body,
                confidence: i.confidence,
                timestamp: i.generatedAt,
                relatedMetric: i.relatedMetric,
                source: i.source
            }))
        });
    } catch (err) {
        console.error('Error fetching Product analytics:', err);
        res.status(500).json({ error: 'Failed to fetch Product analytics' });
    }
});

/**
 * GET /api/analytics/engineering
 * Returns DORA metrics and Engineering insights
 */
router.get('/engineering', async (req, res) => {
    try {
        const metrics = getDoraMetrics();
        const insights = await Insight.find({ persona: 'engineering' }).sort({ generatedAt: -1 }).limit(10);

        res.json({
            metrics,
            insights: insights.map(i => ({
                id: i._id,
                category: i.category,
                persona: i.persona,
                title: i.title,
                body: i.body,
                confidence: i.confidence,
                timestamp: i.generatedAt,
                relatedMetric: i.relatedMetric,
                source: i.source
            }))
        });
    } catch (err) {
        console.error('Error fetching Engineering analytics:', err);
        res.status(500).json({ error: 'Failed to fetch Engineering analytics' });
    }
});

/**
 * GET /api/analytics/insights
 * Returns all AI insights with optional filters
 */
router.get('/insights', async (req, res) => {
    try {
        const { orgId, persona, limit } = req.query;

        const query: any = {};
        if (orgId) query.orgId = orgId;
        if (persona) query.persona = persona;

        const limitNum = limit ? parseInt(limit as string, 10) : 20;

        const insights = await Insight.find(query)
            .sort({ generatedAt: -1 })
            .limit(limitNum);

        res.json({
            success: true,
            insights: insights.map(i => ({
                id: i._id,
                category: i.category,
                persona: i.persona,
                title: i.title,
                body: i.body,
                confidence: i.confidence,
                timestamp: i.generatedAt,
                relatedMetric: i.relatedMetric,
                source: i.source
            }))
        });
    } catch (err) {
        console.error('Error fetching insights:', err);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
});

/**
 * GET /api/analytics/user/:email/activities
 * Returns recent activities for a specific user
 */
router.get('/user/:email/activities', async (req, res) => {
    try {
        const { email } = req.params;
        const { limit } = req.query;
        const limitNum = limit ? parseInt(limit as string, 10) : 50;

        // Import Activity model dynamically or ensure it's imported at top
        const { Activity } = await import('../models/Activity');

        const activities = await Activity.find({
            actorEmail: email
        })
            .sort({ timestamp: -1 })
            .limit(limitNum);

        res.json({
            success: true,
            activities: activities.map(a => ({
                id: a._id,
                source: a.source,
                type: a.activityType,
                timestamp: a.timestamp,
                project: a.projectAlias,
                metadata: a.metadata
            }))
        });
    } catch (err) {
        console.error('Error fetching user activities:', err);
        res.status(500).json({ error: 'Failed to fetch user activities' });
    }
});

export default router;
