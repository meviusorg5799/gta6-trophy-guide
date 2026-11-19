/* Leonida Trophy Guide — tracker logic.
   Loads the official trophy list from data/trophies.json (a file of this app),
   keeps earned trophies in localStorage, and renders the checklist, roadmap,
   missables and sources tabs. Nothing here fetches from the network. */

'use strict';

var STORAGE_KEY = 'gta6-trophy-guide-progress-v1';
var TOTAL_POINTS = 1350;

var trophies = [];
var roadmap = [];
var sourceList = [];
var earned = new Set();
var openId = null;

var $ = function (id) { return document.getElementById(id); };

function loadProgress() {
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.earned)) {
      earned = new Set(parsed.earned.filter(function (n) {
        return typeof n === 'number';
      }));
    }
  } catch (err) {
    earned = new Set();
  }
}

function saveProgress() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      earned: Array.from(earned).sort(function (a, b) { return a - b; })
    }));
  } catch (err) {
    /* Storage may be unavailable; the checklist still works for the session. */
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function trophyById(id) {
  for (var i = 0; i < trophies.length; i++) {
    if (trophies[i].id === id) return trophies[i];
  }
  return null;
}

function spoilerOn() { return $('spoiler-shield').checked; }

function isHidden(trophy) {
  return spoilerOn() && trophy.secret && !earned.has(trophy.id);
}

function gradeBadge(trophy) {
  return '<span class="badge ' + escapeHtml(trophy.grade) + '">' +
    escapeHtml(trophy.grade) + '</span>';
}

function cardHtml(trophy) {
  var isEarned = earned.has(trophy.id);
  var hidden = isHidden(trophy);
  var name = hidden ? 'Secret trophy' : trophy.name;
  var desc = hidden
    ? 'Hidden until earned — the spoiler shield hides secret trophies.'
    : trophy.description;
  var classes = 'card' + (isEarned ? ' earned' : '') + (openId === trophy.id ? ' open' : '');
  var html = '<article class="' + classes + '" data-id="' + trophy.id + '" tabindex="0">' +
    '<div class="card-top">' +
    '<button type="button" class="checkbox" data-toggle="' + trophy.id + '" aria-label="' +
    (isEarned ? 'Mark as not earned: ' : 'Mark as earned: ') + escapeHtml(name) + '">' +
    (isEarned ? '✓' : '') + '</button>' +
    '<div><h3 class="' + (hidden ? 'hidden-name' : '') + '">' + escapeHtml(name) + '</h3>' +
    '<p class="desc">' + escapeHtml(desc) + '</p></div></div>' +
    '<div class="meta">' + gradeBadge(trophy) +
    '<span class="tag">' + escapeHtml(trophy.kind) + '</span>' +
    '<span class="tag points">' + trophy.points + ' pts</span>' +
    (trophy.secret ? '<span class="tag secret">secret</span>' : '') +
    (trophy.missable ? '<span class="tag missable">missable</span>' : '') +
    '</div>';
  if (openId === trophy.id && !hidden) {
    html += '<div class="detail"><h4>Guide</h4><p>' + escapeHtml(trophy.guide) + '</p>' +
      (trophy.missable
        ? '<p class="missable-note">Missable: this trophy comes from a single mission — finish the mission when it appears.</p>'
        : '') +
      '<p class="sources"><span>Sources:</span> ' +
      trophy.sources.map(escapeHtml).join(' · ') + '</p></div>';
  } else if (openId === trophy.id && hidden) {
    html += '<div class="detail"><p>Earn this trophy to reveal its guide — the spoiler shield hides secret trophies until they are earned.</p></div>';
  }
  return html + '</article>';
}

function filteredTrophies() {
  var query = $('search').value.trim().toLowerCase();
  var grade = $('grade-filter').value;
  var kind = $('kind-filter').value;
  var missableOnly = $('missable-only').checked;
  var hideEarned = $('hide-earned').checked;
  return trophies.filter(function (t) {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (missableOnly && !t.missable) return false;
    if (hideEarned && earned.has(t.id)) return false;
    if (query) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (hay.indexOf(query) < 0) return false;
    }
    return true;
  });
}

function renderProgress() {
  var count = earned.size;
  var points = 0;
  earned.forEach(function (id) {
    var t = trophyById(id);
    if (t) points += t.points;
  });
  $('progress-count').textContent = count + ' / ' + trophies.length + ' earned';
  $('progress-points').textContent = points + ' / ' + TOTAL_POINTS + ' points';
  $('progress-fill').style.width = trophies.length
    ? Math.round((count / trophies.length) * 100) + '%'
    : '0%';
}

