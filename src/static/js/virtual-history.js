// Virtual Contest History JavaScript

// Helper function to format contest source for display (specifically for USACO)
function formatContestSourceDisplay(contestSource) {
  const upperSource = contestSource.toUpperCase();
  
  // Check if it's a USACO division
  if (['USACOSILVER', 'USACOBRONZE', 'USACOPLATINUM', 'USACOGOLD'].includes(upperSource)) {
    // Convert USACOSILVER to USACO Silver, etc.
    const division = upperSource.replace('USACO', '');
    const capitalizedDivision = division.charAt(0).toUpperCase() + division.slice(1).toLowerCase();
    return `USACO ${capitalizedDivision}`;
  }
  
  // For non-USACO contests, return as uppercase
  return upperSource;
}

document.addEventListener('DOMContentLoaded', async () => {
  const sessionToken = localStorage.getItem('sessionToken');

  // If we're not logged in, redirect to the home page
  check_session();
  const username = localStorage.getItem('username');

  // Show the welcome message
  document.getElementById('welcome-message').innerHTML = `Welcome, ${username}`;

  // Show loading skeleton initially
  document.getElementById('vc-history-loading').style.display = 'block';
  document.getElementById('vc-history-list').style.display = 'none';
  document.getElementById('vc-history-empty').style.display = 'none';
  document.getElementById('stats-skeleton').style.display = 'flex';
  document.getElementById('vc-history-stats').style.display = 'none';

  // Fetch contest data and problems data (like virtual.js)
  let contestData = {};
  let problemsData = {};

  try {
    // Fetch virtual contest data to get contest metadata
    const vcResponse = await fetch(`${apiUrl}/data/virtual/summary`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken })
    });

    if (vcResponse.ok) {
      const vcData = await vcResponse.json();
      contestData = vcData.contests;

      // Fetch problems data for all contest sources
      const contestSources = [...new Set(contestData.map(i => i.source))];
      const problemsResponse = await fetch(`${apiUrl}/data/problems`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken, sources: contestSources })
      });

      if (problemsResponse.ok) {
        problemsData = await problemsResponse.json();
      }
    }
  } catch (error) {
    console.error('Error fetching contest/problems data:', error);
  }

  // Fetch virtual contest history
  try {
    const response = await fetch(`${apiUrl}/data/virtual/history`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken })
    });

    if (!response.ok) {
      console.error('Failed to fetch virtual contest history');
      document.getElementById('vc-history-loading').style.display = 'none';
      showEmptyState();
      return;
    }

    let contests = await response.json();
    contests = contests.map(i => {
      const contest = contestData.find(j => j.id == i.contestId);
      return {
        contest,
        contestName: contest.name,
        contestStage: contest.stage,
        ...i
      };
    });

    if (contests.length === 0) {
      showEmptyState();
    } else {
      // Fetch contest scores for medal calculation
      const contestKeys = contests.map(c => c.contestId);
      let contestScores = {};

      try {
        const scoresResponse = await fetch('/data/virtual/scores', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contests: contestKeys })
        });

        if (scoresResponse.ok) {
          contestScores = await scoresResponse.json();
          contestScores = contestScores.filter(i => i.scores).map(i => i.scores);
          contestScores = Object.fromEntries(contestScores.map(i => [i.contestId, i]));
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

  // Reset stats to 0
  document.getElementById('total-contests').textContent = '0';
  document.getElementById('total-time').textContent = '0h';
}

let allContests = []; // Store all contests for filtering

function displayContests(contests, contestData, problemsData, contestScores) {
  allContests = contests; // Store for filtering
  
  // Store data globally for filter access
  window.contestDataGlobal = contestData;
  window.problemsDataGlobal = problemsData;
  
  const listContainer = document.getElementById('vc-history-list');
  listContainer.innerHTML = '';

  contests.forEach(contest => {
    const item = createContestItem(contest, contestData, problemsData, contestScores);
    listContainer.appendChild(item);
  });

  // Hide loading and show content
  document.getElementById('vc-history-loading').style.display = 'none';
  document.getElementById('vc-history-list').style.display = 'flex';
  document.getElementById('vc-history-empty').style.display = 'none';
  document.getElementById('stats-skeleton').style.display = 'none';
  document.getElementById('vc-history-stats').style.display = 'flex';
  document.getElementById('vc-history-filters').style.display = 'flex';
  
  // Setup filters
  setupFilters(contests, contestScores);
}

