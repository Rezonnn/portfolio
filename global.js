console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "resume/", title: "CV" },
  { url: "contact/", title: "Contact" },
  { url: "https://github.com/Rezonnn", title: "GitHub" }
];

const nav = document.createElement("nav");
document.body.prepend(nav);

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/portfolio/";

for (const p of pages) {
  let url = p.url;
  if (!url.startsWith("http")) url = BASE_PATH + url;

  const a = document.createElement("a");
  a.href = url;
  a.textContent = p.title;
  nav.append(a);
}

function normalize(path) {
  return path.replace(/index\.html$/i, "").replace(/\/+$/, "/");
}

for (const a of nav.querySelectorAll("a")) {
  a.classList.toggle(
    "current",
    a.host === location.host &&
      normalize(a.pathname) === normalize(location.pathname)
  );
  if (a.host !== location.host) a.target = "_blank";
}
document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);
const select = document.querySelector(".color-scheme select");

function applyColorScheme(value) {
  document.documentElement.style.setProperty("color-scheme", value);
}

select.addEventListener("input", (event) => {
  const value = event.target.value;
  applyColorScheme(value);
  localStorage.colorScheme = value;
});

if (localStorage.colorScheme) {
  applyColorScheme(localStorage.colorScheme);
  select.value = localStorage.colorScheme;
} else {
  select.value = "light dark";
}
const form = document.querySelector("form[action^='mailto:']");

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const parts = [];

  for (const [name, value] of data) {
    if (!value) continue;
    parts.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
  }

  const url = `${form.action}?${parts.join("&")}`;
  location.href = url;
});
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  for (const p of project) {
    const article = document.createElement('article');

    article.innerHTML = `
        <${headingLevel}>${p.title}</${headingLevel}>
        <img src="${p.image}" alt="${p.title}">
        <p>${p.description}</p>
    `;

    containerElement.appendChild(article);
  }
}
