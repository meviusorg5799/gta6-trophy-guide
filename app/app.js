// Leonida Trophy Guide: offline checklist + roadmap for GTA VI's 55 PS5 trophies.
// Loads its data from data/trophies.json (same origin, no network), saves progress
// in localStorage, and exports/imports that progress as a JSON file.
const STORAGE_KEY = 'leonida-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';

const ROADMAP_PHASES = [
  {
    title: 'Phase 1 — Play the story',
    text: 'Play the story straight through, chapters 1 to 4 and the final mission. Twelve trophies pop from story progress alone: the opening mission, one per chapter, the named story missions, and the gold for the final mission. Do the named missions when they appear — they are the missable ones in this guide, tied to a single mission each.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    title: 'Phase 2 — Side strands and strangers',
    text: 'After the story opens up, finish the five side-character strands (Andy, Kenton, Billy, Randy, Tyrone) to their final missions, hunt Bret’s unique animal, and complete 8 stranger mission strands across Leonida. The side finals are missable in the same single-mission sense as the story ones.',
    ids: [22, 23, 24, 26, 27, 25, 29],
  },
  {
    title: 'Phase 3 — Activities, races and combat',
    text: 'The big middle grind: 250 stunts, all 42 Shooting Range golds, 20 race wins, drone races at all 14 Top Fun locations, 50 challenges, the partner crime trophies, bank vaults, armored trucks, gang operations and the Combat Focus multi-kill. None of these is missable — they all stay open in free roam.',
    ids: [15, 16, 17, 18, 19, 20, 21, 32, 33, 34, 36, 38, 39, 40, 41, 43, 46, 51],
  },
  {
    title: 'Phase 4 — Collectibles and exploration',
    text: 'Sweep Leonida: all 52 areas, 100 vehicles discovered, 100 WAiNK tags, 3 card sets, all 18 meditation spots, plus the one-off moments — a cocktail on Ocean Beach, the showroom smash, the unscheduled VCIA departure, and the strange encounter. All repeatable or free-roam.',
    ids: [28, 30, 31, 35, 37, 42, 44, 45, 50],
  },
  {
    title: 'Phase 5 — Cleanup and money',
    text: 'Last: launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garage properties, register 10 vehicles with Scooter Bros, and let the choice-count and second-try trophies land. When the other 54 are done, the platinum pops — and the gold for 100% completion should land here too, since the checklist above covers its tasks.',
    ids: [1, 14, 47, 48, 49, 52, 53, 54, 55],
  },
];

const KIND_LABELS = { story: 'Story', collectible: 'Collectible', combat: 'Combat', exploration: 'Exploration', misc: 'Activities & misc' };

const state = {
  trophies: [],
  earned: new Set(),
  spoilers: true,
  grade: 'all',
  kind: 'all',
  query: '',
  missableOnly: false,
  hideEarned: false,
  selectedId: null,
  tab: 'checklist',
};

const $ = (id) => document.getElementById(id);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) state.earned = new Set(parsed.earned.filter((n) => Number.isInteger(n)));
    if (typeof parsed.spoilers === 'boolean') state.spoilers = parsed.spoilers;
  } catch {
    // A corrupt save is ignored; the checklist starts empty rather than crashing.
  }
}

function saveStored() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned].sort((a, b) => a - b), spoilers: state.spoilers }));
  } catch {
    // Private mode or a full store: progress just does not persist this session.
  }
}

function isHidden(trophy) {
  return state.spoilers && trophy.secret && !state.earned.has(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderStats() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let secret = 0;
  for (const t of state.trophies) {
    counts[t.grade] += 1;
    if (t.secret) secret += 1;
  }
  $('stats').innerHTML =
    `<span><b>${state.trophies.length}</b> trophies</span>` +
    `<span><b>${counts.platinum}</b> platinum</span>` +
    `<span><b>${counts.gold}</b> gold</span>` +
    `<span><b>${counts.silver}</b> silver</span>` +
    `<span><b>${counts.bronze}</b> bronze</span>` +
    `<span><b>${secret}</b> hidden until earned</span>`;
}

function renderProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const points = state.trophies.filter((t) => state.earned.has(t.id)).reduce((sum, t) => sum + (t.points || 0), 0);
  const totalPoints = state.trophies.reduce((sum, t) => sum + (t.points || 0), 0);
  $('progress-text').textContent = `${earned} of ${total} earned`;
  $('points-text').textContent = `${points.toLocaleString()} / ${totalPoints.toLocaleString()} points`;
  $('progress-fill').style.width = total ? `${(earned / total) * 100}%` : '0%';
  $('progress-bar').setAttribute('aria-valuenow', String(earned));
}

function filteredTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.missableOnly && !t.missable) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderList() {
  const list = $('trophy-list');
  const shown = filteredTrophies();
  $('result-count').textContent = `Showing ${shown.length} of ${state.trophies.length} trophies`;
  if (!shown.length) {
    list.innerHTML = '<p class="empty">No trophies match these filters. Clear the search or widen the filters.</p>';
    return;
  }
  list.innerHTML = shown
    .map((t) => {
      const earned = state.earned.has(t.id);
      const hidden = isHidden(t);
      const name = hidden ? 'Hidden Trophy' : escapeHtml(t.name);
      const desc = hidden ? 'Hidden until earned — the spoiler shield hides this trophy.' : escapeHtml(t.description);
      return `<button type="button" class="trophy-card${earned ? ' earned' : ''}${state.selectedId === t.id ? ' selected' : ''}" data-id="${t.id}">
        <input type="checkbox" class="check-box" ${earned ? 'checked' : ''} aria-label="Mark ${hidden ? 'hidden trophy' : escapeHtml(t.name)} as earned" tabindex="-1">
        <span>
          <h3 class="${hidden ? 'hidden-name' : ''}">${name}</h3>
          <p class="desc">${desc}</p>
          <span class="chips">
            <span class="grade-badge grade-${t.grade}">${gradeLabel(t.grade)} · ${t.points} pts</span>
            <span class="chip">${KIND_LABELS[t.kind] || t.kind}</span>
            ${t.missable ? '<span class="chip missable">Missable</span>' : ''}
            ${t.secret ? '<span class="chip secret">Secret</span>' : ''}
          </span>
        </span>
        <span aria-hidden="true">${earned ? '✓' : ''}</span>
      </button>`;
    })
    .join('');
  list.querySelectorAll('.trophy-card').forEach((card) => {
    card.addEventListener('click', (event) => {
      const id = Number(card.dataset.id);
      if (event.target.classList.contains('check-box')) return;
      selectTrophy(id);
    });
    card.querySelector('.check-box').addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(Number(card.dataset.id));
    });
  });
}

function renderDetail() {
  const panel = $('detail');
  const trophy = state.trophies.find((t) => t.id === state.selectedId);
  if (!trophy) {
    panel.innerHTML = '<p class="detail-empty"><strong>Pick a trophy</strong> to see its guide. The detail shows the official description, what to do and how, when it can be missed, and the source for every fact.</p>';
    return;
  }
  const earned = state.earned.has(trophy.id);
  const hidden = isHidden(trophy);
  if (hidden) {
    panel.innerHTML = `<h2>Hidden Trophy</h2>
      <p class="official">This trophy is hidden on PlayStation until earned. The spoiler shield is on, so its name, description and guide stay hidden.</p>
      <p>Tick it off in the checklist once you earn it — or turn the spoiler shield off — to reveal it.</p>
      <button type="button" class="btn" id="detail-toggle-earned">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>`;
  } else {
    panel.innerHTML = `<h2>${escapeHtml(trophy.name)}</h2>
      <p class="official">Official description: “${escapeHtml(trophy.description)}”</p>
      <div class="facts">
        <span class="grade-badge grade-${trophy.grade}">${gradeLabel(trophy.grade)} · ${trophy.points} pts</span>
        <span class="chip">${KIND_LABELS[trophy.kind] || trophy.kind}</span>
        <span class="chip">Roadmap phase ${trophy.stage}</span>
        ${trophy.missable ? '<span class="chip missable">Missable — tied to one mission</span>' : '<span class="chip">Not missable</span>'}
        ${trophy.secret ? '<span class="chip secret">Secret</span>' : ''}
      </div>
      <h3>Guide</h3>
      <p class="guide-text">${escapeHtml(trophy.guide)}</p>
      <h3>Source</h3>
      <p class="source">${escapeHtml(trophy.source)}</p>
      <button type="button" class="btn" id="detail-toggle-earned">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>`;
  }
  $('detail-toggle-earned').addEventListener('click', () => toggleEarned(trophy.id));
}

function renderRoadmap() {
  const byId = new Map(state.trophies.map((t) => [t.id, t]));
  $('roadmap').innerHTML = ROADMAP_PHASES.map((phase) => {
    const items = phase.ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((t) => {
        const earned = state.earned.has(t.id);
        const hidden = isHidden(t);
        return `<li>${earned ? '✓ ' : ''}<span class="grade-badge grade-${t.grade}">${gradeLabel(t.grade)}</span> ${hidden ? '<em>Hidden Trophy</em>' : `<strong>${escapeHtml(t.name)}</strong>`}${t.missable ? ' <span class="chip missable">Missable</span>' : ''} — ${hidden ? 'hidden until earned' : escapeHtml(t.description)}</li>`;
      })
      .join('');
    return `<div class="phase"><h3>${escapeHtml(phase.title)}</h3><p>${escapeHtml(phase.text)}</p><ul class="phase-trophies">${items}</ul></div>`;
  }).join('');
}

