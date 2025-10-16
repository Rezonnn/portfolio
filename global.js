console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
const navLinks = $$("nav a");

function samePage(linkHref, pageHref) {
  const link = new URL(linkHref, pageHref);
  const page = new URL(pageHref);

  if (link.host !== page.host) return false;

  const normalize = p => p.replace(/index\.html$/i, "").replace(/\/+$/, "/");
  return normalize(link.pathname) === normalize(page.pathname);
}

const currentLink = navLinks.find(a => samePage(a.href, location.href));
currentLink?.classList.add("current");
