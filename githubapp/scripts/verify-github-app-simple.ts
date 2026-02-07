
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const { App } = require('octokit');

async function testGitHubApp() {
    console.log('Testing GitHub App Authentication...');

    try {
        const appId = process.env.APP_ID;
        const privateKey = process.env.PRIVATE_KEY;

        if (!appId || !privateKey) {
            throw new Error('Missing APP_ID or PRIVATE_KEY environment variables');
        }

        const app = new App({
            appId: appId,
            privateKey: privateKey,
        });

        // 1. Test App Authentication
        console.log('\n1. Testing App Authentication...');
        const appOctokit = app.octokit;
        const { data: appData } = await appOctokit.request('GET /app');
        console.log(`✅ Authenticated as App: ${appData.name} (ID: ${appData.id})`);

        // 2. List Installations
        console.log('\n2. Listing Installations...');
        const { data: installations } = await appOctokit.request('GET /app/installations');
        console.log(`✅ Found ${installations.length} installations.`);

        if (installations.length === 0) {
            console.log('⚠️ No installations found. Install the app on your account to proceed.');
            return;
        }

        const installation = installations[0];
        console.log(`Using installation ID: ${installation.id} for account: ${installation.account?.login}`);

        // 3. Test Installation Authentication
        console.log('\n3. Testing Installation Authentication...');
        const installationOctokit = await app.getInstallationOctokit(installation.id);

        // Try listing repos for the installation
        const { data: repos } = await installationOctokit.request('GET /installation/repositories', {
            per_page: 5
        });

        console.log(`✅ Successfully fetched ${repos.repositories.length} repositories using installation token.`);
        repos.repositories.forEach((repo: any) => console.log(` - ${repo.full_name} (${repo.private ? 'Private' : 'Public'})`));

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Body:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGitHubApp();
