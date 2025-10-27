import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('Rezonnn');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
  profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}

// --- LinkedIn stats (manual numbers since there is no public API) ---
const linkedinData = {
  connections: '500+',   // LinkedIn caps public display at "500+"
  followers: 1200        // put your latest follower count if visible
};

const linkedinStats = document.querySelector('#linkedin-stats');
if (linkedinStats) {
  linkedinStats.innerHTML = `
    <dl>
      <dt>Connections</dt><dd>${linkedinData.connections}</dd>
      <dt>Followers</dt><dd>${linkedinData.followers}</dd>
    </dl>
  `;
}
