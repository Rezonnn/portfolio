import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// --- Load data and find containers ---
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const searchInput = document.querySelector('.searchBar');

// --- Visual constants (Step 1) ---
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// --- UI state (Steps 4 & 5) ---
let query = '';
let selectedIndex = -1; // -1 means "no slice selected"

// --- Helper: apply search filter (Step 4) ---
function currentSearchFiltered(arr) {
  if (!query) return arr;
  return arr.filter(p =>
    Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase())
  );
}

// --- Step 2 + 3 + 5: render pie and legend for a given list of projects ---
function renderPieAndLegend(projectsGiven) {
  // Group by year and count (Step 3)
  const rolled = d3.rollups(projectsGiven, v => v.length, d => d.year);
  const data = rolled.map(([year, count]) => ({ value: count, label: String(year) }));

  // Build arcs
  const slice = d3.pie().value(d => d.value)(data);

  // Clear old visuals before drawing (Step 4.4 guidance)
  svg.selectAll('*').remove();
  legend.selectAll('*').remove();

  // Draw arcs
  slice.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('data-index', i)
      .attr('aria-selected', String(i === selectedIndex))
      .on('click', () => {
        selectedIndex = (selectedIndex === i) ? -1 : i; // toggle selection (Step 5.2)
        applyFiltersAndRender(projects);                 // Step 5.3 + 5.4: combine filters
      });
  });

  // Build legend (Step 2.2) + click to select (Step 5.2)
  const items = legend.selectAll('li')
    .data(slice)
    .join('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .attr('aria-selected', (_, i) => String(i === selectedIndex))
    .html(d => `<span class="swatch"></span> ${d.data.label} <em>(${d.data.value})</em>`);

  items.on('click', (_, d) => {
    const idx = slice.indexOf(d);
    selectedIndex = (selectedIndex === idx) ? -1 : idx; // toggle
    applyFiltersAndRender(projects);
  });
}

// --- Coordinator: combine search + (optional) year selection (Step 5.4 extra credit) ---
function applyFiltersAndRender(allProjects) {
  // 1) Search first (Step 4)
  const afterSearch = currentSearchFiltered(allProjects);

  // 2) Then (optionally) filter by selected year (Step 5.3)
  let toShow = afterSearch;
  if (selectedIndex !== -1) {
    // Recompute slice mapping against the *search-filtered* set
    const rolled = d3.rollups(afterSearch, v => v.length, d => d.year);
    const data = rolled.map(([year, count]) => ({ value: count, label: String(year) }));
    const slice = d3.pie().value(d => d.value)(data);

    // If selection no longer valid under search, reset
    if (!slice[selectedIndex]) {
      selectedIndex = -1;
    } else {
      const selectedYear = slice[selectedIndex].data.label;
      toShow = afterSearch.filter(p => String(p.year) === String(selectedYear));
    }
  }

  // 3) Render cards and visuals from the *same* filtered set
  renderProjects(toShow, projectsContainer, 'h2');
  renderPieAndLegend(toShow);
}

// --- Wire search (Step 4.2/4.3) ---
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    query = e.target.value;
    applyFiltersAndRender(projects);
  });
}

// --- Initial paint (Step 0 + 3) ---
renderProjects(projects, projectsContainer, 'h2');
renderPieAndLegend(projects);
