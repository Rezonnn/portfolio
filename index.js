import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');

if (Array.isArray(projects) && projects.length) {
  const latestProjects = projects.slice(0, 3);
  const projectsContainer = document.querySelector('.projects');
  if (projectsContainer) {
    renderProjects(projectsContainer, latestProjects);
  }
} else {
  console.error("No projects found or failed to load projects.json");
}

const GITHUB_USERNAME = "Rezonnn";
const githubData = await fetchGitHubData(GITHUB_USERNAME);

const profileStats = document.querySelector('#profile-stats');
if (profileStats && githubData && !Array.isArray(githubData)) {
  profileStats.innerHTML = `
    <h2>GitHub Profile</h2>
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}
