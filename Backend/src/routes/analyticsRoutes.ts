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

export default router;
