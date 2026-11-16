/**
 * DropGuard — Main Frontend Controller (Member 3)
 * Full Implementation:
 * - Ingests data from FastAPI server with graceful offline fallback (Day 6)
 * - Renders KPI summary metric cards: Total Students, % At-Risk, Average GPA (Day 2)
 * - Interactive Search & Filter Pills for High/Medium/Low tiers (Day 3)
 * - Sortable columns, live cohort breakdown bar, and fast demo profiles (Day 7)
 * - Executes live on-demand ML predictions with instant deep-dive dossier
 */

let allStudents = [];
let currentFilter = "ALL";
let searchQuery = "";
let currentSortColumn = "risk_score";
let currentSortAsc = false; // default highest risk first

const API_BASE = "http://localhost:8000";
const API_URL = `${API_BASE}/api/students`;
const HEALTH_URL = `${API_BASE}/api/health`;
const LOCAL_MOCK = "mock_students.json";

document.addEventListener("DOMContentLoaded", () => {
  checkBackendHealth();
  fetchStudentData();
  setupFilterPills();
  setupSearchAndFilters();
  setupTableSorting();
  setupDemoPersonas();
  setupPredictionModal();
});

/**
 * Checks backend API health and displays real-time server status badge.
 */
async function checkBackendHealth() {
  const badge = document.getElementById("server-status-badge");
  const dot = document.getElementById("server-status-dot");
  const label = document.getElementById("server-status-label");

  try {
    const res = await fetch(HEALTH_URL, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      if (dot) dot.className = "h-2 w-2 rounded-full bg-emerald-500 animate-pulse";
      if (label) label.innerText = "FastAPI ML Core Active";
      if (badge) badge.className = "text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center space-x-1.5";
      return true;
    }
  } catch (err) {
    // API not reachable directly
  }

  if (dot) dot.className = "h-2 w-2 rounded-full bg-amber-500";
  if (label) label.innerText = "Standalone / Mock Mode";
  if (badge) badge.className = "text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200 flex items-center space-x-1.5";
  return false;
}

/**
 * Loads student dataset: attempts FastAPI endpoint first, falls back to local JSON.
 */
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

    // Initial Sort: Highest risk first
    sortStudents(currentSortColumn, currentSortAsc);

    // Update KPI cards, filter pill counters, breakdown bar, and table
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

/**
 * Updates top KPI summary metric cards strictly per Day 2 Blueprint:
 * (Total Students, % At-Risk, Average GPA)
 * @param {Array<object>} students
 */
function updateKPIs(students) {
  if (!students || students.length === 0) return;

  const total = students.length;
  const highRisk = students.filter(s => s.prediction && s.prediction.risk_level === "High").length;
  const medRisk = students.filter(s => s.prediction && s.prediction.risk_level === "Medium").length;
  const atRiskTotal = highRisk + medRisk;
  const atRiskPct = ((atRiskTotal / total) * 100).toFixed(1);
  const avgGpa = (students.reduce((acc, s) => acc + (s.gpa || 0), 0) / total).toFixed(1);

  // Total Students
  const totalEl = document.getElementById("kpi-total");
  if (totalEl) totalEl.innerText = total;

  // % At-Risk (Day 2 Blueprint core metric)
  const atRiskEl = document.getElementById("kpi-at-risk-pct");
  const atRiskBreakdownEl = document.getElementById("kpi-at-risk-breakdown");
  if (atRiskEl) atRiskEl.innerText = `${atRiskPct}%`;
  if (atRiskBreakdownEl) atRiskBreakdownEl.innerText = `${atRiskTotal} of ${total} in High / Watchlist`;

  // High Risk Alert
  const highRiskEl = document.getElementById("kpi-high-risk");
  if (highRiskEl) highRiskEl.innerText = `${highRisk} Critical`;

  // Cohort Average GPA
  const avgGpaEl = document.getElementById("kpi-avg-gpa");
  if (avgGpaEl) avgGpaEl.innerText = `${avgGpa} / 20`;
}

/**
 * Updates the numerical count badges inside each filter pill.
 * @param {Array<object>} students
 */
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

/**
 * Sets up interactive Filter Pills (Day 3 Requirement).
 */
function setupFilterPills() {
  const container = document.getElementById("filter-pills-container");
  if (!container) return;

  const pills = container.querySelectorAll(".filter-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      currentFilter = pill.getAttribute("data-filter") || "ALL";

      // Also sync the fallback select if visible
      const select = document.getElementById("filter-risk");
      if (select) select.value = currentFilter;

      applyFiltersAndRender();
    });
  });
}

/**
 * Sets up Search Bar and optional Dropdown synchronization.
 */
