import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  const container = document.querySelector('.projects');
  renderProjects(container, projects);

  console.log(`Loaded ${projects.length} projects`);
}

loadProjects();
