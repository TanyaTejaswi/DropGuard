/**
 * DropGuard — Main Frontend Controller (Member 3)
 * Linear-Inspired Light Theme Architecture
 * Multi-Page View Controller, Gated Prediction & Dossier Authentication Engine
 */

let allStudents = [];
let currentFilter = "ALL";
let searchQuery = "";
let currentSortColumn = "risk_score";
let currentSortAsc = false; // default highest risk first
let currentActiveView = "view-overview";
let currentUser = null;
let pendingAuthAction = null;

const API_BASE = "http://localhost:8000";
const API_URL = `${API_BASE}/api/students`;
const HEALTH_URL = `${API_BASE}/api/health`;
const LOCAL_MOCK = "mock_students.json";

document.addEventListener("DOMContentLoaded", () => {
  checkBackendHealth();
  checkSavedAuth();
  fetchStudentData();
  setupFilterPills();
  setupSearchAndFilters();
  setupTableSorting();
  setupDemoPersonas();
  setupPredictionModal();
  setupKeyboardShortcuts();
  initViewFromHash();
});

/* ==========================================================================
   1. MULTI-PAGE VIEW ROUTING (Overview, Live Roster, Telemetry, Counseling)
   ========================================================================== */

/**
 * Switches the active page view and synchronizes all ribbon navigation bars.
 * Public views can be freely explored without login.
 * @param {string} viewId - 'view-overview' | 'view-roster' | 'view-telemetry' | 'view-counseling'
 */
