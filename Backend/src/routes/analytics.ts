import { Router, Request, Response } from 'express';
import { runAllTransformers, runTransformerBySource, getTransformStatus } from '../transformers';
import { calculateSpaceMetrics, getOrgSpaceOverview } from '../services/metrics/spaceMetrics';
import { calculateFlowMetrics, getOrgFlowOverview } from '../services/metrics/flowMetrics';
import { calculateDoraMetrics, getOrgDoraOverview } from '../services/metrics/doraMetrics';
import { getOrgIdentities } from '../services/identityService';
import { getOrgProjects } from '../services/projectService';
import { generateHRInsights, generateProductInsights, generateEngineeringInsights } from '../services/llm';
import { Insight } from '../models';

const router = Router();

/**
 * Parse date range from query params
 */
function getDateRange(req: Request): { start: Date; end: Date } {
    const end = req.query.end
        ? new Date(req.query.end as string)
        : new Date();

    const start = req.query.start
        ? new Date(req.query.start as string)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days

    return { start, end };
}

// ==========================================
// Transformation Endpoints
// ==========================================

/**
 * POST /transform/run
 * Trigger the transformation pipeline
 */
router.post('/transform/run', async (req: Request, res: Response) => {
    try {
        // Run async, don't wait
        runAllTransformers().catch(err => {
            console.error('Transformation error:', err);
        });

        res.json({
            success: true,
            message: 'Transformation pipeline started'
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * POST /transform/run/:source
 * Trigger transformation for a specific source
 */
router.post('/transform/run/:source', async (req: Request, res: Response) => {
    try {
        const source = req.params.source as string;
        const result = await runTransformerBySource(source);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /transform/status
 * Get transformation status for all sources
 */
router.get('/transform/status', async (req: Request, res: Response) => {
    try {
        const status = await getTransformStatus();
        res.json({ success: true, status });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// HR / SPACE Endpoints
// ==========================================

/**
 * GET /hr/employees
 * List all employees with SPACE overview
 */
router.get('/hr/employees', async (req: Request, res: Response) => {
    try {
        const orgId = (req.query.orgId as string) || 'default';
        const { start, end } = getDateRange(req);

        const overview = await getOrgSpaceOverview(orgId, start, end);

        res.json({
            success: true,
            period: { start, end },
            employees: overview
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /hr/employees/:email/space
 * Get SPACE metrics for a specific employee
 */
router.get('/hr/employees/:email/space', async (req: Request, res: Response) => {
    try {
        const email = req.params.email as string;
        const { start, end } = getDateRange(req);

        const metrics = await calculateSpaceMetrics(email, start, end);

        res.json({
            success: true,
            metrics
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /hr/identities
 * List all identities in an org
 */
router.get('/hr/identities', async (req: Request, res: Response) => {
    try {
        const orgId = (req.query.orgId as string) || 'default';
        const identities = await getOrgIdentities(orgId);

        res.json({
            success: true,
            identities
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// PM / FLOW Endpoints
// ==========================================

/**
 * GET /projects
 * List all projects with FLOW overview
 */
router.get('/projects', async (req: Request, res: Response) => {
    try {
        const orgId = (req.query.orgId as string) || 'default';
        const { start, end } = getDateRange(req);

        const projects = await getOrgProjects(orgId);
        const flowOverview = await getOrgFlowOverview(orgId, start, end);

        res.json({
            success: true,
            period: { start, end },
            projects,
            flowOverview
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /projects/:projectId/flow
 * Get FLOW metrics for a project
 */
router.get('/projects/:projectId/flow', async (req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId as string;
        const { start, end } = getDateRange(req);

        const metrics = await calculateFlowMetrics(projectId, start, end);

        res.json({
            success: true,
            metrics
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// Tech Lead / DORA Endpoints
// ==========================================

/**
 * GET /projects/:projectId/dora
 * Get DORA metrics for a project
 */
router.get('/projects/:projectId/dora', async (req: Request, res: Response) => {
    try {
        const projectId = req.params.projectId as string;
        const { start, end } = getDateRange(req);

        const metrics = await calculateDoraMetrics(projectId, start, end);

        res.json({
            success: true,
            metrics
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * GET /tech/overview
 * Get DORA overview for all projects
 */
router.get('/tech/overview', async (req: Request, res: Response) => {
    try {
        const orgId = (req.query.orgId as string) || 'default';
        const { start, end } = getDateRange(req);

        const overview = await getOrgDoraOverview(orgId, start, end);

        res.json({
            success: true,
            period: { start, end },
            overview
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// AI Insights Endpoints (LLM-powered)
// ==========================================

/**
 * GET /insights
 * Get generated insights
 */
router.get('/insights', async (req: Request, res: Response) => {
    try {
        const orgId = (req.query.orgId as string) || 'default';
        const persona = req.query.persona as string;
        const limit = parseInt(req.query.limit as string) || 20;

        const query: any = { orgId };
        if (persona && persona !== 'all') {
            query.persona = persona;
        }

        const insights = await Insight.find(query)
            .sort({ generatedAt: -1 })
            .limit(limit)
            .lean();

        res.json({ success: true, insights });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * POST /insights/generate
 * Trigger insight generation
 */
router.post('/insights/generate', async (req: Request, res: Response) => {
    try {
        const orgId = (req.body.orgId as string) || 'default';
        const persona = (req.body.persona as string) || 'all';
        const projectId = req.body.projectId as string;
        const { start, end } = getDateRange(req);

        const results: any = {};

        if (persona === 'hr' || persona === 'all') {
            results.hr = await generateHRInsights(orgId, start, end);
        }

        if ((persona === 'product' || persona === 'all') && projectId) {
            results.product = await generateProductInsights(orgId, projectId, start, end);
        }

        if ((persona === 'engineering' || persona === 'all') && projectId) {
            results.engineering = await generateEngineeringInsights(orgId, projectId, start, end);
        }

        res.json({
            success: true,
            generated: results
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * DELETE /insights
 * Clear old insights
 */
router.delete('/insights', async (req: Request, res: Response) => {
    try {
        const orgId = (req.query.orgId as string) || 'default';
        const beforeDate = req.query.before
            ? new Date(req.query.before as string)
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: older than 7 days

        const result = await Insight.deleteMany({
            orgId,
            generatedAt: { $lt: beforeDate }
        });

        res.json({
            success: true,
            deleted: result.deletedCount
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default router;
