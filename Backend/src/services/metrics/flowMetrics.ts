import { Activity } from '../../models';

/**
 * FLOW Metrics Service
 * Project-centric analytics for Product Managers
 * 
 * FLOW Framework:
 * - Flow Velocity: Completed work items per time window
 * - Flow Time: Duration from creation to completion
 * - Flow Load: Active work items count
 * - Flow Efficiency: Ratio of active to waiting time
 */

export interface FlowMetrics {
    project: {
        projectId: string;
        projectAlias: string;
    };
    period: {
        start: Date;
        end: Date;
    };
    velocity: {
        completedItems: number;         // Tickets completed in period
        velocityPerWeek: number;        // Avg items per week
        velocityTrend: 'up' | 'down' | 'stable';
    };
    time: {
        avgFlowTime: number;            // Avg hours from create to done
        minFlowTime: number;            // Fastest completion
        maxFlowTime: number;            // Slowest completion
        p50FlowTime: number;            // Median flow time
        p90FlowTime: number;            // 90th percentile
    };
    load: {
        activeItems: number;            // Currently in progress
        newItems: number;               // Created in period
        completedItems: number;         // Completed in period
        netChange: number;              // new - completed
    };
    efficiency: {
        flowEfficiency: number;         // % time actively worked
        throughputRate: number;         // Items per day
        blockedItems: number;           // Items that were blocked
    };
    distribution: {
        byType: Record<string, number>; // Count by issue type
        byPriority: Record<string, number>; // Count by priority
    };
}

/**
 * Calculate FLOW metrics for a project
 */
export async function calculateFlowMetrics(
    projectIdOrAlias: string,
    startDate: Date,
    endDate: Date
): Promise<FlowMetrics> {
    // Find activities for this project
    const activities = await Activity.find({
        $or: [
            { projectId: projectIdOrAlias },
            { projectAlias: projectIdOrAlias }
        ],
        source: 'jira',
        timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    // Group by ticket
    const ticketMap: Map<string, any[]> = new Map();
    for (const act of activities) {
        const ticket = act.metadata?.ticket || 'unknown';
        if (!ticketMap.has(ticket)) {
            ticketMap.set(ticket, []);
        }
        ticketMap.get(ticket)!.push(act);
    }

    // Calculate metrics
    const ticketCreated = activities.filter(a => a.activityType === 'ticket_created');
    const statusChanges = activities.filter(a => a.activityType === 'status_change');

    // Completed items: status changed to done/closed
    const completedChanges = statusChanges.filter(s =>
        s.metadata?.toStatus?.toLowerCase().includes('done') ||
        s.metadata?.toStatus?.toLowerCase().includes('closed') ||
        s.metadata?.toStatus?.toLowerCase().includes('resolved')
    );
    const completedTickets = new Set(completedChanges.map(c => c.metadata?.ticket));
    const completedItems = completedTickets.size;

    // New items
    const newItems = ticketCreated.length;

    // Calculate period in weeks
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksDiff = Math.max(1, daysDiff / 7);

    // Velocity per week
    const velocityPerWeek = Math.round((completedItems / weeksDiff) * 10) / 10;

    // Flow times (for completed tickets)
    const flowTimes: number[] = [];
    for (const ticket of completedTickets) {
        const ticketActs = ticketMap.get(ticket) || [];
        const created = ticketActs.find(a => a.activityType === 'ticket_created');
        const completed = ticketActs.find(a =>
            a.activityType === 'status_change' &&
            (a.metadata?.toStatus?.toLowerCase().includes('done') ||
                a.metadata?.toStatus?.toLowerCase().includes('closed'))
        );

        if (created && completed) {
            const flowTime = (new Date(completed.timestamp).getTime() - new Date(created.timestamp).getTime()) / (1000 * 60 * 60); // hours
            if (flowTime > 0) {
                flowTimes.push(flowTime);
            }
        }
    }

    // Sort flow times for percentiles
    flowTimes.sort((a, b) => a - b);

    const avgFlowTime = flowTimes.length > 0
        ? Math.round((flowTimes.reduce((a, b) => a + b, 0) / flowTimes.length) * 10) / 10
        : 0;
    const minFlowTime = flowTimes.length > 0 ? Math.round(flowTimes[0] * 10) / 10 : 0;
    const maxFlowTime = flowTimes.length > 0 ? Math.round(flowTimes[flowTimes.length - 1] * 10) / 10 : 0;
    const p50FlowTime = flowTimes.length > 0
        ? Math.round(flowTimes[Math.floor(flowTimes.length * 0.5)] * 10) / 10
        : 0;
    const p90FlowTime = flowTimes.length > 0
        ? Math.round(flowTimes[Math.floor(flowTimes.length * 0.9)] * 10) / 10
        : 0;

    // Active items (created but not completed in period)
    const createdTickets = new Set(ticketCreated.map(c => c.metadata?.ticket));
    const activeItems = Math.max(0, createdTickets.size - completedItems);

    // Throughput rate
    const throughputRate = Math.round((completedItems / daysDiff) * 100) / 100;

    // Distribution by type
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const act of ticketCreated) {
        const type = act.metadata?.issueType || 'Unknown';
        const priority = act.metadata?.priority || 'Unknown';
        byType[type] = (byType[type] || 0) + 1;
        byPriority[priority] = (byPriority[priority] || 0) + 1;
    }

    return {
        project: {
            projectId: projectIdOrAlias,
            projectAlias: projectIdOrAlias
        },
        period: {
            start: startDate,
            end: endDate
        },
        velocity: {
            completedItems,
            velocityPerWeek,
            velocityTrend: 'stable' // Would need historical data to calculate
        },
        time: {
            avgFlowTime,
            minFlowTime,
            maxFlowTime,
            p50FlowTime,
            p90FlowTime
        },
        load: {
            activeItems,
            newItems,
            completedItems,
            netChange: newItems - completedItems
        },
        efficiency: {
            flowEfficiency: 0, // Would need more detailed time tracking
            throughputRate,
            blockedItems: 0 // Would need blocked status tracking
        },
        distribution: {
            byType,
            byPriority
        }
    };
}

/**
 * Get FLOW overview for all projects in an org
 */
export async function getOrgFlowOverview(
    orgId: string,
    startDate: Date,
    endDate: Date
): Promise<Array<{ projectAlias: string; completedItems: number; newItems: number }>> {
    const result = await Activity.aggregate([
        {
            $match: {
                orgId,
                source: 'jira',
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$projectAlias',
                newItems: {
                    $sum: { $cond: [{ $eq: ['$activityType', 'ticket_created'] }, 1, 0] }
                },
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
                projectAlias: '$_id',
                newItems: 1,
                completedItems: {
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
        { $sort: { completedItems: -1 } }
    ]);

    return result;
}

export default {
    calculateFlowMetrics,
    getOrgFlowOverview
};
