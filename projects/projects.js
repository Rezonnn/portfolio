import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// Load data + element refs
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const searchInput = document.querySelector('.searchBar');
const clearBtn = document.getElementById('clear-year');

// Visual constants (Step 1)
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// UI state (Steps 4 & 5)
let query = '';
let selectedIndex = -1; // -1 = no selection

// Smooth arc transitions
const tDur = 350;
function arcTween(newD, arcGen) {
  const i = d3.interpolate(this._current || newD, newD);
  this._current = i(1);
  return t => arcGen(i(t));
}

// Search filter (Step 4)
function afterSearchFilter(arr) {
  if (!query) return arr;
  const q = query.toLowerCase();
  return arr.filter(p => Object.values(p).join('\n').toLowerCase().includes(q));
}

// Render pie & legend (Steps 2–3, 5)
function renderPieAndLegend(projectsGiven) {
  // roll up by year, sort newest → oldest (matches the video)
  const rolled = d3.rollups(projectsGiven, v => v.length, d => String(d.year));
  rolled.sort((a, b) => b[0].localeCompare(a[0]));
  const data = rolled.map(([label, value]) => ({ label, value }));

  const pie = d3.pie().value(d => d.value);
  const arcs = pie(data);

  // ----- PIE (stable keyed join for nice transitions) -----
  const paths = svg.selectAll('path').data(arcs, d => d.data.label);

  paths.exit()
    .transition().duration(tDur)
    .style('opacity', 0)
    .remove();

  paths
    .attr('aria-selected', (d, i) => String(i === selectedIndex))
    .transition().duration(tDur)
    .attrTween('d', function(d){ return arcTween.call(this, d, arcGenerator); });

  paths.enter()
    .append('path')
    .attr('fill', (_, i) => colors(i))
    .attr('tabindex', 0)
    .attr('aria-label', d => `Year ${d.data.label}, ${d.data.value} project(s)`)
    .attr('aria-selected', (_, i) => String(i === selectedIndex))
    .each(function(d){ this._current = d; })
    .on('click', (_, d) => {
      const i = arcs.indexOf(d);
      selectedIndex = (selectedIndex === i) ? -1 : i;
      applyFiltersAndRender(projects);
    })
    .on('keydown', (evt, d) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        const i = arcs.indexOf(d);
        selectedIndex = (selectedIndex === i) ? -1 : i;
        applyFiltersAndRender(projects);
      }
    })
    .transition().duration(tDur)
    .attrTween('d', function(d){ return arcTween.call(this, d, arcGenerator); });

  // ----- LEGEND -----
  const items = legend.selectAll('li').data(arcs, d => d.data.label);

  items.exit().remove();

  const enter = items.enter()
    .append('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .attr('tabindex', 0)
    .html(d => `<span class="swatch"></span> ${d.data.label} <em>(${d.data.value})</em>`)
    .on('click', (_, d) => {
      const i = arcs.indexOf(d);
      selectedIndex = (selectedIndex === i) ? -1 : i;
      applyFiltersAndRender(projects);
    })
    .on('keydown', (evt, d) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        const i = arcs.indexOf(d);
        selectedIndex = (selectedIndex === i) ? -1 : i;
        applyFiltersAndRender(projects);
      }
    });

  enter.merge(items)
    .attr('aria-selected', (_, i) => String(i === selectedIndex));

  // Show/hide the Clear button (extra credit UX)
  if (clearBtn) clearBtn.hidden = (selectedIndex === -1);
}

// Coordinator: search first, then (optional) year (Step 5.4)
function applyFiltersAndRender(allProjects) {
  // 1) search
  const afterSearch = afterSearchFilter(allProjects);

  // 2) then year (if selected)
  let toShow = afterSearch;
  if (selectedIndex !== -1) {
    const rolled = d3.rollups(afterSearch, v => v.length, d => String(d.year));
    const slice = d3.pie().value(d => d.value)(
      rolled.map(([label, value]) => ({ label, value }))
    );

    if (!slice[selectedIndex]) {
      selectedIndex = -1; // selection invalid under current search
    } else {
      const selectedYear = slice[selectedIndex].data.label;
      toShow = afterSearch.filter(p => String(p.year) === selectedYear);
    }
  }

  // 3) render cards + pie/legend from the same filtered set
  renderProjects(toShow, projectsContainer, 'h2');
  renderPieAndLegend(toShow);
}

// Live search (Step 4.2/4.3)
if (searchInput) {
  searchInput.addEventListener('input', e => {
    query = e.target.value;
    applyFiltersAndRender(projects);
  });
}

// Clear year selection (extra credit UX)
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    selectedIndex = -1;
    applyFiltersAndRender(projects);
  });
}

// Initial paint (Step 0 + Step 3)
renderProjects(projects, projectsContainer, 'h2');
renderPieAndLegend(projects);