function createContestItem(contest, contestData, problemsData, contestScores) {
  const item = document.createElement('div');
  item.className = 'vc-history-item';

  // Calculate medal type
  // Calculate medal type (supports gold/silver/bronze or gold/prizer)
  const scoreData = contestScores[contest.contestId];
  let medalClass = '';
  let medalText = '';

  if (scoreData && Array.isArray(scoreData.medalCutoffs) && scoreData.medalCutoffs.length > 0) {
    const totalScore = contest.score;
    const cutoffs = scoreData.medalCutoffs;
    const labels = scoreData.medalNames;

    const labelAt = (idx, fallback) => (labels[idx] ? String(labels[idx]).toLowerCase() : fallback);

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
      // Two-tier scheme; default to gold/prizer if labels aren’t provided
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
      // Single cutoff; honor the provided label or treat as gold
      const onlyLabel = labelAt(0, 'gold');
      if (totalScore >= cutoffs[0]) {
        medalClass = `medal-${onlyLabel}`;
        medalText = onlyLabel.charAt(0).toUpperCase() + onlyLabel.slice(1);
      }
    }
  }

  // Add medal class to item
  if (medalClass) {
    item.classList.add(medalClass);
  }

  // Calculate time used
  const startTime = new Date(contest.startedAt);
  const endTime = new Date(contest.endedAt);
  const durationMs = endTime - startTime;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const timeUsed = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Format date
  const date = new Date(contest.startedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate problem count and max score
  const problemScores = contest.perProblemScores;
  const problemCount = problemScores.length;
  const maxScore = problemCount * 100;
  const scoreRate = Math.round((contest.score / maxScore) * 100);

  // Calculate score variance (standard deviation)
  let variance = 0;
  if (problemScores.length > 0) {
    const mean = problemScores.reduce((a, b) => a + b, 0) / problemScores.length;
    const squaredDiffs = problemScores.map(score => Math.pow(score - mean, 2));
    variance = Math.round(Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / problemScores.length));
  }

  // Find best problem with actual name
  let bestProblem = 'None';
  if (problemScores.length > 0) {
    const maxScore = Math.max(...problemScores);
    const maxIndex = problemScores.indexOf(maxScore);

    // Get actual problem name
    let id = contest.contest.problems.find(i => i.problemIndex == maxIndex).problemId;
    let problemName = problemsData[contest.contest.source.toUpperCase()][contest.contest.year].find(i => i.id == id).name;
    bestProblem = `${problemName}: ${maxScore}pts`;
  }

  // Get contest metadata (location/website)
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

  // Add click handler to navigate to detail page
  item.addEventListener('click', (e) => {
    // Don't navigate if clicking on a link
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    // Use query parameters with clean slug (backend expects format: namepart + year + stage)
    const slug = (contest.contestName + (contest.contestStage || '')).toLowerCase().replace(/\s+/g, '');
    window.location.href = `virtual-contest-detail?contest=${slug}`;
  });

  return item;
}

