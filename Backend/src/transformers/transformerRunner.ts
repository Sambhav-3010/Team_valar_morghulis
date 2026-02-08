import mongoose from 'mongoose';
import { transformEmails } from './emailTransformer';
import { transformSlackMessages } from './slackTransformer';
import { transformJiraIssues } from './jiraTransformer';
import { transformGitHubEvents } from './githubTransformer';

/**
 * Transformer Runner
 * Orchestrates all transformation jobs
 */

// Track transformation state
const TransformStateSchema = new mongoose.Schema({
    source: { type: String, required: true, unique: true },
    lastRunAt: { type: Date },
    lastSuccessAt: { type: Date },
    lastError: { type: String },
    isRunning: { type: Boolean, default: false }
}, { timestamps: true });

const TransformState = mongoose.models.TransformState ||
    mongoose.model('TransformState', TransformStateSchema);

export interface TransformResult {
    processed: number;
    created: number;
    skipped: number;
    errors: number;
}

export interface RunResult {
    source: string;
    success: boolean;
    result?: TransformResult;
    error?: string;
    duration: number;
}

/**
 * Get state for a source
 */
async function getState(source: string) {
    let state = await TransformState.findOne({ source });
    if (!state) {
        state = await TransformState.create({ source });
    }
    return state;
}

/**
 * Update state after run
 */
async function updateState(
    source: string,
    success: boolean,
    error?: string
) {
    const update: Record<string, any> = {
        lastRunAt: new Date(),
        isRunning: false
    };

    if (success) {
        update.lastSuccessAt = new Date();
        update.lastError = null;
    } else {
        update.lastError = error;
    }

    await TransformState.updateOne({ source }, { $set: update });
}

/**
 * Run single transformer
 */
async function runTransformer(
    source: string,
    transformer: (since?: Date) => Promise<TransformResult>
): Promise<RunResult> {
    const startTime = Date.now();

    try {
        // Check if already running
        const state = await getState(source);
        if (state.isRunning) {
            return {
                source,
                success: false,
                error: 'Transformation already in progress',
                duration: 0
            };
        }

        // Mark as running
        await TransformState.updateOne(
            { source },
            { $set: { isRunning: true } }
        );

        // Get since date (last successful run or 30 days ago)
        const since = state.lastSuccessAt ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Run transformer
        const result = await transformer(since);

        // Update state
        await updateState(source, true);

        return {
            source,
            success: true,
            result,
            duration: Date.now() - startTime
        };
    } catch (err: any) {
        await updateState(source, false, err.message);

        return {
            source,
            success: false,
            error: err.message,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Run all transformers
 */
export async function runAllTransformers(): Promise<RunResult[]> {
    console.log('Starting transformation pipeline...');

    const results: RunResult[] = [];

    // Run transformers sequentially to avoid overwhelming the DB
    console.log('  Running email transformer...');
    results.push(await runTransformer('email', transformEmails));

    console.log('  Running slack transformer...');
    results.push(await runTransformer('slack', transformSlackMessages));

    console.log('  Running jira transformer...');
    results.push(await runTransformer('jira', transformJiraIssues));

    console.log('  Running github transformer...');
    results.push(await runTransformer('github', transformGitHubEvents));

    console.log('Transformation pipeline complete.');

    // Log summary
    for (const r of results) {
        if (r.success) {
            console.log(`  ${r.source}: processed=${r.result?.processed}, created=${r.result?.created}, skipped=${r.result?.skipped}, errors=${r.result?.errors}, duration=${r.duration}ms`);
        } else {
            console.log(`  ${r.source}: failed - ${r.error}`);
        }
    }

    return results;
}

/**
 * Run specific transformer
 */
export async function runTransformerBySource(source: string): Promise<RunResult> {
    switch (source) {
        case 'email':
            return runTransformer('email', transformEmails);
        case 'slack':
            return runTransformer('slack', transformSlackMessages);
        case 'jira':
            return runTransformer('jira', transformJiraIssues);
        case 'github':
            return runTransformer('github', transformGitHubEvents);
        default:
            return {
                source,
                success: false,
                error: `Unknown source: ${source}`,
                duration: 0
            };
    }
}

/**
 * Get transformation status for all sources
 */
export async function getTransformStatus(): Promise<any[]> {
    return TransformState.find({}).lean();
}

export default {
    runAllTransformers,
    runTransformerBySource,
    getTransformStatus
};
