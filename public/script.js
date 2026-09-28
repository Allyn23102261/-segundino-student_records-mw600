async function api(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

function loadRecords() {
  return api('/api/records');
}

async function getRecordById(id) {
  try { return await api('/api/records/' + encodeURIComponent(id)); }
  catch (e) { return null; }
}

function addRecord(data) {
  return api('/api/records', { method: 'POST', body: JSON.stringify(data) });
}

function updateRecord(id, changes) {
  return api('/api/records/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(changes) });
}

function deleteRecord(id) {
  return api('/api/records/' + encodeURIComponent(id), { method: 'DELETE' });
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
