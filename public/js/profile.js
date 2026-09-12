const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const container = document.getElementById('profileContainer');
const notFound = document.getElementById('notFound');

if (!code || !/^\d{6}$/.test(code)) {
  showError('Invalid code format. Enter a 6-digit code.');
} else {
  loadProfile(code);
}

async function loadProfile(code) {
  try {
    const res = await fetch(`/api/profile/${code}`);
    if (res.status === 403) {
      const data = await res.json();
      showError(data.error || 'IP verification failed. This code is locked to another IP.');
      return;
    }
    if (!res.ok) throw new Error('Not found');
    const profile = await res.json();
    renderProfile(profile);
  } catch {
    showError('Profile not found. Check your code and try again.');
  }
}

function showError(msg) {
  notFound.innerHTML = `<h2>Access Denied</h2><p>${msg}</p><a href="/" class="back-btn">Back to Home</a>`;
  notFound.style.display = 'block';
}

function renderProfile(profile) {
  const initial = profile.name ? profile.name[0].toUpperCase() : '?';
  const date = new Date(profile.createdAt).toLocaleDateString();
  const games = profile.games || [];

  let gamesHTML = '';
  if (games.length === 0) {
    gamesHTML = '<div class="no-games">No games yet. Ask the admin to add some!</div>';
  } else {
    gamesHTML = '<div class="my-games-grid">' + games.map(g => `
      <div class="game-item">
        <h3>${escapeHTML(g.title)}</h3>
        <div class="added-date">Added ${new Date(g.addedAt).toLocaleDateString()}</div>
      </div>
    `).join('') + '</div>';
  }

  const ipLockStatus = profile.settings.ipLock ? 'Enabled' : 'Disabled';
  const lockColor = profile.settings.ipLock ? '#4caf50' : '#888';

  container.insertAdjacentHTML('beforeend', `
    <div id="profileContent">
      <div class="profile-header">
        <div class="profile-avatar">${initial}</div>
        <div class="profile-info">
          <h1>${escapeHTML(profile.name)}</h1>
          <div class="code-badge">${profile.code}</div>
          <div class="member-since">Member since ${date}</div>
        </div>
      </div>

      <div class="games-library">
        <h2>My Games (${games.length})</h2>
        ${gamesHTML}
      </div>

      <div class="settings-panel">
        <h2>Settings</h2>
        <div class="setting-row">
          <span>IP Lock: <span style="color:${lockColor}">${ipLockStatus}</span></span>
          <button class="toggle-btn" onclick="toggleIPLock()">
            ${profile.settings.ipLock ? 'Disable' : 'Enable'}
          </button>
        </div>
        <div class="setting-row">
          <span>Your IP: <code>${profile.ip || 'Not recorded'}</code></span>
          <button class="update-ip-btn" onclick="updateIP()">Update IP</button>
        </div>
        <div class="setting-row">
          <button class="save-btn" onclick="saveSettings()">Save Settings</button>
        </div>
      </div>

      <a href="/" class="back-btn">Back to Home</a>
    </div>
  `);

  window.currentProfile = profile;
}

async function toggleIPLock() {
  const profile = window.currentProfile;
  const newState = !profile.settings.ipLock;
  try {
    const res = await fetch(`/api/profile/${code}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { ipLock: newState } })
    });
    if (res.ok) {
      profile.settings.ipLock = newState;
      renderProfile(profile);
    }
  } catch {}
}

async function updateIP() {
  try {
    const res = await fetch(`/api/profile/${code}/update-ip`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      window.currentProfile.ip = data.ip;
      renderProfile(window.currentProfile);
    }
  } catch {}
}

async function saveSettings() {
  try {
    await fetch(`/api/profile/${code}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: window.currentProfile.settings })
    });
  } catch {}
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
