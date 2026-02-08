import { Activity } from '../../models';

/**
 * SPACE Metrics Service
 * Employee-centric analytics for HR teams
 * 
 * SPACE Framework:
 * S - Satisfaction & Well-being
 * P - Performance
 * A - Activity
 * C - Communication & Collaboration
 * E - Efficiency & Flow
 */

export interface SpaceMetrics {
    employee: {
        email: string;
        displayName?: string;
    };
    period: {
        start: Date;
        end: Date;
    };
    satisfaction: {
        activityBalanceScore: number;    // Balance between dev/comm work (0-100)
        workloadVariance: number;        // How consistent workload is
    };
    performance: {
        completedTickets: number;        // Tickets moved to done
        pullRequestsMerged: number;      // PRs merged
        deploymentsContributed: number;  // Deployments involved in
    };
    activity: {
        totalActivities: number;         // All activities
        commitCount: number;             // GitHub commits
        messageCount: number;            // Slack/Email messages
        ticketUpdates: number;           // Jira activities
        avgActivitiesPerDay: number;     // Daily average
    };
    communication: {
        messagesReceived: number;        // Mentions and direct messages
        mentionsGiven: number;           // Mentions to others
        collaborationScore: number;      // Cross-team interaction score
        uniqueCollaborators: number;     // Distinct people interacted with
    };
    efficiency: {
        avgResponseTime: number;         // Avg time to respond (hours)
        focusTimeRatio: number;          // Ratio of dev work to comm work
        peakActivityHours: string[];     // Most active hours
    };
}

/**
 * Calculate SPACE metrics for an employee
 */
export async function calculateSpaceMetrics(
    email: string,
    startDate: Date,
    endDate: Date
): Promise<SpaceMetrics> {
    const normalizedEmail = email.toLowerCase().trim();

    // Fetch all activities for this employee in the period
    const activities = await Activity.find({
        actorEmail: normalizedEmail,
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group activities by type
    const byType: Record<string, any[]> = {};
    for (const act of activities) {
        const type = act.activityType;
        if (!byType[type]) byType[type] = [];
        byType[type].push(act);
    }

    // Calculate metrics
    const commits = byType['commit'] || [];
    const pullRequests = byType['pull_request'] || [];
    const reviews = byType['review'] || [];
    const messages = [...(byType['message'] || [])];
    const ticketCreated = byType['ticket_created'] || [];
    const statusChanges = byType['status_change'] || [];
    const ticketUpdates = byType['ticket_updated'] || [];
    const deployments = byType['deployment'] || [];

    // Dev activities vs comm activities
    const devActivities = commits.length + pullRequests.length + reviews.length + ticketUpdates.length;
    const commActivities = messages.length;
    const totalActivities = activities.length;

    // Calculate days in period
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Activity balance: ideal is ~70% dev, 30% comm
    const devRatio = totalActivities > 0 ? devActivities / totalActivities : 0;
    const activityBalanceScore = Math.max(0, 100 - Math.abs(devRatio - 0.7) * 100);

    // Workload variance (activity per day)
    const dailyActivityCounts: Record<string, number> = {};
    for (const act of activities) {
        const day = new Date(act.timestamp).toISOString().split('T')[0];
        dailyActivityCounts[day] = (dailyActivityCounts[day] || 0) + 1;
    }
    const dailyCounts = Object.values(dailyActivityCounts);
    const avgDaily = dailyCounts.length > 0 ? dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length : 0;
    const variance = dailyCounts.length > 0
        ? dailyCounts.reduce((sum, c) => sum + Math.pow(c - avgDaily, 2), 0) / dailyCounts.length
        : 0;
    const workloadVariance = Math.sqrt(variance);

    // Count completed tickets (status changed to done/closed)
    const completedTickets = statusChanges.filter(s =>
        s.metadata?.toStatus?.toLowerCase().includes('done') ||
        s.metadata?.toStatus?.toLowerCase().includes('closed') ||
        s.metadata?.toStatus?.toLowerCase().includes('resolved')
    ).length;

    // Count merged PRs
    const pullRequestsMerged = pullRequests.filter(pr =>
        pr.metadata?.merged === true ||
        pr.metadata?.eventAction === 'closed' && pr.metadata?.prState === 'merged'
    ).length;

    // Unique collaborators (from mentions)
    const collaborators = new Set<string>();
    for (const msg of messages) {
        const mentions = msg.metadata?.mentions || [];
        for (const m of mentions) {
            if (m.email && m.email !== normalizedEmail) {
                collaborators.add(m.email);
            }
        }
        const receivers = msg.metadata?.receivers || [];
        for (const r of receivers) {
            if (r && r !== normalizedEmail) {
                collaborators.add(r);
            }
        }
    }

    // Count mentions given
    let mentionsGiven = 0;
    for (const msg of messages) {
        mentionsGiven += (msg.metadata?.mentions?.length || 0);
    }

    // Peak activity hours
    const hourCounts: Record<number, number> = {};
    for (const act of activities) {
        const hour = new Date(act.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([h]) => `${h}:00`);

    return {
        employee: {
            email: normalizedEmail
        },
        period: {
            start: startDate,
            end: endDate
        },
        satisfaction: {
            activityBalanceScore: Math.round(activityBalanceScore),
            workloadVariance: Math.round(workloadVariance * 10) / 10
        },
        performance: {
            completedTickets,
            pullRequestsMerged,
            deploymentsContributed: deployments.length
        },
        activity: {
            totalActivities,
            commitCount: commits.length,
            messageCount: messages.length,
            ticketUpdates: statusChanges.length + ticketUpdates.length,
            avgActivitiesPerDay: Math.round((totalActivities / daysDiff) * 10) / 10
        },
        communication: {
            messagesReceived: 0, // Would need to query mentions TO this user
            mentionsGiven,
            collaborationScore: Math.min(100, collaborators.size * 10),
            uniqueCollaborators: collaborators.size
        },
        efficiency: {
            avgResponseTime: 0, // Would need thread correlation
            focusTimeRatio: totalActivities > 0 ? Math.round((devActivities / totalActivities) * 100) / 100 : 0,
            peakActivityHours: peakHours
        }
    };
}

/**
 * Get SPACE overview for all employees in an org
 */
export async function getOrgSpaceOverview(
    orgId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ email: string; totalActivities: number; completedTickets: number }>> {
    const result = await Activity.aggregate([
        {
            $match: {
                orgId,
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$actorEmail',
                totalActivities: { $sum: 1 },
                statusChanges: {
                    $push: {
                        $cond: [
                            { $eq: ['$activityType', 'status_change'] },
                            '$metadata.toStatus',
                            null
                        ]
                    }
                }
            }
        },
        {
            $project: {
                email: '$_id',
                totalActivities: 1,
                completedTickets: {
                    $size: {
                        $filter: {
                            input: '$statusChanges',
                            as: 'status',
                            cond: {
                                $or: [
                                    { $regexMatch: { input: { $ifNull: ['$$status', ''] }, regex: /done/i } },
                                    { $regexMatch: { input: { $ifNull: ['$$status', ''] }, regex: /closed/i } }
                                ]
                            }
                        }
                    }
                }
            }
        },
        { $sort: { totalActivities: -1 } }
    ]);

    return result;
}

export default {
    calculateSpaceMetrics,
    getOrgSpaceOverview
};
