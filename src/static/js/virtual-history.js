function formatContestSourceDisplay(contestSource) {
  const upperSource = contestSource.toUpperCase();
  if (
    ['USACOSILVER', 'USACOBRONZE', 'USACOPLATINUM', 'USACOGOLD'].includes(
      upperSource,
    )
  ) {
    const division = upperSource.replace('USACO', '');
    const capitalizedDivision =
      division.charAt(0).toUpperCase() + division.slice(1).toLowerCase();
    return `USACO ${capitalizedDivision}`;
  }
  return upperSource;
}
document.addEventListener('DOMContentLoaded', async () => {
  const sessionToken = localStorage.getItem('sessionToken');
  check_session();
  const username = localStorage.getItem('username');
  document.getElementById('welcome-message').innerHTML = `Welcome, ${username}`;
  document.getElementById('vc-history-loading').style.display = 'block';
  document.getElementById('vc-history-list').style.display = 'none';
  document.getElementById('vc-history-empty').style.display = 'none';
  document.getElementById('stats-skeleton').style.display = 'flex';
  document.getElementById('vc-history-stats').style.display = 'none';
  let contestData = {};
  let problemsData = {};
  try {
    const vcResponse = await fetch(`${apiUrl}/data/virtual/summary`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken }),
    });
    if (vcResponse.ok) {
      const vcData = await vcResponse.json();
      contestData = vcData.contests;
      const contestSources = [...new Set(contestData.map((i) => i.source))];
      const problemsResponse = await fetch(`${apiUrl}/data/problems`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken, sources: contestSources }),
      });
      if (problemsResponse.ok) {
        problemsData = await problemsResponse.json();
      }
    }
  } catch (error) {
    console.error('Error fetching contest/problems data:', error);
  }
  try {
    const response = await fetch(`${apiUrl}/data/virtual/history`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken }),
    });
    if (!response.ok) {
      console.error('Failed to fetch virtual contest history');
      document.getElementById('vc-history-loading').style.display = 'none';
      showEmptyState();
      return;
    }
    let contests = await response.json();
    contests = contests.map((i) => {
      const contest = contestData.find((j) => j.id == i.contestId);
      return {
        contest,
        contestName: contest.name,
        contestStage: contest.stage,
        ...i,
      };
    });
    if (contests.length === 0) {
      showEmptyState();
    } else {
      const contestKeys = contests.map((c) => c.contestId);
      let contestScores = {};
      try {
        const scoresResponse = await fetch('/data/virtual/scores', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contests: contestKeys }),
        });
        if (scoresResponse.ok) {
          contestScores = await scoresResponse.json();
          contestScores = contestScores
            .filter((i) => i.scores)
            .map((i) => i.scores);
          contestScores = Object.fromEntries(
            contestScores.map((i) => [i.contestId, i]),
          );
        }
      } catch (error) {
        console.error('Error fetching contest scores:', error);
      }
      displayContests(contests, contestData, problemsData, contestScores);
      updateStats(contests);
    }
  } catch (error) {
    console.error('Error fetching virtual contest history:', error);
    document.getElementById('vc-history-loading').style.display = 'none';
    showEmptyState();
  }
});
function showEmptyState() {
  document.getElementById('vc-history-loading').style.display = 'none';
  document.getElementById('vc-history-list').style.display = 'none';
  document.getElementById('vc-history-empty').style.display = 'block';
  document.getElementById('stats-skeleton').style.display = 'none';
  document.getElementById('vc-history-stats').style.display = 'none';
  document.getElementById('total-contests').textContent = '0';
  document.getElementById('total-time').textContent = '0h';
}
let allContests = [];
function displayContests(contests, contestData, problemsData, contestScores) {
  allContests = contests;
  window.contestDataGlobal = contestData;
  window.problemsDataGlobal = problemsData;
  const listContainer = document.getElementById('vc-history-list');
  listContainer.innerHTML = '';
  contests.forEach((contest) => {
    const item = createContestItem(
      contest,
      contestData,
      problemsData,
      contestScores,
    );
    listContainer.appendChild(item);
  });
  document.getElementById('vc-history-loading').style.display = 'none';
  document.getElementById('vc-history-list').style.display = 'flex';
  document.getElementById('vc-history-empty').style.display = 'none';
  document.getElementById('stats-skeleton').style.display = 'none';
  document.getElementById('vc-history-stats').style.display = 'flex';
  document.getElementById('vc-history-filters').style.display = 'flex';
  setupFilters(contests, contestScores);
}
function createContestItem(contest, contestData, problemsData, contestScores) {
  const item = document.createElement('div');
  item.className = 'vc-history-item';
  const scoreData = contestScores[contest.contestId];
  let medalClass = '';
  let medalText = '';
  if (
    scoreData &&
    Array.isArray(scoreData.medalCutoffs) &&
    scoreData.medalCutoffs.length > 0
  ) {
    const totalScore = contest.score;
    const cutoffs = scoreData.medalCutoffs;
    const labels = scoreData.medalNames;
    const labelAt = (idx, fallback) =>
      labels[idx] ? String(labels[idx]).toLowerCase() : fallback;
    if (cutoffs.length >= 3) {
      const [goldCutoff, silverCutoff, bronzeCutoff] = cutoffs;
      if (totalScore >= goldCutoff) {
        medalClass = 'medal-gold';
        medalText = 'Gold';
      } else if (totalScore >= silverCutoff) {
        medalClass = 'medal-silver';
        medalText = 'Silver';
      } else if (totalScore >= bronzeCutoff) {
        medalClass = 'medal-bronze';
        medalText = 'Bronze';
      }
    } else if (cutoffs.length === 2) {
      const firstLabel = labelAt(0, 'gold');
      const secondLabel = labelAt(1, 'prizer');
      if (totalScore >= cutoffs[0]) {
        medalClass = `medal-${firstLabel}`;
        medalText = firstLabel.charAt(0).toUpperCase() + firstLabel.slice(1);
      } else if (totalScore >= cutoffs[1]) {
        medalClass = `medal-${secondLabel}`;
        medalText = secondLabel.charAt(0).toUpperCase() + secondLabel.slice(1);
      }
    } else if (cutoffs.length === 1) {
      const onlyLabel = labelAt(0, 'gold');
      if (totalScore >= cutoffs[0]) {
        medalClass = `medal-${onlyLabel}`;
        medalText = onlyLabel.charAt(0).toUpperCase() + onlyLabel.slice(1);
      }
    }
  }
  if (medalClass) {
    item.classList.add(medalClass);
  }
  const startTime = new Date(contest.startedAt);
  const endTime = new Date(contest.endedAt);
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / (1e3 * 60));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const timeUsed = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const date = new Date(contest.startedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const problemScores = contest.perProblemScores;
  const problemCount = problemScores.length;
  const maxScore = problemCount * 100;
  const scoreRate = Math.round((contest.score / maxScore) * 100);
  let variance = 0;
  if (problemScores.length > 0) {
    const mean =
      problemScores.reduce((a, b) => a + b, 0) / problemScores.length;
    const squaredDiffs = problemScores.map((score) =>
      Math.pow(score - mean, 2),
    );
    variance = Math.round(
      Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / problemScores.length),
    );
  }
  let bestProblem = 'None';
  if (problemScores.length > 0) {
    const maxScore2 = Math.max(...problemScores);
    const maxIndex = problemScores.indexOf(maxScore2);
    let id = contest.contest.problems.find(
      (i) => i.problemIndex == maxIndex,
    ).problemId;
    let problemName = problemsData[contest.contest.source.toUpperCase()][
      contest.contest.year
    ].find((i) => i.id == id).name;
    bestProblem = `${problemName}: ${maxScore2}pts`;
  }
  let contestLocation = contest.contest.location;
  let contestWebsite = contest.contest.website;
  item.innerHTML = `
    <div class="vc-history-item-header">
      <div>
        <div class="vc-history-title">${formatContestSourceDisplay(contest.contest.source)} ${contest.contest.year}${contest.contestStage ? ` ${contest.contestStage}` : ''}</div>
        <div class="vc-history-date">${formattedDate} | ${problemCount} problems</div>
        <div class="vc-history-metadata">${contestLocation || contestWebsite ? `${contestLocation}${contestLocation && contestWebsite ? ' | ' : ''}${contestWebsite ? `<a href="${contestWebsite}" target="_blank">${contestWebsite}</a>` : ''}` : ''}</div>
      </div>
      <div class="vc-history-score">${contest.score}/${maxScore}</div>
    </div>
    <div class="vc-history-details">
      <div class="vc-history-detail">
        <div class="vc-history-detail-label">Time Used</div>
        <div class="vc-history-detail-value">${timeUsed}</div>
      </div>
      <div class="vc-history-detail">
        <div class="vc-history-detail-label">Score Rate</div>
        <div class="vc-history-detail-value">
          <div class="score-progress-bar">
            <div class="score-progress-fill" style="width: ${scoreRate}%"></div>
          </div>
          <span class="score-percentage">${scoreRate}%</span>
        </div>
      </div>
      <div class="vc-history-detail">
        <div class="vc-history-detail-label">Best Problem</div>
        <div class="vc-history-detail-value">${bestProblem}</div>
      </div>
      <div class="vc-history-detail">
        <div class="vc-history-detail-label">Score Variance</div>
        <div class="vc-history-detail-value">${variance}pts</div>
      </div>
    </div>
  `;
  item.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    const slug = (contest.contestName + (contest.contestStage || ''))
      .toLowerCase()
      .replace(/\s+/g, '');
    window.location.href = `virtual-contest-detail?contest=${slug}`;
  });
  return item;
}
function updateStats(contests) {
  document.getElementById('total-contests').textContent = contests.length;
  let totalMinutes = 0;
  contests.forEach((contest) => {
    const startTime = new Date(contest.startedAt);
    const endTime = new Date(contest.endedAt);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / (1e3 * 60));
    totalMinutes += durationMinutes;
  });
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  let totalTimeText;
  if (totalHours > 0) {
    totalTimeText = `${totalHours}h ${remainingMinutes}m`;
  } else if (remainingMinutes > 0) {
    totalTimeText = `${remainingMinutes}m`;
  } else {
    totalTimeText = '0h';
  }
  document.getElementById('total-time').textContent = totalTimeText;
}
function setupFilters(contests, contestScores) {
  const searchInput = document.getElementById('contest-search');
  const searchIconInput = document.getElementById('contest-search-icon');
  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters(contestScores));
  }
  if (searchIconInput) {
    searchIconInput.addEventListener('input', () =>
      applyFilters(contestScores),
    );
  }
  setupSearchIcon();
  const olympiadFilters = document.getElementById('olympiad-filters');
  const allOlympiads = [
    ...new Set(contests.map((c) => c.contest.source.toUpperCase())),
  ];
  const usacoOlympiads = allOlympiads.filter((o) => o.startsWith('USACO'));
  const nonUsacoOlympiads = allOlympiads.filter((o) => !o.startsWith('USACO'));
  let olympiads = [...nonUsacoOlympiads];
  if (usacoOlympiads.length > 0) {
    olympiads.push('USACO');
  }
  olympiads.sort();
  olympiadFilters.innerHTML = '';
  const olympiadSelectAll = document.createElement('div');
  olympiadSelectAll.className = 'filter-select-controls';
  olympiadSelectAll.innerHTML = `
    <button class="filter-select-btn" data-action="select-all" data-filter="olympiad">all</button>
    <button class="filter-select-btn" data-action="select-none" data-filter="olympiad">none</button>
  `;
  olympiadFilters.appendChild(olympiadSelectAll);
  olympiads.forEach((olympiad) => {
    const label = document.createElement('label');
    label.className = 'filter-checkbox-compact';
    let value = olympiad;
    if (olympiad === 'USACO') {
      value = usacoOlympiads.join(',');
    }
    label.innerHTML = `
      <input type="checkbox" value="${value}" checked data-display="${olympiad}">
      <span class="checkmark-compact"></span>
      ${olympiad}
    `;
    olympiadFilters.appendChild(label);
  });
  const medalFilters = document.getElementById('medal-filters');
  const medalSelectAll = document.createElement('div');
  medalSelectAll.className = 'filter-select-controls';
  medalSelectAll.innerHTML = `
    <button class="filter-select-btn" data-action="select-all" data-filter="medal">all</button>
    <button class="filter-select-btn" data-action="select-none" data-filter="medal">none</button>
  `;
  medalFilters.insertBefore(medalSelectAll, medalFilters.firstChild);
  setupDropdownFunctionality(
    'olympiad-dropdown-button',
    'olympiad-dropdown-menu',
  );
  setupDropdownFunctionality('medal-dropdown-button', 'medal-dropdown-menu');
  document.addEventListener('click', (e) => {
    const olympiadButton = document.getElementById('olympiad-dropdown-button');
    const olympiadMenu = document.getElementById('olympiad-dropdown-menu');
    const medalButton = document.getElementById('medal-dropdown-button');
    const medalMenu = document.getElementById('medal-dropdown-menu');
    const searchDropdown = document.getElementById('search-dropdown');
    if (
      !olympiadButton.contains(e.target) &&
      !olympiadMenu.contains(e.target)
    ) {
      closeDropdown('olympiad-dropdown-button', 'olympiad-dropdown-menu');
    }
    if (!medalButton.contains(e.target) && !medalMenu.contains(e.target)) {
      closeDropdown('medal-dropdown-button', 'medal-dropdown-menu');
    }
    const searchIcon = document.getElementById('search-icon');
    const searchIconMobile = document.getElementById('search-icon-mobile');
    if (
      searchDropdown &&
      !searchDropdown.contains(e.target) &&
      !searchIcon?.contains(e.target) &&
      !searchIconMobile?.contains(e.target)
    ) {
      searchDropdown.classList.remove('show');
    }
  });
  const allCheckboxes = document.querySelectorAll(
    '.filter-checkbox-compact input[type="checkbox"]',
  );
  allCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      updateFilterButtonTexts();
      applyFilters(contestScores);
    });
  });
  const selectButtons = document.querySelectorAll('.filter-select-btn');
  selectButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = button.dataset.action;
      const filterType = button.dataset.filter;
      let checkboxes;
      if (filterType === 'olympiad') {
        checkboxes = document.querySelectorAll(
          '#olympiad-filters input[type="checkbox"]',
        );
      } else {
        checkboxes = document.querySelectorAll(
          '#medal-filters input[type="checkbox"]',
        );
      }
      checkboxes.forEach((checkbox) => {
        checkbox.checked = action === 'select-all';
      });
      updateFilterButtonTexts();
      applyFilters(contestScores);
    });
  });
  updateFilterButtonTexts();
}
function setupDropdownFunctionality(buttonId, menuId) {
  const dropdownButton = document.getElementById(buttonId);
  const dropdownMenu = document.getElementById(menuId);
  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.classList.contains('show');
    const otherButtonId =
      buttonId === 'olympiad-dropdown-button'
        ? 'medal-dropdown-button'
        : 'olympiad-dropdown-button';
    const otherMenuId =
      menuId === 'olympiad-dropdown-menu'
        ? 'medal-dropdown-menu'
        : 'olympiad-dropdown-menu';
    closeDropdown(otherButtonId, otherMenuId);
    if (isOpen) {
      closeDropdown(buttonId, menuId);
    } else {
      openDropdown(buttonId, menuId);
    }
  });
  dropdownMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}
