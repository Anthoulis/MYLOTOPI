// Entry page: forwards the visitor to the language page. Without JavaScript the page
// itself lists every language as a plain link.
import { resolveEntryTarget } from "./language.mjs";

const config = JSON.parse(document.getElementById("site-config").textContent);
const target = resolveEntryTarget({
  search: window.location.search,
  browserLanguages: navigator.languages || [navigator.language],
  config,
});

window.location.replace(target);
