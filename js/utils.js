/* Shared helpers — used by both customer site and admin dashboard. */

function fmt(n) {
  return "\u20B9" + Number(n).toLocaleString("en-IN");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

let _toastTimer = null;
function toast(msg, isError = false) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.toggle("is-error", isError);
  t.classList.add("is-show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("is-show"), 3600);
}