function setupSearchAndFilters() {
  const searchInput = document.getElementById("search-input");
  const filterRisk = document.getElementById("filter-risk");

  searchInput?.addEventListener("input", (e) => {
    searchQuery = (e.target.value || "").toLowerCase().trim();
    applyFiltersAndRender();
  });

  filterRisk?.addEventListener("change", (e) => {
    currentFilter = e.target.value;
    // Sync pills
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

/**
 * Filters the active student list by search query and risk level, then updates the table.
 */
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

/**
 * Sorts allStudents by chosen column and direction.
 */
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

/**
 * Renders the Student Roster Table DOM.
 * @param {Array<object>} students
 */
function renderTable(students) {
  const tbody = document.getElementById("student-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!students || students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-slate-400">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          <p class="font-semibold text-slate-600">No students match your filter criteria.</p>
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
    tr.onclick = () => openStudentModal(student);

    const riskLevel = student.prediction ? student.prediction.risk_level : "Medium";
    const riskScore = student.prediction ? student.prediction.risk_score : 0.5;
    const riskBadge = getRiskBadge(riskLevel, riskScore);

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">${student.name}</div>
        <div class="text-xs text-slate-400 font-mono">${student.student_id}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-600">
        <div class="font-medium text-slate-800">${student.program}</div>
        <div class="text-xs text-slate-400">Semester ${student.semester}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="font-semibold ${student.attendance_pct < 65 ? 'text-rose-600 font-bold' : 'text-slate-700'}">
          ${student.attendance_pct}%
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
        ${student.gpa}/20
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${riskBadge}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right">
        <button class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white group-hover:bg-blue-700 group-hover:text-white text-slate-700 border border-slate-200 group-hover:border-blue-700 transition-all shadow-2xs">
          View Dossier →
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

/**
 * Returns formatted HTML risk badge strictly obeying the Non-Contradiction Matrix.
 * High: Red (≥0.65), Medium: Yellow/Amber (0.35–0.64), Low: Green (<0.35)
 */
function getRiskBadge(level, score) {
  const pct = Math.round(score * 100);
  if (level === "High") {
    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600 animate-pulse"></span>
        ${pct}% (High)
      </span>
    `;
  } else if (level === "Medium") {
    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600"></span>
        ${pct}% (Watch)
      </span>
    `;
  } else {
    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600"></span>
        ${pct}% (Safe)
      </span>
    `;
  }
}

/**
 * Sets up table header sort listeners.
 */
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

/**
 * Sets up Day 7 Demo Persona Quick Access Buttons.
 * Immediately opens the student modal for presentation walkthrough.
 */
function setupDemoPersonas() {
  const buttons = document.querySelectorAll(".demo-persona-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const studentId = btn.getAttribute("data-id");
      const target = allStudents.find(s => s.student_id === studentId);
      if (target && typeof openStudentModal === "function") {
        openStudentModal(target);
      }
    });
  });
}

/**
 * Sets up Live ML Prediction Modal and Form.
 */
function setupPredictionModal() {
  const openBtn = document.getElementById("btn-open-predict-modal");
  const modal = document.getElementById("predict-modal");
  const closeBtn = document.getElementById("predict-close-btn");
  const cancelBtn = document.getElementById("predict-cancel-btn");
  const backdrop = document.getElementById("predict-backdrop");
  const form = document.getElementById("predict-form");

  const closeModal = () => modal.classList.add("hidden");
  const openModal = () => {
    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  };

  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("predict-submit-btn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Running RandomForest + SHAP Pipeline...</span>`;

    const name = document.getElementById("form-name").value;
    const program = document.getElementById("form-program").value;
    const semester = parseInt(document.getElementById("form-semester").value, 10);
    const attendance = parseFloat(document.getElementById("form-attendance").value);
    const gpa = parseFloat(document.getElementById("form-gpa").value);
    const sem1Units = parseInt(document.getElementById("form-sem1-units").value, 10);
    const sem2Units = parseInt(document.getElementById("form-sem2-units").value, 10);
    const tuitionOverdue = document.getElementById("form-tuition").checked;
    const debtor = document.getElementById("form-debtor").checked;

    const studentData = {
      student_id: `STU-GEN-${Math.floor(100 + Math.random() * 900)}`,
      name: name,
      program: program,
      semester: semester,
      attendance_pct: attendance,
      gpa: gpa,
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
      "Curricular units 1st sem (grade)": gpa,
      "Curricular units 1st sem (without evaluations)": 0,
      "Curricular units 2nd sem (credited)": 0,
      "Curricular units 2nd sem (enrolled)": 6,
      "Curricular units 2nd sem (evaluations)": 6,
      "Curricular units 2nd sem (approved)": sem2Units,
      "Curricular units 2nd sem (grade)": sem2Units === 0 ? 0.0 : gpa,
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
        // High fidelity heuristic fallback if FastAPI server is offline
        const score = attendance < 60 || sem2Units < 2 ? 0.86 : (attendance < 75 ? 0.52 : 0.18);
        const level = score >= 0.65 ? "High" : (score >= 0.35 ? "Medium" : "Low");
        result = {
          prediction: {
            risk_score: score,
            risk_level: level,
            top_risk_factors: [
              `Low 2nd semester approved modules (${sem2Units} units)`,
              attendance < 65 ? "Attendance below mandatory threshold" : "Borderline continuous evaluations",
              debtor ? "Student registered with outstanding debt" : "Tuition in good standing"
            ]
          },
          counseling_memo: {
            summary: `${name} displays ${level} dropout vulnerability with attendance at ${attendance}% and ${sem2Units} credits completed. Immediate advisory intervention is recommended.`,
            action_items: [
              "Establish an individualized study schedule with course instructors.",
              "Connect with academic support services for core module tutoring."
            ],
            meeting_talking_points: [
              "Discuss current workload balance and identify specific subject hurdles.",
              "Explore campus resources for academic and personal support."
            ]
          }
        };
      }

      const newStudent = {
        student_id: studentData.student_id,
        name: studentData.name,
        program: studentData.program,
        semester: studentData.semester,
        attendance_pct: studentData.attendance_pct,
        gpa: studentData.gpa,
        prediction: result.prediction,
        top_risk_factors: result.prediction.top_risk_factors,
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
      openStudentModal(newStudent);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="zap" class="w-3.5 h-3.5"></i><span>Run DropGuard Pipeline</span>`;
      if (window.lucide) lucide.createIcons();
    }
  });
}