function updateStats(contests) {
  // Always update stats, even if contests array is empty
  document.getElementById('total-contests').textContent = contests.length;

  // Calculate total time
  let totalMinutes = 0;
  contests.forEach(contest => {
    const startTime = new Date(contest.startedAt);
    const endTime = new Date(contest.endedAt);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
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
  // Setup search functionality
  const searchInput = document.getElementById('contest-search');
  const searchIconInput = document.getElementById('contest-search-icon');
  
  // Add event listeners to both search inputs
  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters(contestScores));
  }
  if (searchIconInput) {
    searchIconInput.addEventListener('input', () => applyFilters(contestScores));
  }
  
  // Setup search icon functionality
  setupSearchIcon();

  // Setup olympiad filters
  const olympiadFilters = document.getElementById('olympiad-filters');
  const allOlympiads = [...new Set(contests.map(c => c.contest.source.toUpperCase()))];
  
  // Group USACO olympiads under one "USACO" option
  const usacoOlympiads = allOlympiads.filter(o => o.startsWith('USACO'));
  const nonUsacoOlympiads = allOlympiads.filter(o => !o.startsWith('USACO'));
  
  let olympiads = [...nonUsacoOlympiads];
  if (usacoOlympiads.length > 0) {
    olympiads.push('USACO');
  }
  olympiads.sort();
  
  olympiadFilters.innerHTML = '';
  
  // Add select all/deselect all controls for olympiads
  const olympiadSelectAll = document.createElement('div');
  olympiadSelectAll.className = 'filter-select-controls';
  olympiadSelectAll.innerHTML = `
    <button class="filter-select-btn" data-action="select-all" data-filter="olympiad">all</button>
    <button class="filter-select-btn" data-action="select-none" data-filter="olympiad">none</button>
  `;
  olympiadFilters.appendChild(olympiadSelectAll);
  
  olympiads.forEach(olympiad => {
    const label = document.createElement('label');
    label.className = 'filter-checkbox-compact';
    let value = olympiad;
    if (olympiad === 'USACO') {
      // Store all USACO variations for filtering
      value = usacoOlympiads.join(',');
    }
    label.innerHTML = `
      <input type="checkbox" value="${value}" checked data-display="${olympiad}">
      <span class="checkmark-compact"></span>
      ${olympiad}
    `;
    olympiadFilters.appendChild(label);
  });
  
  // Add select all/deselect all controls for medals
  const medalFilters = document.getElementById('medal-filters');
  const medalSelectAll = document.createElement('div');
  medalSelectAll.className = 'filter-select-controls';
  medalSelectAll.innerHTML = `
    <button class="filter-select-btn" data-action="select-all" data-filter="medal">all</button>
    <button class="filter-select-btn" data-action="select-none" data-filter="medal">none</button>
  `;
  medalFilters.insertBefore(medalSelectAll, medalFilters.firstChild);
  
  // Setup dropdown functionality for both dropdowns
  setupDropdownFunctionality('olympiad-dropdown-button', 'olympiad-dropdown-menu');
  setupDropdownFunctionality('medal-dropdown-button', 'medal-dropdown-menu');
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const olympiadButton = document.getElementById('olympiad-dropdown-button');
    const olympiadMenu = document.getElementById('olympiad-dropdown-menu');
    const medalButton = document.getElementById('medal-dropdown-button');
    const medalMenu = document.getElementById('medal-dropdown-menu');
    const searchDropdown = document.getElementById('search-dropdown');
    
    if (!olympiadButton.contains(e.target) && !olympiadMenu.contains(e.target)) {
      closeDropdown('olympiad-dropdown-button', 'olympiad-dropdown-menu');
    }
    if (!medalButton.contains(e.target) && !medalMenu.contains(e.target)) {
      closeDropdown('medal-dropdown-button', 'medal-dropdown-menu');
    }
    
    // Close search dropdown if clicking outside
    const searchIcon = document.getElementById('search-icon');
    const searchIconMobile = document.getElementById('search-icon-mobile');
    if (searchDropdown && !searchDropdown.contains(e.target) && 
        !searchIcon?.contains(e.target) && !searchIconMobile?.contains(e.target)) {
      searchDropdown.classList.remove('show');
    }
  });
  
  // Add event listeners to all filter checkboxes
  const allCheckboxes = document.querySelectorAll('.filter-checkbox-compact input[type="checkbox"]');
  allCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateFilterButtonTexts();
      applyFilters(contestScores);
    });
  });
  
  // Add event listeners to select all/none buttons
  const selectButtons = document.querySelectorAll('.filter-select-btn');
  selectButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const action = button.dataset.action;
      const filterType = button.dataset.filter;
      
      let checkboxes;
      if (filterType === 'olympiad') {
        checkboxes = document.querySelectorAll('#olympiad-filters input[type="checkbox"]');
      } else {
        checkboxes = document.querySelectorAll('#medal-filters input[type="checkbox"]');
      }
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = action === 'select-all';
      });
      
      updateFilterButtonTexts();
      applyFilters(contestScores);
    });
  });
  
  // Initialize filter button texts
  updateFilterButtonTexts();
}

