import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// ---- Load data + element refs ----
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
const searchInput = document.querySelector('.searchBar');
const clearBtn = document.getElementById('clear-year');

// ---- Visual constants (Lab 5) ----
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// ---- UI state (Lab 5 + 5.4) ----
// Track selection by YEAR VALUE (robust when search changes the data).
let query = '';
let selectedYear = null; // e.g., '2024' or null

// ---- Helpers ----
function searchFilter(list) {
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(p => Object.values(p).join('\n').toLowerCase().includes(q));
}

function visibleProjects(all) {
  // Step 5.4: search first, then (optional) year filter
  const afterSearch = searchFilter(all);
  if (!selectedYear) return afterSearch;
  return afterSearch.filter(p => String(p.year) === String(selectedYear));
}

function rollupYearCounts(list) {
  // [{label:'2025', value:3}, {label:'2024', value:5}, ...] newest → oldest
  const rolled = d3.rollups(list, v => v.length, d => String(d.year));
  rolled.sort((a, b) => b[0].localeCompare(a[0]));
  return rolled.map(([label, value]) => ({ label, value }));
}

// Smooth arc transitions (nice polish; optional)
const tDur = 350;
function arcTween(newD, arcGen) {
  const i = d3.interpolate(this._current || newD, newD);
  this._current = i(1);
  return t => arcGen(i(t));
}

// ---- Pie + Legend (Steps 2–3, 5.2) ----
function renderPieAndLegend(list) {
  const data = rollupYearCounts(list);
  const pie  = d3.pie().value(d => d.value);
  const arcs = pie(data);

  // ----- PIE (key by label for stable joins) -----
  const paths = svg.selectAll('path').data(arcs, d => d.data.label);

  paths.exit()
    .transition().duration(tDur)
    .style('opacity', 0)
    .remove();

  paths
    .attr('aria-selected', d => String(d.data.label === selectedYear))
    .transition().duration(tDur)
    .attrTween('d', function(d){ return arcTween.call(this, d, arcGenerator); });

  paths.enter()
    .append('path')
    .attr('fill', (_, i) => colors(i))
    .attr('tabindex', 0)
    .attr('aria-label', d => `Year ${d.data.label}, ${d.data.value} project(s)`)
    .attr('aria-selected', d => String(d.data.label === selectedYear))
    .each(function(d){ this._current = d; })
    .on('click', (_, d) => {
      const y = d.data.label;
      selectedYear = (selectedYear === y) ? null : y; // Step 5.2: toggle
      renderAll();                                    // Step 5.4: combines with search
    })
    .on('keydown', (evt, d) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        const y = d.data.label;
        selectedYear = (selectedYear === y) ? null : y;
        renderAll();
      }
    })
    .transition().duration(tDur)
    .attrTween('d', function(d){ return arcTween.call(this, d, arcGenerator); });

  // ----- LEGEND (clickable, mirrors selection) -----
  const items = legend.selectAll('li').data(arcs, d => d.data.label);

  items.exit().remove();

  const enter = items.enter()
    .append('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .attr('tabindex', 0)
    .html(d => `<span class="swatch"></span> ${d.data.label} <em>(${d.data.value})</em>`)
    .on('click', (_, d) => {
      const y = d.data.label;
      selectedYear = (selectedYear === y) ? null : y; // Step 5.2
      renderAll();
    })
    .on('keydown', (evt, d) => {
      if (evt.key === 'Enter' || evt.key === ' ') {
        evt.preventDefault();
        const y = d.data.label;
        selectedYear = (selectedYear === y) ? null : y;
        renderAll();
      }
    });

  enter.merge(items)
    .attr('aria-selected', d => String(d.data.label === selectedYear));

  // Optional UX: show a clear button only when a year is selected
  if (clearBtn) clearBtn.hidden = !selectedYear;
}

// ---- Cards (reuse your lab render) ----
function renderCards(list) {
  renderProjects(list, projectsContainer, 'h2');
}

// ---- One coordinator that ALWAYS: search → (optional) year → render both ----
function renderAll() {
  const vis = visibleProjects(projects);
  renderCards(vis);
  renderPieAndLegend(vis);
}

// ---- Wire search (live) ----
if (searchInput) {
  searchInput.addEventListener('input', e => {
    query = e.target.value;
    renderAll(); // Step 5.4: keeps search + year combined in both directions
  });
}

// ---- Clear year selection (optional UX) ----
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    selectedYear = null;
    renderAll();
  });
}

// ---- Initial paint ----
renderAll();
