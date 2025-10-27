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
  connections: '3,807',
  followers: '3,863'
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

// === Add LinkedIn button dynamically (matches GitHub icon behavior) ===
const linkedinButton = document.createElement('a');
linkedinButton.href = 'https://www.linkedin.com/in/rezonhg';
linkedinButton.target = '_blank';
linkedinButton.rel = 'noopener noreferrer';

const linkedinIcon = document.createElement('img');
linkedinIcon.src = 'https://rezonnn.github.io/portfolio/images/linkedin.jpg';
linkedinIcon.alt = 'LinkedIn';
linkedinIcon.width = 24;
linkedinIcon.height = 24;

linkedinButton.appendChild(linkedinIcon);

// Add to the same .color-scheme container as GitHub + theme toggle
const colorScheme = document.querySelector('.color-scheme');
if (colorScheme) {
  colorScheme.appendChild(linkedinButton);
}
