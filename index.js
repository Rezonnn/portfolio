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
  followers: '3,863',
  viewers: '182',
  searches: '71'
};

const linkedinStats = document.querySelector('#linkedin-stats');
if (linkedinStats) {
  linkedinStats.innerHTML = `
    <dl>
      <dt>Connections:</dt><dd>${linkedinData.connections}</dd>
      <dt>Followers:</dt><dd>${linkedinData.followers}</dd>
      <dt>Profile Viewers:</dt><dd>${linkedinData.viewers}</dd>
      <dt>Search Appearances:</dt><dd>${linkedinData.searches}</dd>
    </dl>
  `;
}

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        status.textContent = '✅ Thanks! Your message has been sent successfully.';
        form.reset();
      } else {
        status.textContent = '⚠️ Something went wrong. Please try again later.';
      }
    } catch {
      status.textContent = '🚫 Network error. Please check your connection.';
    }
  });
}
