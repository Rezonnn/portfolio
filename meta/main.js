import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

function processCommits(data) {
  return d3
    .groups(data, d => d.commit)
    .map(([commit, lines]) => {
      const first = lines[0];
      const { author, date, time, timezone, datetime } = first;
      const ret = {
        id: commit,
        url: 'https://github.com/YOUR_REPO/commit/' + commit,
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

const data = await loadData();
const commits = processCommits(data);
renderCommitInfo(data, commits);
