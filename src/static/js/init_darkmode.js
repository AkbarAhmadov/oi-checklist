function darkModeCss() {
  let green, yellow, red, white, bg, year, yearText, link, greyCell, vcInput, vcDarker, vcStart, vcOtherGrey, bronze, silver, gold;
  const theme = localStorage.getItem('theme');
  if (theme == 'darkClassic') {
    green = '#64cd69';
    yellow = '#e6b800';
    red = '#f44336';
    white = '#1b1b1b';
    bg = '#1e1e1e';
    year = '#202938';
    yearText = '#007bff';
    greyCell = '#2A2A2A';
    link = '#017BFF';
    vcInput = '#2a2a2a';
    vcDarker = '#2b2b2b';
    vcStart = '#28a745';
    vcOtherGrey = '#333';
    silver = '#252525';
    bronze = '#2a2018';
    gold = '#2a2618';
  } else {
    red = '#650800';
    green = '#3DA940';
    yellow = '#D0A719';
    white = '#171818';
    bg = '#181919';
    year = '#1E1E1E';
    greyCell = '#1E1E1E';
    yearText = '#AEAEAE';
    link = '#095db7';
    vcInput = vcDarker = '#1e1e1e';
    vcStart = green;
    vcOtherGrey = '#222';
    silver = '#212020';
    bronze = '#1d1610';
    gold = '#1d1a11';
  }

  const styleDashboard = document.createElement('style');
  styleDashboard.textContent =
    `
.dark-mode {
  background-color: ${bg};
  color: #ffffff
}
.dark-mode .navbar-title,
.dark-mode .welcome-message,
.dark-mode .logout-button {
  color: #ffffff;
}

.dark-mode .problem-cell a {
  color: ${link}
}

.dark-mode .year-cell,
.dark-mode .day-cell {
  background-color: ${year};
  color: ${yearText};
}

.dark-mode table,
.dark-mode td,
.dark-mode th {
    border: 1px solid #2a2a2a;
}

body.dark-mode .tab-switcher {
  border-bottom: 1px solid #555;
}

body.dark-mode .tab-switcher .tab {
  background: #222;
  color: #eee;
}

body.dark-mode .tab-switcher .tab:hover {
  background-color: #333;
}

body.dark-mode .tab-switcher .tab.active {
  background-color: #3399ff;
  border-bottom: 2px solid #3399ff;
  color: #fff;
}

.dark-mode .ojuz-section {
  background-color: #1e3e1e;
  border-color: #28a745;
}

.dark-mode .codechef-section {
  background-color: #3e2723;
  border-color: #8d6e63;
}

.dark-mode .codechef-section .vc-input {
  background: #222;
  color: #eee;
  border-color: #555;
}

body.dark-mode .connect-button.codechef {
  background-color: #8d6e63;
}

body.dark-mode .connect-button.codechef:hover {
  background-color: #6d4c41;
}

.dark-mode .ojuz-section .vc-input {
  background: #222;
  color: #eee;
  border-color: #555;
}

.dark-mode .form-note {
  color: #aaa;
}

body.dark-mode .md-toolbar-sep {
  background: #444;
}

.dark-mode .md-preview {
  border-color: #3a3a3a;
  background: #1f1f1f;
  color: #e6e6e6;
}

.dark-mode .note-icon {
  color: #bbb;
}

.dark-mode .note-icon:hover {
  color: #fff;
}

.dark-mode .note-icon.has-note {
  color: #82c6ff;
}

.dark-mode .login-container {
  background-color: #1e1e1e;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
}

.dark-mode .login-container h2 {
  color: #ffffff;
}

.dark-mode .input-field {
  background-color: #2a2a2a;
  border: 1px solid #444;
  color: #f0f0f0;
}

.dark-mode .input-field:focus {
  border-color: #888;
}

.dark-mode .error-message {
  color: #ff6b6b;
}

.dark-mode .btn-login {
  background-color: #333;
  border: 1px solid #555;
  color: #f0f0f0;
}

.dark-mode .btn-login:hover {
  background-color: #555;
  color: #ffffff;
  font-weight: bold;
}

.dark-mode .footer {
  color: #aaa;
}

.dark-mode .footer a {
  color: #bbb;
}

.dark-mode .footer a:hover {
  color: #fff;
}

.dark-mode .white {
  background-color: ${white};
}

.dark-mode .green {
  background-color: ${green};
}

.dark-mode .yellow {
  background-color: ${yellow};
}

.dark-mode .red {
  background-color: ${red};
}

.dark-mode .problem-cell.skeleton {
  background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 37%, #2a2a2a 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
  color: transparent;
  height: 20px;
  padding: 12px;
}

.dark-mode #status-popup {
  background: #2a2a2a;
  border-color: #444;
  color: #f0f0f0;
}

.dark-mode #popup-status {
  color: #f0f0f0;
}

.dark-mode #popup-status.yellow {
  color: #000000;
}

.dark-mode #popup-status.green {
  color: #ffffff;
}

.dark-mode #popup-status.red {
  color: #ffffff;
}

.dark-mode #popup-score {
  color: #4ea1f3;
}

.dark-mode .popup-out-of {
  color: #4ea1f3;
}

.dark-mode .popup-score span:focus {
  background-color: #3a3a3a;
}

.dark-mode .progress-segment.white {
  background-color: #353535;
}

body.dark-mode .settings-button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

body.dark-mode .settings-icon {
  color: #fff;
}

body.dark-mode .settings-dropdown {
  background-color: rgba(51, 51, 51, 0.95);
  border-color: #555;
}

body.dark-mode .settings-label {
  color: #fff;
}

body.dark-mode .general-button {
  color: #fff;
}

body.dark-mode .general-button:hover {
  background-color: #444;
}

body.dark-mode .connection-card {
  background-color: #2b2b2b;
}

body.dark-mode .connection-name {
  color: #eee;
}

body.dark-mode .connect-button {
  background-color: #3399ff;
}

body.dark-mode .connect-button:hover {
  background-color: #287acc;
}

body.dark-mode .popup {
  background-color: #1e1e1e;
  color: #eee;
}

body.dark-mode .cookie-instruction {
  background-color: #2d2d2d;
  color: #ccc;
}

body.dark-mode .cookie-input {
  background-color: #333;
  color: #eee;
  border: 1px solid #555;
}

body.dark-mode .submit-cookie-button {
  background-color: #3399ff;
}

body.dark-mode .submit-cookie-button:hover {
  background-color: #287acc;
}

.dark-mode .usaco-tab.platinum {
  background-color: #d0d0d0;
  color:  #1a1a1a;
}

.dark-mode .usaco-tab.gold {
  background-color: #ffd700;
  color: #333300;
}

.dark-mode .usaco-tab.silver {
  background-color: #e0e0e0;
  color: #222222;
}

.dark-mode .usaco-tab.bronze {
  background-color: #de985c;
  color: #3a1f0f;
}

.dark-mode .separator::before,
.dark-mode .separator::after {
  border-top-color: #444;
}

.dark-mode .separator span {
  background-color: #1e1e1e;
  color: #aaa;
}

@media (max-width: 768px) {
  .dark-mode-toggle {
    order: 2;
    transform: scale(0.9);
  }
}

.dark-mode .section-progress-bar .progress-segment.white {
  background-color: #2a2a2a;
}

.dark-mode .home-icon-svg path {
  fill: white;
}

.dark-mode .empty-state {
  background-color: #1e1e1e;
  border-color: #1e1e1e;
}

.dark-mode .empty-state h3 {
  color: #ffffff;
}

.dark-mode .empty-state p {
  color: #cccccc;
}

body.dark-mode .md-btn {
  border-color: #555;
  color: #eee;
}

body.dark-mode .md-btn:hover {
  background: #2a2f36;
}

body.dark-mode .md-editor {
  background: #1b1b1b;
  border-color: #333;
}

body.dark-mode .md-line.editing {
  background: #262b31;
}

body.dark-mode .md-line code {
  background: #2a2f36;
}

body.dark-mode .md-line pre {
  background: #1f242a;
  border-color: #2b3138;
  color: #e6e6e6;
}

.dark-mode .md-textarea {
  color: #e6e6e6;
  background: #222;
  border-color: #3a3a3a;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, .2);
}

.dark-mode .md-textarea:focus {
  border-color: #82c6ff;
  box-shadow: 0 0 0 3px rgba(130, 198, 255, .25);
}
`;
  document.head.appendChild(styleDashboard);

  const styleSettings = document.createElement('style');
  styleSettings.textContent =
    `
.dark-mode #platform-pref .settings-item-title-new {
  color: #fff;
}
.dark-mode #platform-pref .settings-item-description-new {
  color: #ccc;
}
.dark-mode .platform-pref-panel {
  background: transparent;
}
.dark-mode .platform-list li {
  background: #2f2f2f;
  border-color: #444;
  color: #e6e6e6;
}
.dark-mode .platform-list li:hover {
  background: #363636;
}

.dark-mode .settings-item-new {
  background-color: ${greyCell};
  border-color: #444;
}
.dark-mode .settings-item-new:hover {
  border-color: #666;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark-mode .status-badge-new.public {
  background-color: ${green};
}
.dark-mode .status-badge-new.private {
  background-color: ${red};
}

.dark-mode .settings-button-new {
  background-color: #3399ff;
}
.dark-mode .settings-button-new:hover {
  background-color: #287acc;
}
`;
  document.head.appendChild(styleSettings);

  const styleVc = document.createElement('style');
  styleVc.textContent =
    `
.dark-mode .vc-select,
.dark-mode .vc-input,
.dark-mode .score-input-field {
  background-color: ${vcInput};
  border-color: #444;
  color: #f0f0f0;
}

.dark-mode .contest-details {
  background-color: ${vcDarker};
  border-color: #444;
}

.dark-mode .past-vc-preview {
  background-color: ${vcDarker};
  border-color: #444;
}

.dark-mode .start-btn {
  background-color: ${vcStart};
}

.dark-mode .stat-card,
.dark-mode .vc-history-item {
  background-color: ${vcDarker};
  border-color: #444;
}

.dark-mode .vc-detail-main {
  background-color: ${vcDarker};
  border-color: #444;
}

.dark-mode .vc-detail-summary,
.dark-mode .vc-detail-metadata {
  background-color: ${vcOtherGrey};
  border-color: #444;
}

.dark-mode .vc-detail-problem,
.dark-mode .vc-detail-stat-card {
  background-color: ${vcDarker};
  border-color: #444;
}

.dark-mode .contest-comparison {
  background-color: ${vcOtherGrey};
  border-color: #444;
}

.dark-mode .vc-detail-main.medal-silver {
  background-color: ${silver};
  border-left-color: #c0c0c0;
}

.dark-mode .vc-detail-main.medal-bronze {
  background-color: ${bronze};
  border-left-color: #cd7f32;
}

.dark-mode .vc-detail-main.medal-gold {
  background-color: ${gold};
  border-left-color: #ffd700;
}

.dark-mode .analysis-timeline {
  background-color: ${vcOtherGrey};
  border-color: #444444;
}

.dark-mode .analysis-graphs {
  background-color: ${vcOtherGrey};
  border-color: #444444;
}
`;
  document.head.appendChild(styleVc);
}

const theme = localStorage.getItem('theme');
if (theme != 'lightClassic') {
  document.documentElement.classList.add('dark-mode');
  darkModeCss();
}