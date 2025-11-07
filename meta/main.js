import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ---------- Step 1.1: load CSV + type conversion ----------
async function loadData() {
  const data = await d3.csv('loc.csv', row => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime)
  }));
  return data;
}

// ---------- Step 1.2: commits array ----------
function processCommits(data) {
  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;
      const ret = {
        id: commit,
        url: 'https://github.com/YOUR_REPO/commit/' + commit, // optional
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length
      };
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        configurable: true,
        writable: false
      });
      return ret;
    });
}

// ---------- Step 1.3: summary stats ----------
function renderCommitInfo(data, commits) {
  const container = d3.select('#stats');
  const dl = container.append('dl').attr('class', 'stats');

  const fileGroups = d3.groups(data, d => d.file);
  const numFiles = fileGroups.length;

  const fileLengths = d3.rollups(
    data,
    v => d3.max(v, d => d.line),
    d => d.file
  );
  const maxFileLen = d3.max(fileLengths, d => d[1]) ?? 0;
  const longestFile = (d3.greatest(fileLengths, d => d[1]) ?? [null])[0];
  const avgFileLen = d3.mean(fileLengths, d => d[1]) ?? 0;
  const avgDepth = d3.mean(data, d => d.depth) ?? 0;

  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length.toLocaleString());

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length.toLocaleString());

  dl.append('dt').text('Files');
  dl.append('dd').text(numFiles.toLocaleString());

  dl.append('dt').text('Max file length (lines)');
  dl.append('dd').text(Math.round(maxFileLen).toLocaleString());

  dl.append('dt').text('Longest file');
  dl.append('dd').text(longestFile ?? '—');

  dl.append('dt').text('Avg file length (lines)');
  dl.append('dd').text(Math.round(avgFileLen).toLocaleString());

  dl.append('dt').text('Avg depth');
  dl.append('dd').text(d3.format('.2f')(avgDepth));
}

// ---------- Step 3: tooltip helpers ----------
function renderTooltipContent(commit) {
  if (!commit || Object.keys(commit).length === 0) return;
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  link.href = commit.url || '#';
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' }) ?? '';
  time.textContent = commit.datetime?.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) ?? '';
  author.textContent = commit.author ?? '';
  lines.textContent = String(commit.totalLines ?? '');
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const pad = 12;
  tooltip.style.left = `${event.clientX + pad}px`;
  tooltip.style.top  = `${event.clientY + pad}px`;
}

// ---------- Step 5.5 & 5.6: selection readouts ----------
function renderSelectionCount(selection, commits, predicate) {
  const selected = selection ? commits.filter(c => predicate(selection, c)) : [];
  const el = document.getElementById('selection-count');
  el.textContent = `${selected.length || 'No'} commits selected`;
  return selected;
}

function renderLanguageBreakdown(selection, commits, predicate) {
  const container = document.getElementById('language-breakdown');
  const selected = selection ? commits.filter(c => predicate(selection, c)) : [];
  const used = selected.length ? selected : commits;   // if none selected, show all

  if (!used.length) { container.innerHTML = ''; return; }

  const lines = used.flatMap(c => c.lines);

  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
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

// ---------- Steps 2–5: scatterplot + brush ----------
function renderScatterPlot(_data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Step 4: size by lines edited (sqrt to correct area perception)
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Draw larger dots first, smaller on top (better hover when overlapping)
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  const dots = svg.append('g').attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', event => updateTooltipPosition(event))
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // ----- Step 5.1: set up brush -----
  const brush = d3.brush().on('start brush end', brushed);
  svg.call(brush);

  // ----- Step 5.2: bring dots above the overlay so tooltips work again -----
  svg.selectAll('.dots, .overlay ~ *').raise();

  // Selection predicate (pixel space)
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection; // in pixels
    const cx = xScale(commit.datetime);
    const cy = yScale(commit.hourFrac);
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
  }

  // ----- Step 5.4–5.6: brush handler -----
  function brushed(event) {
    const selection = event.selection;

    // Toggle selected class on dots
    dots.selectAll('circle')
      .classed('selected', d => isCommitSelected(selection, d));

    // Update readouts
    renderSelectionCount(selection, commits, isCommitSelected);
    renderLanguageBreakdown(selection, commits, isCommitSelected);
  }
}

// ---------- Run everything ----------
const data = await loadData();
const commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
