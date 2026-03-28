const knownPlatforms = [
  { key: 'oj.uz', label: 'oj.uz', icon: '/images/ojuz-logo.ico' },
  { key: 'qoj.ac', label: 'qoj.ac', icon: '/images/dummy-icon.svg' },
  { key: 'codeforces', label: 'Codeforces', icon: '/images/codeforces-icon.png' },
  { key: 'atcoder', label: 'AtCoder', icon: '/images/atcoder-icon.png' },
  { key: 'usaco', label: 'USACO', icon: '/images/usaco-icon.png' },
  { key: 'baekjoon', label: 'Baekjoon', icon: '/images/acmicpc-icon.png' },
  { key: 'cms', label: 'CMS', icon: '/images/cms-icon.ico' },
  { key: 'codebreaker', label: 'Codebreaker', icon: '/images/codebreaker-icon.ico' },
  { key: 'codechef', label: 'CodeChef', icon: '/images/codechef-icon.ico' },
  { key: 'codedrills', label: 'Codedrills', icon: '/images/codedrills-icon.ico' },
  { key: 'dmoj', label: 'DMOJ', icon: '/images/dmoj-icon.png' },
  { key: 'szkopuł', label: 'Szkopuł', icon: '/images/szkopul-icon.png' },
  { key: 'eolymp', label: 'Eolymp', icon: '/images/eolymp-icon.png' },
  { key: 'kattis', label: 'Kattis', icon: '/images/dummy-icon.svg' },
];

document.addEventListener('DOMContentLoaded', async () => {
  const darkModeSwitch = document.getElementById('dark-mode-switch');
  if (darkModeSwitch) {
    const currentTheme = localStorage.getItem('theme') || 'lightClassic';
    darkModeSwitch.checked = currentTheme !== 'lightClassic';
    darkModeSwitch.addEventListener('change', () => {
      const isDark = darkModeSwitch.checked;
      const selectedDark = localStorage.getItem('selectedDarkTheme') || 'darkClassic';
      const newTheme = isDark ? selectedDark : 'lightClassic';
      localStorage.setItem('theme', newTheme);
      if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        if (typeof darkModeCss === 'function') darkModeCss();
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
    });
  }

  const sessionToken = localStorage.getItem('sessionToken');
  const username = localStorage.getItem('username');
  if (sessionToken && username) {
    const welcomeMsg = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-button');
    if (welcomeMsg) {
      welcomeMsg.textContent = `Welcome, ${username}`;
      welcomeMsg.style.display = '';
    }
    if (logoutBtn) {
      logoutBtn.style.display = '';
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('username');
        window.location.href = '/';
      });
    }
  }

  const problemPath = window.location.pathname.replace(/^\/problem\//, '');
  if (!problemPath) {
    showNotFound();
    return;
  }

  try {
    const res = await fetch(`/data/problem/${problemPath}`);
    if (!res.ok) {
      showNotFound();
      return;
    }
    const data = await res.json();
    if (!data.problem) {
      showNotFound();
      return;
    }
    renderProblem(data.problem);
  } catch {
    showNotFound();
  }
});

function showNotFound() {
  document.getElementById('problem-loading').style.display = 'none';
  document.getElementById('problem-not-found').style.display = '';
}

function renderProblem(p) {
  document.getElementById('problem-loading').style.display = 'none';
  document.getElementById('problem-container').style.display = '';

  document.getElementById('problem-name').textContent = p.name;

  const metaContainer = document.getElementById('problem-page-meta');
  const sourceLabels = {
    usacosilver: 'USACO Silver',
    usacogold: 'USACO Gold',
    usacobronze: 'USACO Bronze',
    usacoplatinum: 'USACO Platinum',
  };
  const metaParts = [];
  if (p.source) metaParts.push(sourceLabels[p.source.toLowerCase()] ?? p.source.toUpperCase());
  if (p.year) metaParts.push(String(p.year));
  if (p.extra) metaParts.push(p.extra);
  if (p.number != null) metaParts.push(`#${p.number}`);
  metaContainer.textContent = metaParts.join(' · ');

  const linksList = document.getElementById('problem-links-list');
  const links = p.links;

  const platformMap = {};
  for (const pl of knownPlatforms) {
    platformMap[pl.key] = pl;
  }

  const knownKeys = knownPlatforms.filter(pl => links[pl.key]).map(pl => pl.key);
  const unknownKeys = Object.keys(links).filter(k => !platformMap[k]);
  const orderedKeys = [...knownKeys, ...unknownKeys];

  if (orderedKeys.length === 0) {
    const li = document.createElement('li');
    li.className = 'problem-links-empty';
    li.textContent = 'No links available.';
    linksList.appendChild(li);
    return;
  }

  for (const key of orderedKeys) {
    const url = links[key];
    const platform = platformMap[key] || { key, label: key, icon: null };
    const li = document.createElement('li');

    if (platform.icon) {
      const img = document.createElement('img');
      img.src = platform.icon;
      img.alt = platform.label;
      img.className = 'platform-icon';
      li.appendChild(img);
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'problem-link-name';
    nameSpan.textContent = platform.label;
    li.appendChild(nameSpan);

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'problem-link-url';
    a.textContent = url;
    li.appendChild(a);

    linksList.appendChild(li);
  }
}
