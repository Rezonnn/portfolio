import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const svg = d3.select('#projects-pie-plot');

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});

d3.select('svg')
  .append('path')
  .attr('d', arc)
  .attr('fill', 'red');

const svg2 = d3.select('#projects-pie-plot');
svg2.selectAll('*').remove();

let data = [1, 2];

let total = 0;
for (let d of data) {
  total += d;
}

let angle = 0;
let arcData = [];
for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

let arcs = arcData.map((d) => arcGenerator(d));

let colors = ['gold', 'purple'];

arcs.forEach((arc, idx) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors[idx]);
});

d3.select('#projects-pie-plot').selectAll('*').remove();

data = [1, 2];
let sliceGenerator = d3.pie();
let arcData2 = sliceGenerator(data);
let arcs2 = arcData2.map((d) => arcGenerator(d));

arcs2.forEach((arc, idx) => {
  d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', colors[idx]);
});

// Step 1.5: more slices + ordinal color scale
d3.select('#projects-pie-plot').selectAll('*').remove();

let dataMany = [1, 2, 3, 4, 5, 5];

let sliceGeneratorMany = d3.pie();
let arcDataMany = sliceGeneratorMany(dataMany);
let arcsMany = arcDataMany.map((d) => arcGenerator(d));

// D3 categorical palette (lab shows using a scale; schemeTableau10 is recommended)
let colorsScale = d3.scaleOrdinal(d3.schemeTableau10);

arcsMany.forEach((arc, idx) => {
  d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', colorsScale(idx)); // note: function call, not array indexing
});
