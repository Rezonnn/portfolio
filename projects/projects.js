import { fetchJSON, renderProjects } from '../global.js';

async function loadProjects() {
  const projects = await fetchJSON('../lib/projects.json');
  if (Array.isArray(projects) && projects.length) {
    const container = document.querySelector('.projects');
    renderProjects(container, projects);
    console.log(`Loaded ${projects.length} projects`);
  } else {
    console.error('No projects found or failed to load projects.json');
  }
}

loadProjects();
