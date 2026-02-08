import { Activity } from '../../models';

/**
 * DORA Metrics Service
 * Project-centric technical analytics for Tech Leads
 * 
 * DORA (DevOps Research & Assessment) Metrics:
 * - Deployment Frequency: How often code is deployed
 * - Lead Time for Changes: Time from commit to production
 * - Change Failure Rate: % of deployments causing failures
 * - Mean Time to Restore: Recovery time after incidents
 */

export interface DoraMetrics {
    project: {
        projectId: string;
        projectAlias: string;
    };
    period: {
        start: Date;
        end: Date;
    };
    deploymentFrequency: {
        totalDeployments: number;
        deploymentsPerDay: number;
        deploymentsPerWeek: number;
        level: 'elite' | 'high' | 'medium' | 'low';
    };
    leadTimeForChanges: {
        avgLeadTime: number;            // Hours from commit to deploy
        minLeadTime: number;
        maxLeadTime: number;
        p50LeadTime: number;
        p90LeadTime: number;
        level: 'elite' | 'high' | 'medium' | 'low';
    };
    changeFailureRate: {
        totalChanges: number;
        failedChanges: number;
        failureRate: number;            // Percentage
        level: 'elite' | 'high' | 'medium' | 'low';
    };
    meanTimeToRestore: {
        avgRestoreTime: number;         // Hours
        incidents: number;
        level: 'elite' | 'high' | 'medium' | 'low';
    };
    codeActivity: {
        totalCommits: number;
        totalPRs: number;
        mergedPRs: number;
        avgReviewTime: number;          // Hours
        contributors: number;
    };
}

/**
 * Classify deployment frequency level
 */
function classifyDeploymentFrequency(deploymentsPerDay: number): 'elite' | 'high' | 'medium' | 'low' {
    if (deploymentsPerDay >= 1) return 'elite';      // Multiple per day
    if (deploymentsPerDay >= 0.14) return 'high';    // ~Once per week
    if (deploymentsPerDay >= 0.03) return 'medium';  // ~Once per month
    return 'low';                                     // Less than once per month
}

/**
 * Classify lead time level
 */
function classifyLeadTime(avgHours: number): 'elite' | 'high' | 'medium' | 'low' {
    if (avgHours <= 24) return 'elite';              // Less than 1 day
    if (avgHours <= 168) return 'high';              // Less than 1 week
    if (avgHours <= 720) return 'medium';            // Less than 1 month
    return 'low';                                     // More than 1 month
}

/**
 * Classify change failure rate level
 */
function classifyFailureRate(rate: number): 'elite' | 'high' | 'medium' | 'low' {
    if (rate <= 5) return 'elite';                   // 0-5%
    if (rate <= 10) return 'high';                   // 5-10%
    if (rate <= 15) return 'medium';                 // 10-15%
    return 'low';                                     // 15%+
}

/**
 * Classify MTTR level
 */
function classifyMttr(avgHours: number): 'elite' | 'high' | 'medium' | 'low' {
    if (avgHours <= 1) return 'elite';               // Less than 1 hour
    if (avgHours <= 24) return 'high';               // Less than 1 day
    if (avgHours <= 168) return 'medium';            // Less than 1 week
    return 'low';                                     // More than 1 week
}

/**
 * Calculate DORA metrics for a project
 */