function switchView(viewId) {
  const views = document.querySelectorAll(".page-view");
  let found = false;

  views.forEach(view => {
    if (view.id === viewId) {
      view.classList.add("active");
      found = true;
    } else {
      view.classList.remove("active");
    }
  });

  if (!found) {
    viewId = "view-overview";
    document.getElementById("view-overview")?.classList.add("active");
  }

  currentActiveView = viewId;

  // Sync ribbon pills (both desktop ribbon and mobile tabs)
  const navButtons = document.querySelectorAll(".ribbon-nav-pill");
  navButtons.forEach(btn => {
    if (btn.getAttribute("data-view") === viewId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Update URL hash without triggering reload
  const hashKey = viewId.replace("view-", "");
  history.replaceState(null, "", `#${hashKey}`);

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Re-render table if switching to roster
  if (viewId === "view-roster") {
    applyFiltersAndRender();
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Initializes the active view from the URL hash on page load.
 */
function initViewFromHash() {
  const hash = window.location.hash.replace("#", "").trim();
  if (hash === "roster" || hash === "dashboard") {
    switchView("view-roster");
  } else if (hash === "telemetry" || hash === "benchmarks") {
    switchView("view-telemetry");
  } else if (hash === "counseling" || hash === "hub") {
    switchView("view-counseling");
  } else {
    switchView("view-overview");
  }
}

// Handle browser back/forward navigation
window.addEventListener("hashchange", () => {
  initViewFromHash();
});

/* ==========================================================================
   2. AUTHENTICATION & ACCESS GATING ENGINE
   ========================================================================== */

/**
 * Opens the Linear authentication modal.
 * Can be triggered manually or automatically when unauthenticated users attempt
 * to run a prediction or inspect student dossiers.
 * @param {'signin'|'signup'} mode
 * @param {string|null} [reason=null] - Reason for gating (e.g. "Advisor sign-in required...")
 * @param {object|null} [pendingAction=null] - Action to resume after successful login
 */
function openAuthModal(mode = "signin", reason = null, pendingAction = null) {
  const modal = document.getElementById("auth-modal");
  const title = document.getElementById("auth-title");
  const reasonBanner = document.getElementById("auth-reason-banner");
  const reasonText = document.getElementById("auth-reason-text");
  if (!modal) return;

  pendingAuthAction = pendingAction || null;

  if (title) {
    title.innerText = mode === "signup" ? "Create Advisor Account" : "Sign in to DropGuard";
  }

  if (reasonBanner && reasonText) {
    if (reason) {
      reasonText.innerText = reason;
      reasonBanner.classList.remove("hidden");
    } else {
      reasonBanner.classList.add("hidden");
    }
  }

  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

/**
 * Closes the Linear authentication modal.
 */
function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.classList.add("hidden");
  pendingAuthAction = null;
}

/**
 * Performs instant demo counselor login and resumes any gated pending action.
 */
function performDemoLogin() {
  const demoAdvisor = {
    name: "Dr. Sarah Adams",
    email: "sarah.adams@university.edu",
    role: "Senior Academic Advisor",
    department: "Student Retention & Success",
    initials: "SA"
  };

  saveUserSession(demoAdvisor);
  completeAuthFlow("Signed in as Dr. Sarah Adams (Senior Advisor)");
}

/**
 * Handles custom email / password submit form.
 */
function handleAuthSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const emailInput = form.querySelector('input[type="email"]');
  const email = emailInput ? emailInput.value.trim() : "advisor@university.edu";
  const namePart = email.split("@")[0].replace(/[._-]/g, " ");
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  const user = {
    name: formattedName.length > 2 ? `Advisor ${formattedName}` : "Academic Advisor",
    email: email,
    role: "Academic Advisor",
    department: "Advisory Services",
    initials: formattedName.substring(0, 2).toUpperCase() || "AA"
  };

  saveUserSession(user);
  completeAuthFlow(`Welcome, ${user.name}!`);
}

/**
 * Concludes the authentication flow and immediately executes any pending action
 * that triggered the login modal.
 * @param {string} toastMessage
 */
function completeAuthFlow(toastMessage) {
  const actionToResume = pendingAuthAction;
  pendingAuthAction = null;

  closeAuthModal();
  showToast(toastMessage);
  applyFiltersAndRender();

  // If user was trying to perform a gated action, execute it automatically!
  if (actionToResume) {
    if (actionToResume.type === "open_predict") {
      document.getElementById("predict-modal")?.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    } else if (actionToResume.type === "open_student" && actionToResume.student) {
      if (typeof openStudentModal === "function") {
        openStudentModal(actionToResume.student);
      }
    } else if (actionToResume.type === "view" && actionToResume.viewId) {
      switchView(actionToResume.viewId);
    }
  } else {
    // If user logged in from home overview without pending action, guide to Roster
    if (currentActiveView === "view-overview") {
      switchView("view-roster");
    }
  }
}

/**
 * Saves user in localStorage and updates UI.
 */
function saveUserSession(user) {
  currentUser = user;
  try {
    localStorage.setItem("dropguard_user_session", JSON.stringify(user));
  } catch (e) {}
  updateAuthUI();
}

/**
 * Checks for existing user session on boot.
 */
function checkSavedAuth() {
  try {
    const saved = localStorage.getItem("dropguard_user_session");
    if (saved) {
      currentUser = JSON.parse(saved);
      updateAuthUI();
    }
  } catch (e) {
    currentUser = null;
  }
}

/**
 * Updates navbar auth container based on logged-in state.
 */
function updateAuthUI() {
  const container = document.getElementById("auth-controls");
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div class="flex items-center space-x-2.5 bg-slate-100/90 border border-slate-200/80 rounded-full pl-2 pr-3 py-1 shadow-2xs">
        <div class="h-6 w-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
          ${currentUser.initials}
        </div>
        <div class="text-left hidden sm:block">
          <p class="text-xs font-semibold text-slate-900 leading-tight">${currentUser.name}</p>
        </div>
        <button type="button" onclick="logoutUser()" title="Sign Out" class="text-[11px] text-slate-400 hover:text-slate-700 ml-1 cursor-pointer">
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button type="button" onclick="openAuthModal('signin')" class="text-xs font-semibold px-3 py-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
        Log In
      </button>
      <button type="button" onclick="openAuthModal('signup')" class="linear-btn-secondary text-xs cursor-pointer">
        Sign Up
      </button>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Logs out the current user and clears active sessions.
 */
function logoutUser() {
  currentUser = null;
  try {
    localStorage.removeItem("dropguard_user_session");
  } catch (e) {}
  updateAuthUI();
  applyFiltersAndRender();
  if (typeof closeStudentModal === "function") closeStudentModal();
  document.getElementById("predict-modal")?.classList.add("hidden");
  showToast("Signed out successfully");
}

/* ==========================================================================
   3. DATA INGESTION & HEALTH MONITORING
   ========================================================================== */

async function checkBackendHealth() {
  const badge = document.getElementById("server-status-badge");
  const dot = document.getElementById("server-status-dot");
  const label = document.getElementById("server-status-label");

  try {
    const res = await fetch(HEALTH_URL, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      if (dot) dot.className = "h-2 w-2 rounded-full bg-emerald-500 animate-pulse";
      if (label) label.innerText = "FastAPI ML Active";
      if (badge) badge.className = "hidden sm:flex text-xs px-2.5 py-1 rounded-full bg-emerald-50/70 text-emerald-800 font-medium border border-emerald-200/80 shadow-2xs items-center space-x-2";
      return true;
    }
  } catch (err) {}

  if (dot) dot.className = "h-2 w-2 rounded-full bg-amber-500";
  if (label) label.innerText = "Mock Dataset Active";
  if (badge) badge.className = "hidden sm:flex text-xs px-2.5 py-1 rounded-full bg-amber-50/70 text-amber-800 font-medium border border-amber-200/80 shadow-2xs items-center space-x-2";
  return false;
}

async function fetchStudentData() {
  try {
    let response;
    try {
      response = await fetch(API_URL, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error("API server returned non-OK status");
    } catch (apiErr) {
      console.warn("Backend API not reachable directly; serving from local mock_students.json:", apiErr);
      response = await fetch(LOCAL_MOCK);
    }

    allStudents = await response.json();
    sortStudents(currentSortColumn, currentSortAsc);

    updateKPIs(allStudents);
    updatePillCounters(allStudents);
    if (typeof renderCohortBreakdownBar === "function") {
      renderCohortBreakdownBar(allStudents);
    }
    applyFiltersAndRender();
  } catch (error) {
    console.error("Failed to load student dataset:", error);
  }
}

function updateKPIs(students) {
  if (!students || students.length === 0) return;

  const total = students.length;
  const highRisk = students.filter(s => s.prediction && s.prediction.risk_level === "High").length;
  const medRisk = students.filter(s => s.prediction && s.prediction.risk_level === "Medium").length;
  const atRiskTotal = highRisk + medRisk;
  const atRiskPct = ((atRiskTotal / total) * 100).toFixed(1);
  const avgGpa = (students.reduce((acc, s) => acc + (s.gpa || 0), 0) / total).toFixed(1);

  const totalEl = document.getElementById("kpi-total");
  if (totalEl) totalEl.innerText = total;

  const atRiskEl = document.getElementById("kpi-at-risk-pct");
  const atRiskBreakdownEl = document.getElementById("kpi-at-risk-breakdown");
  if (atRiskEl) atRiskEl.innerText = `${atRiskPct}%`;
  if (atRiskBreakdownEl) atRiskBreakdownEl.innerText = `${atRiskTotal} of ${total} in High / Watchlist`;

  const highRiskEl = document.getElementById("kpi-high-risk");
  if (highRiskEl) highRiskEl.innerText = `${highRisk} Critical`;

  const avgGpaEl = document.getElementById("kpi-avg-gpa");
  if (avgGpaEl) avgGpaEl.innerText = `${avgGpa} / 10`;
}

function updatePillCounters(students) {
  if (!students) return;
  const total = students.length;
  const high = students.filter(s => s.prediction && s.prediction.risk_level === "High").length;
  const med = students.filter(s => s.prediction && s.prediction.risk_level === "Medium").length;
  const low = students.filter(s => s.prediction && s.prediction.risk_level === "Low").length;

  const pillAll = document.getElementById("pill-count-all");
  const pillHigh = document.getElementById("pill-count-high");
  const pillMed = document.getElementById("pill-count-med");
  const pillLow = document.getElementById("pill-count-low");

  if (pillAll) pillAll.innerText = total;
  if (pillHigh) pillHigh.innerText = high;
  if (pillMed) pillMed.innerText = med;
  if (pillLow) pillLow.innerText = low;
}

/* ==========================================================================
   4. ROSTER FILTERING, SEARCH & SORTING (WITH AUTH GATING)
   ========================================================================== */

function setupFilterPills() {
  const container = document.getElementById("filter-pills-container");
  if (!container) return;

  const pills = container.querySelectorAll(".filter-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      currentFilter = pill.getAttribute("data-filter") || "ALL";

      const select = document.getElementById("filter-risk");
      if (select) select.value = currentFilter;

      applyFiltersAndRender();
    });
  });
}

function setupSearchAndFilters() {
  const searchInput = document.getElementById("search-input");
  const filterRisk = document.getElementById("filter-risk");

  searchInput?.addEventListener("input", (e) => {
    searchQuery = (e.target.value || "").toLowerCase().trim();
    applyFiltersAndRender();
  });

  filterRisk?.addEventListener("change", (e) => {
    currentFilter = e.target.value;
    const pills = document.querySelectorAll(".filter-pill");
    pills.forEach(p => {
      if (p.getAttribute("data-filter") === currentFilter) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });
    applyFiltersAndRender();
  });
}

function applyFiltersAndRender() {
  const filtered = allStudents.filter(student => {
    const matchesSearch = 
      !searchQuery ||
      student.name.toLowerCase().includes(searchQuery) ||
      student.student_id.toLowerCase().includes(searchQuery) ||
      student.program.toLowerCase().includes(searchQuery);

    const risk = student.prediction?.risk_level || "Medium";
    const matchesRisk = currentFilter === "ALL" || risk === currentFilter;

    return matchesSearch && matchesRisk;
  });

  renderTable(filtered);
}

function sortStudents(column, asc = true) {
  currentSortColumn = column;
  currentSortAsc = asc;

  allStudents.sort((a, b) => {
    let valA, valB;
    if (column === "risk_score") {
      valA = a.prediction ? a.prediction.risk_score : 0;
      valB = b.prediction ? b.prediction.risk_score : 0;
    } else if (column === "gpa") {
      valA = a.gpa || 0;
      valB = b.gpa || 0;
    } else if (column === "attendance") {
      valA = a.attendance_pct || 0;
      valB = b.attendance_pct || 0;
    } else if (column === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return 0;
    }
    return asc ? valA - valB : valB - valA;
  });
}

function renderTable(students) {
  const tbody = document.getElementById("student-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!students || students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-slate-400 bg-white">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          <p class="font-semibold text-slate-600 text-sm">No students match your query criteria.</p>
          <p class="text-xs text-slate-400 mt-1">Try clearing the search box or selecting "All Students".</p>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  students.forEach(student => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/80 transition-colors cursor-pointer group";

    // Gated click: if unauthenticated, pops login dialog automatically!
    tr.onclick = () => {
      if (!currentUser) {
        openAuthModal(
          "signin",
          `Advisor sign-in required to inspect risk predictions and counseling dossiers for ${student.name}.`,
          { type: "open_student", student }
        );
        return;
      }
      openStudentModal(student);
    };

    const riskLevel = student.prediction ? student.prediction.risk_level : "Medium";
    const riskScore = student.prediction ? student.prediction.risk_score : 0.5;
    const riskBadge = getRiskBadge(riskLevel, riskScore);

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">${student.name}</div>
        <div class="font-mono text-xs text-slate-400">${student.student_id}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-600">
        <div class="font-medium text-xs text-slate-800">${student.program}</div>
        <div class="text-xs text-slate-400">Semester ${student.semester}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="font-mono text-xs font-semibold ${student.attendance_pct < 65 ? 'text-rose-600 font-bold' : 'text-slate-700'}">
          ${student.attendance_pct}%
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
        ${student.gpa}/10
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${riskBadge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right">
        <button class="linear-btn-secondary text-xs px-3 py-1 group-hover:border-slate-300 transition-all flex items-center justify-end space-x-1 ml-auto">
          ${currentUser ? '<span>View Dossier</span>' : '<span class="text-indigo-600 font-semibold flex items-center"><i data-lucide="lock" class="w-3 h-3 mr-1 inline"></i>Sign In to Inspect</span>'}
          <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

function getRiskBadge(level, score) {
  const pct = Math.round(score * 100);
  if (level === "High") {
    return `
      <span class="linear-tag linear-tag-high">
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        <span>${pct}% (High)</span>
      </span>
    `;
  } else if (level === "Medium") {
    return `
      <span class="linear-tag linear-tag-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>${pct}% (Watch)</span>
      </span>
    `;
  } else {
    return `
      <span class="linear-tag linear-tag-low">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>${pct}% (Safe)</span>
      </span>
    `;
  }
}

function setupTableSorting() {
  const headers = [
    { id: "sort-risk", col: "risk_score" },
    { id: "sort-gpa", col: "gpa" },
    { id: "sort-attendance", col: "attendance" },
    { id: "sort-name", col: "name" }
  ];

  headers.forEach(({ id, col }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("click", () => {
        const newAsc = currentSortColumn === col ? !currentSortAsc : false;
        sortStudents(col, newAsc);
        applyFiltersAndRender();
      });
    }
  });
}

function setupDemoPersonas() {
  const buttons = document.querySelectorAll(".demo-persona-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const studentId = btn.getAttribute("data-id");
      const target = allStudents.find(s => s.student_id === studentId);
      if (target) {
        if (!currentUser) {
          openAuthModal(
            "signin",
            `Advisor sign-in required to inspect demo persona (${target.name}).`,
            { type: "open_student", student: target }
          );
          return;
        }
        if (typeof openStudentModal === "function") {
          openStudentModal(target);
        }
      }
    });
  });
}

/* ==========================================================================
   5. LIVE ML PREDICTION MODAL (DYNAMIC APPROVED UNITS OUT OF 6 PER SEMESTER)
   ========================================================================== */

function renderDynamicSemesterApprovedInputs(selectedSemester) {
  const container = document.getElementById("dynamic-semesters-container");
  const semIndicator = document.getElementById("active-sem-indicator");
  const summaryBadge = document.getElementById("approved-units-summary");
  if (!container) return;

  const semNum = Math.max(1, Math.min(8, parseInt(selectedSemester, 10) || 1));
  if (semIndicator) semIndicator.innerText = semNum;

  // Preserve existing user inputs if already typed
  const existingValues = {};
  for (let i = 1; i <= 8; i++) {
    const el = document.getElementById(`form-sem${i}-approved`) || document.getElementById(`form-sem${i}-units`);
    if (el) existingValues[i] = parseInt(el.value, 10);
  }

  container.innerHTML = "";

  for (let i = 1; i <= semNum; i++) {
    // Default to 6 approved units (normal full clearance), or preserved value
    const prevVal = existingValues[i] !== undefined && !isNaN(existingValues[i]) ? existingValues[i] : 6;
    const div = document.createElement("div");
    div.className = "bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1";
    div.innerHTML = `
      <div class="flex items-center justify-between">
        <label for="form-sem${i}-approved" class="block text-[11px] font-bold text-slate-800">
          Sem ${i} Approved Units (out of 6)
        </label>
        <span class="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">Max 6</span>
      </div>
      <input 
        id="form-sem${i}-approved" 
        type="number" 
        min="0" 
        max="6" 
        value="${prevVal}" 
        class="sem-approved-input w-full text-xs font-mono font-bold px-2.5 py-1.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white" 
        placeholder="6"
      />
      <div class="flex items-center justify-between text-[9px] text-slate-400">
        <span>Passed subjects</span>
        <span id="sem${i}-status-pill" class="font-medium text-emerald-600">6/6 Clear</span>
      </div>
    `;
    container.appendChild(div);
  }

  const updateSummary = () => {
    let totalApproved = 0;
    const maxTotal = semNum * 6;

    for (let i = 1; i <= semNum; i++) {
      const el = document.getElementById(`form-sem${i}-approved`);
      const val = el ? Math.max(0, Math.min(6, parseInt(el.value, 10) || 0)) : 6;
      totalApproved += val;

      const pill = document.getElementById(`sem${i}-status-pill`);
      if (pill) {
        const failedInSem = 6 - val;
        if (failedInSem === 0) {
          pill.className = "font-medium text-emerald-600";
          pill.innerText = "6/6 Clear";
        } else {
          pill.className = "font-medium text-rose-600";
          pill.innerText = `${val}/6 (${failedInSem} backlogs)`;
        }
      }
    }

    const totalBacklogs = Math.max(0, maxTotal - totalApproved);

    if (summaryBadge) {
      if (totalBacklogs === 0) {
        summaryBadge.className = "text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold shrink-0";
        summaryBadge.innerText = `${totalApproved} / ${maxTotal} Approved (0 Backlogs)`;
      } else {
        summaryBadge.className = "text-[11px] font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-bold shrink-0";
        summaryBadge.innerText = `${totalApproved} / ${maxTotal} Approved (${totalBacklogs} Backlogs)`;
      }
    }
  };

  container.querySelectorAll(".sem-approved-input").forEach(input => {
    input.addEventListener("input", updateSummary);
  });

  updateSummary();
}

function setupPredictionModal() {
  const openBtn = document.getElementById("btn-open-predict-modal");
  const modal = document.getElementById("predict-modal");
  const closeBtn = document.getElementById("predict-close-btn");
  const cancelBtn = document.getElementById("predict-cancel-btn");
  const backdrop = document.getElementById("predict-backdrop");
  const form = document.getElementById("predict-form");
  const semSelect = document.getElementById("form-semester");

  // Initial render of dynamic semester inputs
  renderDynamicSemesterApprovedInputs(semSelect?.value || 2);

  // Re-render dynamically whenever user changes current semester (Sem 1 to 8)
  semSelect?.addEventListener("change", (e) => {
    renderDynamicSemesterApprovedInputs(e.target.value);
  });
  semSelect?.addEventListener("input", (e) => {
    renderDynamicSemesterApprovedInputs(e.target.value);
  });

  const closeModal = () => modal.classList.add("hidden");
  const openModal = () => {
    // Authentication Gate Check
    if (!currentUser) {
      openAuthModal("signin", "Advisor sign-in required to execute live machine learning dropout predictions.", { type: "open_predict" });
      return;
    }
    renderDynamicSemesterApprovedInputs(semSelect?.value || 2);
    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  };

  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      modal.classList.add("hidden");
      openAuthModal("signin", "Advisor sign-in required to execute live machine learning dropout predictions.", { type: "open_predict" });
      return;
    }

    const submitBtn = document.getElementById("predict-submit-btn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Evaluating Model...</span>`;

    const name = document.getElementById("form-name").value;
    const program = document.getElementById("form-program").value;
    const semester = parseInt(document.getElementById("form-semester").value, 10) || 1;
    const attendance = parseFloat(document.getElementById("form-attendance").value);
    const gpa = parseFloat(document.getElementById("form-gpa").value);
    const tuitionOverdue = document.getElementById("form-tuition").checked;
    const debtor = document.getElementById("form-debtor").checked;

    // Collect approved units out of 6 for each semester up to active semester
    const approvedBySem = {};
    const failedBySem = {};
    let totalApproved = 0;
    let totalBacklogs = 0;

    for (let i = 1; i <= semester; i++) {
      const el = document.getElementById(`form-sem${i}-approved`);
      const val = el ? Math.max(0, Math.min(6, parseInt(el.value, 10) || 0)) : 6;
      approvedBySem[`Sem ${i}`] = val;
      const failed = 6 - val;
      failedBySem[`Sem ${i}`] = failed;
      totalApproved += val;
      totalBacklogs += failed;
    }

    // Map into UCI curricular units features
    const sem1Units = approvedBySem["Sem 1"] !== undefined ? approvedBySem["Sem 1"] : 6;

    let sem2Units;
    if (semester === 1) {
      sem2Units = sem1Units;
    } else if (semester === 2) {
      sem2Units = approvedBySem["Sem 2"] !== undefined ? approvedBySem["Sem 2"] : 6;
    } else {
      // For senior semesters (3 to 8), sem2Units represents the latest semester performance
      sem2Units = approvedBySem[`Sem ${semester}`] !== undefined ? approvedBySem[`Sem ${semester}`] : 6;
    }

    // Normalize CGPA: display on 10-point scale, map to 20-point scale for UCI-trained model features
    const displayGpa = gpa <= 10.0 ? gpa : parseFloat((gpa / 2).toFixed(1));
    const uciGrade = gpa <= 10.0 ? Math.min(20, Math.max(0, gpa * 2)) : gpa;

    const studentData = {
      student_id: `STU-GEN-${Math.floor(100 + Math.random() * 900)}`,
      name: name,
      program: program,
      semester: semester,
      attendance_pct: attendance,
      gpa: displayGpa,
      total_backlogs: totalBacklogs,
      total_approved: totalApproved,
      approved_units_by_sem: approvedBySem,
      failed_subjects_by_sem: failedBySem,
      "Marital status": 1,
      "Application mode": 1,
      "Application order": 1,
      "Course": 33,
      "Daytime/evening attendance": 1,
      "Previous qualification": 1,
      "Previous qualification (grade)": 120.0,
      "Nacionality": 1,
      "Mother's qualification": 1,
      "Father's qualification": 1,
      "Mother's occupation": 1,
      "Father's occupation": 1,
      "Admission grade": 115.0,
      "Displaced": 1,
      "Educational special needs": 0,
      "Debtor": debtor ? 1 : 0,
      "Tuition fees up to date": tuitionOverdue ? 0 : 1,
      "Gender": 1,
      "Scholarship holder": 0,
      "Age at enrollment": 20,
      "International": 0,
      "Curricular units 1st sem (credited)": 0,
      "Curricular units 1st sem (enrolled)": 6,
      "Curricular units 1st sem (evaluations)": 6,
      "Curricular units 1st sem (approved)": sem1Units,
      "Curricular units 1st sem (grade)": uciGrade,
      "Curricular units 1st sem (without evaluations)": 0,
      "Curricular units 2nd sem (credited)": 0,
      "Curricular units 2nd sem (enrolled)": 6,
      "Curricular units 2nd sem (evaluations)": 6,
      "Curricular units 2nd sem (approved)": sem2Units,
      "Curricular units 2nd sem (grade)": sem2Units === 0 ? 0.0 : uciGrade,
      "Curricular units 2nd sem (without evaluations)": 0,
      "Unemployment rate": 10.8,
      "Inflation rate": 1.4,
      "GDP": 1.74
    };

    try {
      let result;
      try {
        const resp = await fetch(`${API_BASE}/api/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentData),
          signal: AbortSignal.timeout(4000)
        });
        if (!resp.ok) throw new Error("API inference failure");
        result = await resp.json();
      } catch (postErr) {
        // High-fidelity fallback calculation if server is offline
        const score = totalBacklogs >= 3 || attendance < 60 || sem2Units < 2 ? 0.88 : (totalBacklogs >= 1 || attendance < 75 ? 0.52 : 0.18);
        const level = score >= 0.65 ? "High" : (score >= 0.35 ? "Medium" : "Low");
        
        const fallbackFactors = [];
        if (totalBacklogs > 0) {
          fallbackFactors.push(`Completed ${totalApproved} of ${semester * 6} credits (${totalBacklogs} backlogs) across Sem 1–${semester}`);
          for (let i = 1; i <= semester; i++) {
            if (failedBySem[`Sem ${i}`] > 0) {
              fallbackFactors.push(`Semester ${i}: Approved ${approvedBySem[`Sem ${i}`]}/6 units (${failedBySem[`Sem ${i}`]} backlogs)`);
            }
          }
        } else {
          fallbackFactors.push(`100% Course Completion: Approved all ${totalApproved}/${semester * 6} units across Sem 1–${semester}`);
        }
        if (attendance < 65) fallbackFactors.push("Attendance below mandatory 65% threshold");
        if (debtor) fallbackFactors.push("Student registered with outstanding debt");
        if (tuitionOverdue) fallbackFactors.push("Overdue tuition fees flagged");

        result = {
          prediction: {
            risk_score: score,
            risk_level: level,
            top_risk_factors: fallbackFactors.slice(0, 3)
          },
          counseling_memo: {
            summary: `${name} displays ${level} dropout vulnerability in Semester ${semester} with ${totalApproved}/${semester * 6} approved credits and attendance at ${attendance}%. Targeted academic remediation is required.`,
            action_items: [
              totalBacklogs > 0 ? `Initiate course credit recovery for the ${totalBacklogs} backlog subject(s).` : "Maintain consistent study schedule and pace.",
              "Connect with departmental peer tutors for prerequisite revision.",
              "Establish a structured bi-weekly attendance and progress check-in."
            ],
            meeting_talking_points: [
              `Review academic workload across semesters and identify specific subject hurdles.`,
              "Explore campus resources for academic and personal support."
            ]
          }
        };
      }

      // Ensure approved units and backlog insights are prominently surfaced in top_risk_factors
      let finalTopFactors = result.prediction.top_risk_factors || [];
      if (totalBacklogs > 0) {
        const approvedText = `Approved ${totalApproved} of ${semester * 6} credits (${totalBacklogs} backlogs across Sem 1–${semester})`;
        if (!finalTopFactors.some(f => f.toLowerCase().includes("approved") || f.toLowerCase().includes("backlog"))) {
          finalTopFactors = [approvedText, ...finalTopFactors].slice(0, 3);
        }
      } else {
        const perfectText = `Cleared 100% course credits (${totalApproved}/${semester * 6} units approved)`;
        if (!finalTopFactors.some(f => f.toLowerCase().includes("approved") || f.toLowerCase().includes("credit"))) {
          finalTopFactors = [perfectText, ...finalTopFactors].slice(0, 3);
        }
      }

      const newStudent = {
        student_id: studentData.student_id,
        name: studentData.name,
        program: studentData.program,
        semester: studentData.semester,
        attendance_pct: studentData.attendance_pct,
        gpa: studentData.gpa,
        total_backlogs: totalBacklogs,
        total_approved: totalApproved,
        approved_units_by_sem: approvedBySem,
        failed_subjects_by_sem: failedBySem,
        prediction: {
          ...result.prediction,
          top_risk_factors: finalTopFactors
        },
        top_risk_factors: finalTopFactors,
        counseling_memo: result.counseling_memo
      };

      allStudents.unshift(newStudent);
      updateKPIs(allStudents);
      updatePillCounters(allStudents);
      if (typeof renderCohortBreakdownBar === "function") {
        renderCohortBreakdownBar(allStudents);
      }
      applyFiltersAndRender();

      closeModal();
      switchView("view-roster");
      openStudentModal(newStudent);
      showToast(`Evaluation completed for ${newStudent.name}`);
    } catch (err) {
      console.error("[Prediction Form Error]", err);
      showToast("Evaluation failed. Please review student values.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <i data-lucide="zap" class="w-3.5 h-3.5 text-indigo-300"></i>
        <span>Run DropGuard Pipeline</span>
      `;
      if (window.lucide) lucide.createIcons();
    }
  });
}

/* ==========================================================================
   6. GLOBAL KEYBOARD SHORTCUTS (Linear Style ⌘P, ⌘K, Esc)
   ========================================================================== */

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Escape closes any open modal
    if (e.key === "Escape") {
      closeAuthModal();
      if (typeof closeStudentModal === "function") closeStudentModal();
      document.getElementById("predict-modal")?.classList.add("hidden");
    }

    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
      return;
    }

    // ⌘P or Ctrl+P opens prediction modal (with auth gate)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      if (!currentUser) {
        openAuthModal("signin", "Advisor sign-in required to execute live machine learning predictions.", { type: "open_predict" });
        return;
      }
      document.getElementById("btn-open-predict-modal")?.click();
    }

    // ⌘K or Ctrl+K focuses search in Roster
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      switchView("view-roster");
      setTimeout(() => {
        document.getElementById("search-input")?.focus();
      }, 100);
    }
  });
}
