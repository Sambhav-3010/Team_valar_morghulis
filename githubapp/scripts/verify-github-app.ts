
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

import { getAppOctokit, getInstallationOctokit, getUserInstallationId } from '../src/services/githubApp';

async function testGitHubApp() {
    console.log('Testing GitHub App Authentication...');

    try {
        // 1. Test App Authentication
        console.log('\n1. Testing App Authentication...');
        const appOctokit = getAppOctokit();
        const { data: appData } = await appOctokit.rest.apps.getAuthenticated();
        console.log(`✅ Authenticated as App: ${appData.name} (ID: ${appData.id})`);

        // 2. List Installations
        console.log('\n2. Listing Installations...');
        const { data: installations } = await appOctokit.rest.apps.listInstallations();
        console.log(`✅ Found ${installations.length} installations.`);

        if (installations.length === 0) {
            console.log('⚠️ No installations found. Install the app on your account to proceed.');
            return;
        }

        const installation = installations[0];
        console.log(`Using installation ID: ${installation.id} for account: ${installation.account?.login}`);

        // 3. Test Installation Authentication
        console.log('\n3. Testing Installation Authentication...');
        const installationOctokit = await getInstallationOctokit(installation.id);
        const { data: repos } = await installationOctokit.rest.repos.listForOrg({
            org: installation.account?.login || '',
            per_page: 5
        }).catch(async () => {
            // If org list fails, try user list
            return await installationOctokit.rest.repos.listForUser({
                username: installation.account?.login || '',
                per_page: 5
            });
        });

        console.log(`✅ Successfully fetched ${repos.length} repositories using installation token.`);
        repos.forEach(repo => console.log(` - ${repo.full_name} (${repo.private ? 'Private' : 'Public'})`));

        // 4. Test User Installation Lookup
        if (installation.account?.login) {
            console.log(`\n4. Testing User Installation Lookup for ${installation.account.login}...`);
            // Mocking the DB lookups for this standalone script if needed, 
            // but here we are testing the service function which might hit the DB or API.
            // Ensure DB connection if testing full flow, or just test API fallback part of the service if DB not connected.
            // For this script, we'll rely on the API fallback in getUserInstallationId if DB is not connected.

            // Note: getUserInstallationId needs DB connection to work fully as designed, 
            // but the API fallback should work if we comment out DB parts or if we connect DB.
            // Let's just test the direct API calls for now to verify credentials.

            console.log('Skipping DB-dependent test in this script. Credentials verified via direct Octokit calls.');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Body:', error.response.data);
        }
    }
}

testGitHubApp();