function setupDropdownFunctionality(buttonId, menuId) {
  const dropdownButton = document.getElementById(buttonId);
  const dropdownMenu = document.getElementById(menuId);
  
  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.classList.contains('show');
    
    // Close other dropdown first
    const otherButtonId = buttonId === 'olympiad-dropdown-button' ? 'medal-dropdown-button' : 'olympiad-dropdown-button';
    const otherMenuId = menuId === 'olympiad-dropdown-menu' ? 'medal-dropdown-menu' : 'olympiad-dropdown-menu';
    closeDropdown(otherButtonId, otherMenuId);
    
    if (isOpen) {
      closeDropdown(buttonId, menuId);
    } else {
      openDropdown(buttonId, menuId);
    }
  });
  
  // Prevent dropdown from closing when clicking inside
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
  // Update olympiad filter button text
  const olympiadCheckboxes = document.querySelectorAll('#olympiad-filters input[type="checkbox"]');
  const selectedOlympiads = Array.from(olympiadCheckboxes).filter(cb => cb.checked);
  const totalOlympiads = olympiadCheckboxes.length;
  
  let olympiadText;
  if (selectedOlympiads.length === totalOlympiads) {
    olympiadText = 'Olympiads'; // Keep original label when all selected
  } else if (selectedOlympiads.length === 1) {
    olympiadText = selectedOlympiads[0].dataset.display || selectedOlympiads[0].value;
  } else if (selectedOlympiads.length === 0) {
    olympiadText = 'None';
  } else {
    // Multiple selected - show first one and indicate more
    const firstSelected = selectedOlympiads[0].dataset.display || selectedOlympiads[0].value;
    olympiadText = `${firstSelected}+${selectedOlympiads.length - 1}`;
  }
  
  document.querySelector('#olympiad-dropdown-button .filter-text').textContent = olympiadText;
  
  // Update medal filter button text
  const medalCheckboxes = document.querySelectorAll('#medal-filters input[type="checkbox"]');
  const selectedMedals = Array.from(medalCheckboxes).filter(cb => cb.checked);
  const totalMedals = medalCheckboxes.length;
  
  let medalText;
  if (selectedMedals.length === totalMedals) {
    medalText = 'Medals'; // Keep original label when all selected
  } else if (selectedMedals.length === 1) {
    const medalValue = selectedMedals[0].value;
    medalText = medalValue.charAt(0).toUpperCase() + medalValue.slice(1);
  } else if (selectedMedals.length === 0) {
    medalText = 'None';
  } else {
    // Multiple selected - show first one and indicate more
    const firstSelected = selectedMedals[0].value;
    const firstCapitalized = firstSelected.charAt(0).toUpperCase() + firstSelected.slice(1);
    medalText = `${firstCapitalized}+${selectedMedals.length - 1}`;
  }
  
  document.querySelector('#medal-dropdown-button .filter-text').textContent = medalText;
}

