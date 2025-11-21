// Lab 6 + Lab 8 meta page
// D3 for data + rendering, Scrollama for scrollytelling

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// ---------- Data loading (Lab 6 Step 1) ----------

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

// ---------- Process commits (Lab 6 Step 1.2) ----------

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;

      const ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false,
      });

      return ret;
    })
    .sort((a, b) => a.datetime - b.datetime); // sort by time for scrollytelling
}

// ---------- Tooltip helpers (Lab 6 Step 3) ----------

function renderTooltipContent(commit) {
  if (!commit) return;

  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  author.textContent = commit.author ?? 'Unknown';

  lines.textContent = `${commit.totalLines} lines in ${d3.rollups(
    commit.lines,
    (v) => v.length,
    (d) => d.file,
  ).length} files`;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const offset = 16;
  tooltip.style.left = `${event.clientX + offset}px`;
  tooltip.style.top = `${event.clientY + offset}px`;
}

// ---------- Summary stats (Lab 6 Step 1.3) ----------

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').html('').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // example extra stats
  const numFiles = d3.group(data, (d) => d.file).size;
  dl.append('dt').text('Files');
  dl.append('dd').text(numFiles);

  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Max depth');
  dl.append('dd').text(maxDepth);

  const avgDepth = d3.mean(data, (d) => d.depth);
  dl.append('dt').text('Average depth');
  dl.append('dd').text(avgDepth.toFixed(2));
}

// ---------- Global state & scales (Lab 6 + 8) ----------

let data = [];
let commits = [];
let filteredCommits = [];

let xScale;
let yScale;

let commitProgress = 100; // 0-100%
let timeScale;
let commitMaxTime;

// used by brushing / language breakdown
let globalData = [];
let globalCommits = [];

// ---------- Scatter plot initial render (Lab 6 Step 2) ----------

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  const dots = svg.append('g').attr('class', 'dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // CSS transitions handle animation; we just ensure circles exist

  // Store for brushing
  globalData = data;
  globalCommits = commits;

  // brushing setup (kept simple for Lab 8 – same behavior as Lab 6)
  createBrush(svg, usableArea, dots);
}

// ---------- Scatter plot update for slider & scrollytelling (Lab 8 Step 1.2 & 3) ----------

function updateScatterPlot(data, commitsSubset) {
  if (!commitsSubset.length) return;

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  // Update xScale domain based on filtered commits
  xScale.domain(d3.extent(commitsSubset, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commitsSubset, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commitsSubset, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

// ---------- Brushing & language breakdown (simplified from Lab 6) ----------

function isCommitSelected(selection, commit) {
  if (!selection || !xScale || !yScale) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;
  return selectedCommits;
}

function renderLanguageBreakdown(selection, commits) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  if (!lines.length) {
    container.innerHTML = '';
    return;
  }

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function createBrush(svg, usableArea, dots) {
  function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d),
    );
    renderSelectionCount(selection, globalCommits);
    renderLanguageBreakdown(selection, globalCommits);
  }

  svg.call(d3.brush().on('start brush end', brushed));

  // ensure dots are above brush overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

// ---------- File unit visualization (Lab 8 Step 2) ----------

const colors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(filteredCommits) {
  const filesDl = d3.select('#files');
  filesDl.html(''); // clear

  const lines = filteredCommits.flatMap((d) => d.lines);

  const files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => ({
      name,
      lines,
      type: lines[0]?.type ?? 'other',
    }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = filesDl
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        const dt = div.append('dt');
        dt.append('code');
        dt.append('small');
        div.append('dd');
      }),
    );

  filesContainer
    .select('dt > code')
    .text((d) => d.name);

  filesContainer
    .select('dt > small')
    .text((d) => `${d.lines.length} lines`);

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('--color', (line) => colors(line.type));
}

// ---------- Scrollytelling: commit text & Scrollama (Lab 8 Step 3) ----------

function buildCommitStory(commits) {
  d3
    .select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html((d, i) => {
      const dateStr = d.datetime.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short',
      });
      const filesTouched = d3.rollups(
        d.lines,
        (D) => D.length,
        (line) => line.file,
      ).length;

      const commitText =
        i > 0
          ? 'another commit that pushed the project forward'
          : 'my first commit in this repo';

      return `
        <p>
          On <strong>${dateStr}</strong>,
          I made <a href="${d.url}" target="_blank" rel="noopener noreferrer">
          ${commitText}
          </a>.
        </p>
        <p>
          It edited <strong>${d.totalLines} lines</strong> across
          <strong>${filesTouched} files</strong>.
        </p>
      `;
    });
}

function setupScrollytelling(commits) {
  function onStepEnter(response) {
    const commit = response.element.__data__;
    if (!commit) return;

    // update slider & filtered view based on scrolled commit
    commitMaxTime = commit.datetime;
    commitProgress = timeScale(commitMaxTime);

    const slider = document.getElementById('commit-progress');
    const commitTimeEl = document.getElementById('commit-time');

    slider.value = commitProgress;
    commitTimeEl.textContent = commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits);
    renderCommitInfo(globalData, filteredCommits);
  }

  const scroller = scrollama();
  scroller
    .setup({
      container: '#scrolly-1',
      step: '#scrolly-1 .step',
    })
    .onStepEnter(onStepEnter);
}

// ---------- Slider wiring (Lab 8 Step 1.1 & 1.2) ----------

function setupTimeSlider() {
  const slider = document.getElementById('commit-progress');
  const commitTimeEl = document.getElementById('commit-time');

  function onTimeSliderChange() {
    commitProgress = Number(slider.value);
    commitMaxTime = timeScale.invert(commitProgress);

    commitTimeEl.textContent = commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

    updateScatterPlot(data, filteredCommits);
    updateFileDisplay(filteredCommits);
    renderCommitInfo(globalData, filteredCommits);
  }

  slider.addEventListener('input', onTimeSliderChange);
  onTimeSliderChange(); // initialize display
}

// ---------- Main entry ----------

async function main() {
  data = await loadData();
  commits = processCommits(data);
  filteredCommits = commits;

  // time scale for 0–100% slider
  timeScale = d3
    .scaleTime()
    .domain([
      d3.min(commits, (d) => d.datetime),
      d3.max(commits, (d) => d.datetime),
    ])
    .range([0, 100]);

  commitMaxTime = timeScale.invert(commitProgress);

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
  updateFileDisplay(commits);
  buildCommitStory(commits);
  setupTimeSlider();
  setupScrollytelling(commits);
}

main();