function openDropdown(buttonId, menuId) {
  document.getElementById(menuId).classList.add('show');
  document.getElementById(buttonId).classList.add('active');
}
function closeDropdown(buttonId, menuId) {
  document.getElementById(menuId).classList.remove('show');
  document.getElementById(buttonId).classList.remove('active');
}
function updateFilterButtonTexts() {
  const olympiadCheckboxes = document.querySelectorAll(
    '#olympiad-filters input[type="checkbox"]',
  );
  const selectedOlympiads = Array.from(olympiadCheckboxes).filter(
    (cb) => cb.checked,
  );
  const totalOlympiads = olympiadCheckboxes.length;
  let olympiadText;
  if (selectedOlympiads.length === totalOlympiads) {
    olympiadText = 'Olympiads';
  } else if (selectedOlympiads.length === 1) {
    olympiadText =
      selectedOlympiads[0].dataset.display || selectedOlympiads[0].value;
  } else if (selectedOlympiads.length === 0) {
    olympiadText = 'None';
  } else {
    const firstSelected =
      selectedOlympiads[0].dataset.display || selectedOlympiads[0].value;
    olympiadText = `${firstSelected}+${selectedOlympiads.length - 1}`;
  }
  document.querySelector('#olympiad-dropdown-button .filter-text').textContent =
    olympiadText;
  const medalCheckboxes = document.querySelectorAll(
    '#medal-filters input[type="checkbox"]',
  );
  const selectedMedals = Array.from(medalCheckboxes).filter((cb) => cb.checked);
  const totalMedals = medalCheckboxes.length;
  let medalText;
  if (selectedMedals.length === totalMedals) {
    medalText = 'Medals';
  } else if (selectedMedals.length === 1) {
    const medalValue = selectedMedals[0].value;
    medalText = medalValue.charAt(0).toUpperCase() + medalValue.slice(1);
  } else if (selectedMedals.length === 0) {
    medalText = 'None';
  } else {
    const firstSelected = selectedMedals[0].value;
    const firstCapitalized =
      firstSelected.charAt(0).toUpperCase() + firstSelected.slice(1);
    medalText = `${firstCapitalized}+${selectedMedals.length - 1}`;
  }
  document.querySelector('#medal-dropdown-button .filter-text').textContent =
    medalText;
}
function setupSearchIcon() {
  const searchIcon = document.getElementById('search-icon');
  const searchIconMobile = document.getElementById('search-icon-mobile');
  const searchDropdown = document.getElementById('search-dropdown');
  [searchIcon, searchIconMobile].forEach((icon) => {
    if (icon) {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = searchDropdown.classList.contains('show');
        if (isOpen) {
          searchDropdown.classList.remove('show');
        } else {
          if (icon === searchIconMobile) {
            const iconRect = icon.getBoundingClientRect();
            searchDropdown.classList.add('mobile');
            searchDropdown.style.position = 'fixed';
            searchDropdown.style.top = `${iconRect.bottom + 8}px`;
            searchDropdown.style.left = `${iconRect.left}px`;
            searchDropdown.style.right = 'auto';
            searchDropdown.style.width = '200px';
          } else {
            searchDropdown.classList.remove('mobile');
            searchDropdown.style.position = 'absolute';
            searchDropdown.style.top = '100%';
            searchDropdown.style.right = '0';
            searchDropdown.style.left = 'auto';
            searchDropdown.style.width = '250px';
          }
          searchDropdown.classList.add('show');
          const input = searchDropdown.querySelector('input');
          if (input) {
            setTimeout(() => input.focus(), 300);
          }
        }
      });
    }
  });
}
function applyFilters(contestScores) {
  let searchTerm = '';
  const mainSearchInput = document.getElementById('contest-search');
  const iconSearchInput = document.getElementById('contest-search-icon');
  if (mainSearchInput && mainSearchInput.offsetParent !== null) {
    searchTerm = mainSearchInput.value.toLowerCase().trim();
  } else if (iconSearchInput) {
    searchTerm = iconSearchInput.value.toLowerCase().trim();
  }
  const selectedOlympiads = Array.from(
    document.querySelectorAll('#olympiad-filters input:checked'),
  ).map((cb) => cb.value);
  const selectedMedals = Array.from(
    document.querySelectorAll('#medal-filters input:checked'),
  ).map((cb) => cb.value);
  const filteredContests = allContests.filter((contest) => {
    let searchMatch = !searchTerm;
    if (searchTerm) {
      const contestMatch =
        contest.contest.source.toLowerCase().includes(searchTerm) ||
        contest.contest.year.toString().includes(searchTerm) ||
        (contest.contestStage &&
          contest.contestStage.toLowerCase().includes(searchTerm)) ||
        (contest.contest.location &&
          contest.contest.location.toLowerCase().includes(searchTerm));
      let problemMatch = false;
      if (
        window.problemsDataGlobal &&
        contest.contest &&
        contest.contest.problems
      ) {
        const contestProblemsData =
          window.problemsDataGlobal[contest.contest.source.toUpperCase()];
        if (contestProblemsData && contestProblemsData[contest.contest.year]) {
          const yearProblems = contestProblemsData[contest.contest.year];
          for (let problem of contest.contest.problems) {
            const problemData = yearProblems.find(
              (p) => p.id == problem.problemId,
            );
            if (
              problemData &&
              problemData.name.toLowerCase().includes(searchTerm)
            ) {
              problemMatch = true;
              break;
            }
          }
        }
      }
      searchMatch = contestMatch || problemMatch;
    }
    const selectedOlympiads2 = Array.from(
      document.querySelectorAll('#olympiad-filters input:checked'),
    ).map((cb) => cb.value);
    let olympiadMatch = false;
    for (const selected of selectedOlympiads2) {
      if (selected.includes(',')) {
        const groupValues = selected.split(',');
        if (groupValues.includes(contest.contest.source.toUpperCase())) {
          olympiadMatch = true;
          break;
        }
      } else {
        if (selected === contest.contest.source.toUpperCase()) {
          olympiadMatch = true;
          break;
        }
      }
    }
    const medalType = getMedalType(contest, contestScores);
    const medalMatch = selectedMedals.includes(medalType);
    return searchMatch && olympiadMatch && medalMatch;
  });
  const listContainer = document.getElementById('vc-history-list');
  listContainer.innerHTML = '';
  if (filteredContests.length === 0) {
    showFilteredEmptyState();
  } else {
    let contestData = {};
    let problemsData = {};
    if (typeof window.contestDataGlobal !== 'undefined') {
      contestData = window.contestDataGlobal;
      problemsData = window.problemsDataGlobal;
    }
    filteredContests.forEach((contest) => {
      const item = createContestItem(
        contest,
        contestData,
        problemsData,
        contestScores,
      );
      listContainer.appendChild(item);
    });
    document.getElementById('vc-history-empty').style.display = 'none';
    document.getElementById('vc-history-list').style.display = 'flex';
  }
  updateStats(filteredContests);
}
function getMedalType(contest, contestScores) {
  const scoreData = contestScores[contest.contestId];
  if (
    scoreData &&
    Array.isArray(scoreData.medalCutoffs) &&
    scoreData.medalCutoffs.length > 0
  ) {
    const totalScore = contest.score;
    const cutoffs = scoreData.medalCutoffs;
    const labels = scoreData.medalNames;
    const labelAt = (idx, fallback) =>
      labels[idx] ? String(labels[idx]).toLowerCase() : fallback;
    if (cutoffs.length >= 3) {
      const [goldCutoff, silverCutoff, bronzeCutoff] = cutoffs;
      if (totalScore >= goldCutoff) return 'gold';
      if (totalScore >= silverCutoff) return 'silver';
      if (totalScore >= bronzeCutoff) return 'bronze';
    } else if (cutoffs.length === 2) {
      const firstLabel = labelAt(0, 'gold');
      if (totalScore >= cutoffs[0]) return firstLabel;
      if (totalScore >= cutoffs[1]) return 'other';
    } else if (cutoffs.length === 1) {
      const onlyLabel = labelAt(0, 'gold');
      if (totalScore >= cutoffs[0]) return onlyLabel;
    }
  }
  return 'other';
}
function showFilteredEmptyState() {
  const emptyDiv = document.getElementById('vc-history-empty');
  emptyDiv.innerHTML = `
    <div class="empty-text">No contests match the current filters</div>
    <div class="empty-subtext">Try adjusting your filter selections to see more results.</div>
  `;
  emptyDiv.style.display = 'block';
  document.getElementById('vc-history-list').style.display = 'none';
}