function renderMissables() {
  const missable = state.trophies.filter((t) => t.missable);
  $('missables').innerHTML = `<p class="intro">${missable.length} trophies are flagged missable — every one of them is tied to a single story mission or chapter. Do them when they come up.</p>` +
    '<div class="missable-list">' +
    missable
      .map((t) => {
        const hidden = isHidden(t);
        return `<div class="trophy-card${state.earned.has(t.id) ? ' earned' : ''}">
          <span aria-hidden="true">${state.earned.has(t.id) ? '✓' : '!'}</span>
          <span><h3 class="${hidden ? 'hidden-name' : ''}">${hidden ? 'Hidden Trophy' : escapeHtml(t.name)}</h3>
          <p class="desc">${hidden ? 'Hidden until earned — the spoiler shield hides this trophy.' : escapeHtml(t.description)}</p>
          <span class="chips"><span class="grade-badge grade-${t.grade}">${gradeLabel(t.grade)} · ${t.points} pts</span><span class="chip">Roadmap phase ${t.stage}</span></span></span>
          <span></span>
        </div>`;
      })
      .join('') +
    '</div>';
}

function renderSpoiler() {
  const btn = $('spoiler-toggle');
  btn.textContent = `Spoiler shield: ${state.spoilers ? 'on' : 'off'}`;
  btn.setAttribute('aria-pressed', String(state.spoilers));
  $('spoiler-note').textContent = state.spoilers
    ? 'Spoiler shield is on: hidden (secret) trophies stay unnamed until you earn them. Turn it off to see the full list.'
    : 'Spoiler shield is off: every trophy name and description is shown, including story spoilers.';
}

function renderAll() {
  renderStats();
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderSpoiler();
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveStored();
  renderAll();
}

function selectTrophy(id) {
  state.selectedId = id;
  renderList();
  renderDetail();
}

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.hidden = p.id !== `tab-${tab}`;
  });
}

function exportProgress() {
  return JSON.stringify(
    { app: 'leonida-trophy-guide', version: 1, exportedAt: new Date().toISOString(), earned: [...state.earned].sort((a, b) => a - b) },
    null,
    2,
  );
}

function importProgress(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.earned)) throw new Error('Not a Leonida progress file: no earned list.');
  const valid = new Set(state.trophies.map((t) => t.id));
  const next = new Set(parsed.earned.filter((n) => Number.isInteger(n) && valid.has(n)));
  state.earned = next;
  saveStored();
  renderAll();
  return state.earned.size;
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function readQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (['checklist', 'roadmap', 'missables', 'sources'].includes(tab)) state.tab = tab;
  const grade = params.get('grade');
  if (['all', 'platinum', 'gold', 'silver', 'bronze'].includes(grade)) state.grade = grade;
  const kind = params.get('kind');
  if (['all', 'story', 'collectible', 'combat', 'exploration', 'misc'].includes(kind)) state.kind = kind;
  const spoilers = params.get('spoilers');
  if (spoilers === 'off') state.spoilers = false;
  if (spoilers === 'on') state.spoilers = true;
  const detail = Number(params.get('detail'));
  if (Number.isInteger(detail)) state.selectedId = detail;
  const q = params.get('q');
  if (q) state.query = q;
}

function bindControls() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderList();
  });
  $('grade-filter').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderList();
  });
  $('kind-filter').addEventListener('change', (e) => {
    state.kind = e.target.value;
    renderList();
  });
  $('missable-only').addEventListener('change', (e) => {
    state.missableOnly = e.target.checked;
    renderList();
  });
  $('hide-earned').addEventListener('change', (e) => {
    state.hideEarned = e.target.checked;
    renderList();
  });
  $('spoiler-toggle').addEventListener('click', () => {
    state.spoilers = !state.spoilers;
    saveStored();
    renderAll();
  });
  $('export-btn').addEventListener('click', () => download('leonida-trophy-progress.json', exportProgress()));
  $('import-btn').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = importProgress(text);
      alert(`Imported progress: ${count} trophies earned.`);
    } catch (err) {
      alert(`Could not import that file: ${err.message}`);
    }
    e.target.value = '';
  });
  $('reset-btn').addEventListener('click', () => {
    if (!window.confirm('Clear all earned trophies?')) return;
    state.earned.clear();
    saveStored();
    renderAll();
  });
}

async function init() {
  loadStored();
  readQueryParams();
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Could not load ${DATA_URL}: ${response.status}`);
  const data = await response.json();
  state.trophies = data.trophies;
  if (state.selectedId && !state.trophies.some((t) => t.id === state.selectedId)) state.selectedId = null;
  if (!state.selectedId) state.selectedId = 17;
  $('grade-filter').value = state.grade;
  $('kind-filter').value = state.kind;
  if (state.query) $('search').value = state.query;
  bindControls();
  setTab(state.tab);
  renderAll();
}

// Test hooks for the maker's own verification (same code paths as the buttons).
window.__trophyGuide = { exportProgress, importProgress, getState: () => ({ earned: [...state.earned], spoilers: state.spoilers, count: state.trophies.length }) };

init().catch((err) => {
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="empty">This guide could not load its trophy data: ${escapeHtml(err.message)}</p>`);
  throw err;
});
