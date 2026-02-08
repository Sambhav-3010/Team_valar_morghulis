import { Project, IProject, IProjectAliases } from '../models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Project Service
 * Handles project alias resolution and management
 */

type AliasSource = 'github' | 'slack' | 'jira' | 'email';

/**
 * Find project by alias from any source
 */
export async function findProjectByAlias(
    alias: string,
    source?: AliasSource
): Promise<IProject | null> {
    const normalizedAlias = alias.toLowerCase().trim();

    if (source) {
        // Search in specific source
        const query: Record<string, any> = {};
        query[`aliases.${source}`] = normalizedAlias;
        return Project.findOne(query);
    }

    // Search in all sources
    return Project.findOne({
        $or: [
            { 'aliases.github': normalizedAlias },
            { 'aliases.slack': normalizedAlias },
            { 'aliases.jira': normalizedAlias },
            { 'aliases.email': normalizedAlias }
        ]
    });
}

/**
 * Resolve alias to project ID
 */
export async function resolveProjectId(
    alias: string,
    source?: AliasSource
): Promise<string | null> {
    const project = await findProjectByAlias(alias, source);
    return project?.projectId || null;
}

/**
 * Create a new project with initial alias
 */
export async function createProject(
    name: string,
    orgId: string,
    initialAlias?: { source: AliasSource; alias: string },
    description?: string
): Promise<IProject> {
    const projectId = uuidv4();

    const aliases: IProjectAliases = {
        github: [],
        slack: [],
        jira: [],
        email: []
    };

    if (initialAlias) {
        aliases[initialAlias.source] = [initialAlias.alias.toLowerCase().trim()];
    }

    return Project.create({
        projectId,
        name,
        description,
        orgId,
        aliases,
        isActive: true
    });
}

/**
 * Find or create a project by alias
 */
export async function findOrCreateProject(
    alias: string,
    source: AliasSource,
    orgId: string = 'default'
): Promise<IProject> {
    const normalizedAlias = alias.toLowerCase().trim();

    // Try to find existing project
    let project = await findProjectByAlias(normalizedAlias, source);

    if (project) {
        return project;
    }

    // Create new project
    const name = normalizedAlias
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    project = await createProject(name, orgId, { source, alias: normalizedAlias });

    return project;
}

/**
 * Add an alias to an existing project
 */
export async function addProjectAlias(
    projectId: string,
    source: AliasSource,
    alias: string
): Promise<IProject | null> {
    const normalizedAlias = alias.toLowerCase().trim();

    const update: Record<string, any> = {};
    update[`aliases.${source}`] = normalizedAlias;

    return Project.findOneAndUpdate(
        { projectId },
        { $addToSet: update },
        { new: true }
    );
}

/**
 * Remove an alias from a project
 */
export async function removeProjectAlias(
    projectId: string,
    source: AliasSource,
    alias: string
): Promise<IProject | null> {
    const normalizedAlias = alias.toLowerCase().trim();

    const update: Record<string, any> = {};
    update[`aliases.${source}`] = normalizedAlias;

    return Project.findOneAndUpdate(
        { projectId },
        { $pull: update },
        { new: true }
    );
}

/**
 * Get all projects for an organization
 */
export async function getOrgProjects(
    orgId: string,
    activeOnly: boolean = true
): Promise<IProject[]> {
    const query: Record<string, any> = { orgId };
    if (activeOnly) {
        query.isActive = true;
    }
    return Project.find(query).lean();
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string): Promise<IProject | null> {
    return Project.findOne({ projectId });
}

/**
 * Update project details
 */
export async function updateProject(
    projectId: string,
    updates: { name?: string; description?: string; isActive?: boolean }
): Promise<IProject | null> {
    return Project.findOneAndUpdate(
        { projectId },
        { $set: updates },
        { new: true }
    );
}

export default {
    findProjectByAlias,
    resolveProjectId,
    createProject,
    findOrCreateProject,
    addProjectAlias,
    removeProjectAlias,
    getOrgProjects,
    getProject,
    updateProject
};