export async function calculateDoraMetrics(
    projectIdOrAlias: string,
    startDate: Date,
    endDate: Date
): Promise<DoraMetrics> {
    // Find GitHub activities for this project
    const activities = await Activity.find({
        $or: [
            { projectId: projectIdOrAlias },
            { projectAlias: projectIdOrAlias }
        ],
        source: 'github',
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by type
    const commits = activities.filter(a => a.activityType === 'commit');
    const pullRequests = activities.filter(a => a.activityType === 'pull_request');
    const reviews = activities.filter(a => a.activityType === 'review');
    const deployments = activities.filter(a => a.activityType === 'deployment');

    // Calculate period
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksDiff = Math.max(1, daysDiff / 7);

    // Deployment Frequency
    const totalDeployments = deployments.length;
    const deploymentsPerDay = Math.round((totalDeployments / daysDiff) * 100) / 100;
    const deploymentsPerWeek = Math.round((totalDeployments / weeksDiff) * 10) / 10;

    // Lead Time for Changes (commit to deployment)
    // This requires correlating commits to deployments - simplified version
    const leadTimes: number[] = [];

    // Group deployments by day
    const deploymentsByDay: Map<string, Date> = new Map();
    for (const dep of deployments) {
        const day = new Date(dep.timestamp).toISOString().split('T')[0];
        if (!deploymentsByDay.has(day) || dep.timestamp > deploymentsByDay.get(day)!) {
            deploymentsByDay.set(day, new Date(dep.timestamp));
        }
    }

    // For each commit, find next deployment
    for (const commit of commits) {
        const commitDate = new Date(commit.timestamp);
        let nextDeployment: Date | null = null;

        for (const [, depDate] of deploymentsByDay) {
            if (depDate >= commitDate) {
                if (!nextDeployment || depDate < nextDeployment) {
                    nextDeployment = depDate;
                }
            }
        }

        if (nextDeployment) {
            const leadTime = (nextDeployment.getTime() - commitDate.getTime()) / (1000 * 60 * 60); // hours
            if (leadTime >= 0 && leadTime < 720) { // Cap at 30 days
                leadTimes.push(leadTime);
            }
        }
    }

    leadTimes.sort((a, b) => a - b);

    const avgLeadTime = leadTimes.length > 0
        ? Math.round((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) * 10) / 10
        : 0;
    const minLeadTime = leadTimes.length > 0 ? Math.round(leadTimes[0] * 10) / 10 : 0;
    const maxLeadTime = leadTimes.length > 0 ? Math.round(leadTimes[leadTimes.length - 1] * 10) / 10 : 0;
    const p50LeadTime = leadTimes.length > 0
        ? Math.round(leadTimes[Math.floor(leadTimes.length * 0.5)] * 10) / 10
        : 0;
    const p90LeadTime = leadTimes.length > 0
        ? Math.round(leadTimes[Math.floor(leadTimes.length * 0.9)] * 10) / 10
        : 0;

    // Change Failure Rate
    // Look for deployment failures in metadata
    const failedDeployments = deployments.filter(d =>
        d.metadata?.deploymentState === 'failure' ||
        d.metadata?.deploymentState === 'error'
    );
    const failureRate = totalDeployments > 0
        ? Math.round((failedDeployments.length / totalDeployments) * 1000) / 10
        : 0;

    // Merged PRs
    const mergedPRs = pullRequests.filter(pr =>
        pr.metadata?.merged === true ||
        (pr.metadata?.eventAction === 'closed' && pr.metadata?.prState === 'merged')
    );

    // Unique contributors
    const contributors = new Set(activities.map(a => a.actorEmail));

    // Average review time (PR open to first review)
    // Simplified: count reviews vs PRs ratio
    const avgReviewTime = pullRequests.length > 0 && reviews.length > 0
        ? Math.round((24 * pullRequests.length / reviews.length) * 10) / 10 // Rough estimate
        : 0;

    return {
        project: {
            projectId: projectIdOrAlias,
            projectAlias: projectIdOrAlias
        },
        period: {
            start: startDate,
            end: endDate
        },
        deploymentFrequency: {
            totalDeployments,
            deploymentsPerDay,
            deploymentsPerWeek,
            level: classifyDeploymentFrequency(deploymentsPerDay)
        },
        leadTimeForChanges: {
            avgLeadTime,
            minLeadTime,
            maxLeadTime,
            p50LeadTime,
            p90LeadTime,
            level: classifyLeadTime(avgLeadTime)
        },
        changeFailureRate: {
            totalChanges: totalDeployments,
            failedChanges: failedDeployments.length,
            failureRate,
            level: classifyFailureRate(failureRate)
        },
        meanTimeToRestore: {
            avgRestoreTime: 0,             // Would need incident tracking
            incidents: 0,
            level: 'high'                  // Default since no incident data
        },
        codeActivity: {
            totalCommits: commits.length,
            totalPRs: pullRequests.length,
            mergedPRs: mergedPRs.length,
            avgReviewTime,
            contributors: contributors.size
        }
    };
}

/**
 * Get DORA overview for all projects in an org
 */
export async function getOrgDoraOverview(
    orgId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ projectAlias: string; deployments: number; commits: number; prs: number }>> {
    const result = await Activity.aggregate([
        {
            $match: {
                orgId,
                source: 'github',
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$projectAlias',
                deployments: {
                    $sum: { $cond: [{ $eq: ['$activityType', 'deployment'] }, 1, 0] }
                },
                commits: {
                    $sum: { $cond: [{ $eq: ['$activityType', 'commit'] }, 1, 0] }
                },
                prs: {
                    $sum: { $cond: [{ $eq: ['$activityType', 'pull_request'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                projectAlias: '$_id',
                deployments: 1,
                commits: 1,
                prs: 1
            }
        },
        { $sort: { deployments: -1 } }
    ]);

    return result;
}

export default {
    calculateDoraMetrics,
    getOrgDoraOverview
};
