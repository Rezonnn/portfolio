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
