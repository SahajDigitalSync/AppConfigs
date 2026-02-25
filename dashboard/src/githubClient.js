import { Octokit } from 'octokit'

// The GitHub PAT should be stored in your .env file as VITE_GITHUB_TOKEN
// Warning: In a production app with sensitive repos, it's safer to proxy GitHub API 
// calls through a secure backend rather than exposing the PAT in the frontend bundle.
// For this single-tenant admin dashboard, we will use it client-side.
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN

// Initialize Octokit
export const octokit = new Octokit({
    auth: GITHUB_TOKEN
})

const OWNER = 'SahajDigitalSync'
const REPO = 'AppConfigs'

/**
 * Fetches the content of a JSON config file from the AppConfigs repository.
 * @param {string} filename The name of the file (e.g., 'connect_3d.json')
 * @returns {Promise<{ content: object, sha: string }>} The parsed JSON config and the file's SHA for updating.
 */
export const fetchConfigFromGitHub = async (filename) => {
    try {
        const response = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: filename,
        })

        if (response.data && response.data.content) {
            // GitHub API returns content as base64
            const decodedContent = atob(response.data.content)
            const parsedJson = JSON.parse(decodedContent)

            return {
                content: parsedJson,
                sha: response.data.sha // We need the SHA to update the file later
            }
        }

        throw new Error('File content not found.')
    } catch (error) {
        if (error.status === 404) {
            throw new Error(`File ${filename} not found in repository.`)
        }
        console.error('GitHub Fetch Error:', error)
        throw new Error('Failed to fetch configuration from GitHub.')
    }
}

/**
 * Commits a modified JSON config back to the AppConfigs repository.
 * @param {string} filename The name of the file (e.g., 'connect_3d.json')
 * @param {object} newContent The fully updated JSON object to save
 * @param {string} sha The original SHA of the file (required by GitHub for updates)
 * @param {string} commitMessage The commit message detailing the change
 */
export const commitConfigToGitHub = async (filename, newContent, sha, commitMessage) => {
    try {
        // Convert JSON object back to a beautifully formatted string
        const jsonString = JSON.stringify(newContent, null, 2)

        // GitHub API requires the new content to be base64 encoded
        const encodedContent = btoa(jsonString)

        const response = await octokit.rest.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: filename,
            message: commitMessage || `Updated ${filename} via Admin Dashboard`,
            content: encodedContent,
            sha: sha // This proves we are overriding the current version
        })

        return response.data
    } catch (error) {
        console.error('GitHub Commit Error:', error)
        throw new Error('Failed to save changes to GitHub.')
    }
}