function setupSearchIcon() {
  const searchIcon = document.getElementById('search-icon');
  const searchIconMobile = document.getElementById('search-icon-mobile');
  const searchDropdown = document.getElementById('search-dropdown');
  
  // Handle search icon clicks
  [searchIcon, searchIconMobile].forEach(icon => {
    if (icon) {
      icon.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = searchDropdown.classList.contains('show');
        
        if (isOpen) {
          // Close with drop-up animation
          searchDropdown.classList.remove('show');
        } else {
          // Position dropdown relative to the clicked icon
          if (icon === searchIconMobile) {
            // For mobile, use fixed positioning
            const iconRect = icon.getBoundingClientRect();
            searchDropdown.classList.add('mobile');
            searchDropdown.style.position = 'fixed';
            searchDropdown.style.top = `${iconRect.bottom + 8}px`;
            searchDropdown.style.left = `${iconRect.left}px`;
            searchDropdown.style.right = 'auto';
            searchDropdown.style.width = '200px';
          } else {
            // For medium screens, use default positioning
            searchDropdown.classList.remove('mobile');
            searchDropdown.style.position = 'absolute';
            searchDropdown.style.top = '100%';
            searchDropdown.style.right = '0';
            searchDropdown.style.left = 'auto';
            searchDropdown.style.width = '250px';
          }
          
          // Open with drop-down animation
          searchDropdown.classList.add('show');
          // Focus the input after animation
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
  // Get search term from the appropriate input
  let searchTerm = '';
  const mainSearchInput = document.getElementById('contest-search');
  const iconSearchInput = document.getElementById('contest-search-icon');
  
  if (mainSearchInput && mainSearchInput.offsetParent !== null) {
    // Main search input is visible
    searchTerm = mainSearchInput.value.toLowerCase().trim();
  } else if (iconSearchInput) {
    // Icon search input
    searchTerm = iconSearchInput.value.toLowerCase().trim();
  }
  
  // Get selected olympiads
  const selectedOlympiads = Array.from(document.querySelectorAll('#olympiad-filters input:checked'))
    .map(cb => cb.value);
  
  // Get selected medals
  const selectedMedals = Array.from(document.querySelectorAll('#medal-filters input:checked'))
    .map(cb => cb.value);
  
  // Filter contests
  const filteredContests = allContests.filter(contest => {
    // Check search filter - now includes problem name search
    let searchMatch = !searchTerm;
    
    if (searchTerm) {
      // Search in contest metadata
      const contestMatch = contest.contest.source.toLowerCase().includes(searchTerm) ||
        contest.contest.year.toString().includes(searchTerm) ||
        (contest.contestStage && contest.contestStage.toLowerCase().includes(searchTerm)) ||
        (contest.contest.location && contest.contest.location.toLowerCase().includes(searchTerm));
      
      // Search in problem names
      let problemMatch = false;
      if (window.problemsDataGlobal && contest.contest && contest.contest.problems) {
        const contestProblemsData = window.problemsDataGlobal[contest.contest.source.toUpperCase()];
        if (contestProblemsData && contestProblemsData[contest.contest.year]) {
          const yearProblems = contestProblemsData[contest.contest.year];
          
          // Check all problems in this contest
          for (let problem of contest.contest.problems) {
            const problemData = yearProblems.find(p => p.id == problem.problemId);
            if (problemData && problemData.name.toLowerCase().includes(searchTerm)) {
              problemMatch = true;
              break;
            }
          }
        }
      }
      
      searchMatch = contestMatch || problemMatch;
    }
    
    // Check olympiad filter
    const selectedOlympiads = Array.from(document.querySelectorAll('#olympiad-filters input:checked'))
      .map(cb => cb.value);
    
    let olympiadMatch = false;
    for (const selected of selectedOlympiads) {
      if (selected.includes(',')) {
        // This is a grouped option (like USACO) - check if contest matches any of the values
        const groupValues = selected.split(',');
        if (groupValues.includes(contest.contest.source.toUpperCase())) {
          olympiadMatch = true;
          break;
        }
      } else {
        // Regular single olympiad check
        if (selected === contest.contest.source.toUpperCase()) {
          olympiadMatch = true;
          break;
        }
      }
    }
    
    // Check medal filter
    const medalType = getMedalType(contest, contestScores);
    const medalMatch = selectedMedals.includes(medalType);
    
    return searchMatch && olympiadMatch && medalMatch;
  });
  
  // Update display
  const listContainer = document.getElementById('vc-history-list');
  listContainer.innerHTML = '';
  
  if (filteredContests.length === 0) {
    showFilteredEmptyState();
  } else {
    // Store global references to pass correct data
    let contestData = {};
    let problemsData = {};
    
    // Get the data from global scope if available, otherwise use stored allContests data
    if (typeof window.contestDataGlobal !== 'undefined') {
      contestData = window.contestDataGlobal;
      problemsData = window.problemsDataGlobal;
    }
    
    filteredContests.forEach(contest => {
      const item = createContestItem(contest, contestData, problemsData, contestScores);
      listContainer.appendChild(item);
    });
    document.getElementById('vc-history-empty').style.display = 'none';
    document.getElementById('vc-history-list').style.display = 'flex';
  }
  
  // Update stats for filtered contests
  updateStats(filteredContests);
}

function getMedalType(contest, contestScores) {
  const scoreData = contestScores[contest.contestId];
  
  if (scoreData && Array.isArray(scoreData.medalCutoffs) && scoreData.medalCutoffs.length > 0) {
    const totalScore = contest.score;
    const cutoffs = scoreData.medalCutoffs;
    const labels = scoreData.medalNames;

    const labelAt = (idx, fallback) => (labels[idx] ? String(labels[idx]).toLowerCase() : fallback);

    if (cutoffs.length >= 3) {
      const [goldCutoff, silverCutoff, bronzeCutoff] = cutoffs;
      if (totalScore >= goldCutoff) return 'gold';
      if (totalScore >= silverCutoff) return 'silver';
      if (totalScore >= bronzeCutoff) return 'bronze';
    } else if (cutoffs.length === 2) {
      const firstLabel = labelAt(0, 'gold');
      if (totalScore >= cutoffs[0]) return firstLabel;
      if (totalScore >= cutoffs[1]) return 'other'; // Always return 'other' for second tier
    } else if (cutoffs.length === 1) {
      const onlyLabel = labelAt(0, 'gold');
      if (totalScore >= cutoffs[0]) return onlyLabel;
    }
  }
  
  return 'other'; // Changed from 'none' to 'other'
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