import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// -------- Step 1.1: load CSV + type conversion --------
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

// -------- Step 1.2: commits array from lines --------
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

// -------- Step 1.3: summary stats --------
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

// -------- Step 3: tooltip helpers --------
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
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const pad = 12;
  const { clientX, clientY } = event;
  tooltip.style.left = `${clientX + pad}px`;
  tooltip.style.top = `${clientY + pad}px`;
}

// -------- Step 2: scatterplot (time of day vs date) --------
function renderScatterPlot(_data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
  };

  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left},0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

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

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .attr('opacity', 0.9)
    .on('mouseenter', (event, commit) => {
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', () => {
      updateTooltipVisibility(false);
    });
}

// -------- Run everything --------
const data = await loadData();
const commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