function renderChecklist() {
  var list = filteredTrophies();
  $('count-line').textContent = 'Showing ' + list.length + ' of ' + trophies.length +
    ' trophies' + (earned.size ? ' — ' + earned.size + ' earned' : '');
  $('trophy-list').innerHTML = list.length
    ? list.map(cardHtml).join('')
    : '<p class="empty">No trophies match these filters.</p>';
}

function renderMissables() {
  var list = trophies.filter(function (t) { return t.missable; });
  $('missable-list').innerHTML = list.map(cardHtml).join('');
}

function renderRoadmap() {
  $('roadmap-list').innerHTML = roadmap.map(function (phase) {
    var chips = phase.trophies.map(function (id) {
      var t = trophyById(id);
      if (!t) return '';
      var label = isHidden(t) ? 'Secret trophy' : t.name;
      return '<span class="tag">' + escapeHtml(label) +
        (t.missable ? ' · missable' : '') + '</span>';
    }).join('');
    return '<li><h3>' + escapeHtml(phase.title) + '</h3><p>' +
      escapeHtml(phase.text) + '</p><div class="phase-trophies">' + chips + '</div></li>';
  }).join('');
}

function renderSources() {
  $('source-list').innerHTML = sourceList.map(function (s) {
    return '<li><a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' +
      escapeHtml(s.name) + '</a><p>' + escapeHtml(s.note) + '</p></li>';
  }).join('');
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderMissables();
  renderRoadmap();
  renderSources();
}

function switchTab(name) {
  var tabs = ['checklist', 'roadmap', 'missables', 'sources'];
  tabs.forEach(function (tab) {
    $('tab-' + tab).setAttribute('aria-selected', tab === name ? 'true' : 'false');
    $('panel-' + tab).hidden = tab !== name;
  });
}

function exportProgress() {
  var blob = new Blob([JSON.stringify({
    app: 'leonida-trophy-guide',
    version: 1,
    earned: Array.from(earned).sort(function (a, b) { return a - b; })
  }, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(String(reader.result));
      if (!parsed || !Array.isArray(parsed.earned)) throw new Error('bad file');
      var next = new Set();
      parsed.earned.forEach(function (id) {
        if (typeof id === 'number' && trophyById(id)) next.add(id);
      });
      earned = next;
      saveProgress();
      renderAll();
    } catch (err) {
      window.alert('That file is not a Leonida Trophy Guide progress export.');
    }
  };
  reader.readAsText(file);
}

function bindEvents() {
  document.querySelectorAll('.tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });

  ['search', 'grade-filter', 'kind-filter', 'missable-only', 'hide-earned']
    .forEach(function (id) {
      $(id).addEventListener('input', renderChecklist);
      $(id).addEventListener('change', renderChecklist);
    });

  // The spoiler shield hides names in the checklist, the roadmap chips and
  // the missables list alike, so it re-renders everything, not just the list.
  $('spoiler-shield').addEventListener('change', renderAll);

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      var id = Number(toggle.dataset.toggle);
      if (earned.has(id)) earned.delete(id); else earned.add(id);
      saveProgress();
      renderAll();
      return;
    }
    var card = event.target.closest('.card');
    if (card) {
      var cardId = Number(card.dataset.id);
      openId = openId === cardId ? null : cardId;
      renderChecklist();
      renderMissables();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var card = event.target.closest && event.target.closest('.card');
    if (card && event.target === card) {
      event.preventDefault();
      var cardId = Number(card.dataset.id);
      openId = openId === cardId ? null : cardId;
      renderChecklist();
      renderMissables();
    }
  });

  $('export-btn').addEventListener('click', exportProgress);
  $('import-btn').addEventListener('click', function () { $('import-file').click(); });
  $('import-file').addEventListener('change', function () {
    if (this.files && this.files[0]) importProgress(this.files[0]);
    this.value = '';
  });
  $('reset-btn').addEventListener('click', function () {
    if (window.confirm('Clear all earned trophies?')) {
      earned = new Set();
      saveProgress();
      renderAll();
    }
  });
}

fetch('data/trophies.json')
  .then(function (response) {
    if (!response.ok) throw new Error('trophies.json did not load');
    return response.json();
  })
  .then(function (data) {
    trophies = data.trophies;
    roadmap = data.roadmap || [];
    sourceList = data.sources || [];
    loadProgress();
    bindEvents();
    renderAll();
  })
  .catch(function (err) {
    $('trophy-list').innerHTML = '<p class="empty">The trophy list could not be loaded. ' +
      'Serve this folder with a static server and open index.html through it.</p>';
  });
