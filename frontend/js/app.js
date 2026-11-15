/**
 * DropGuard — Main Frontend Controller (Member 3)
 * Contract-compliant data ingestion and rendering
 */

let allStudents = [];

// Endpoint config: Switch to 'http://localhost:8000/api/students' during final integration
const DATA_SOURCE = "mock_students.json";

document.addEventListener("DOMContentLoaded", () => {
  fetchStudentData();
  setupEventListeners();
});

async function fetchStudentData() {
  try {
    const response = await fetch(DATA_SOURCE);
    if (!response.ok) throw new Error("Network response was not ok");
    allStudents = await response.json();
    updateKPIs(allStudents);
    renderTable(allStudents);
  } catch (error) {
    console.error("Failed to fetch student data:", error);
  }
}

function updateKPIs(students) {
  document.getElementById("kpi-total").innerText = students.length;
  const highRisk = students.filter(s => s.prediction.risk_level === "High").length;
  const medRisk = students.filter(s => s.prediction.risk_level === "Medium").length;
  const avgGpa = (students.reduce((acc, s) => acc + s.gpa, 0) / students.length).toFixed(1);

  document.getElementById("kpi-high-risk").innerText = highRisk;
  document.getElementById("kpi-med-risk").innerText = medRisk;
  document.getElementById("kpi-avg-gpa").innerText = `${avgGpa}/20`;
}

function renderTable(students) {
  const tbody = document.getElementById("student-table-body");
  tbody.innerHTML = "";

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">No students match your query.</td></tr>`;
    return;
  }

  students.forEach(student => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition-colors cursor-pointer";
    tr.onclick = () => openStudentModal(student);

    const riskBadge = getRiskBadge(student.prediction.risk_level, student.prediction.risk_score);

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-bold text-slate-900">${student.name}</div>
        <div class="text-xs text-slate-400 font-mono">${student.student_id}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-600">
        <div>${student.program}</div>
        <div class="text-xs text-slate-400">Sem ${student.semester}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="font-semibold ${student.attendance_pct < 65 ? 'text-rose-600' : 'text-slate-700'}">${student.attendance_pct}%</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-700">${student.gpa}/20</td>
      <td class="px-6 py-4 whitespace-nowrap">${riskBadge}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right">
        <button class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
          View Dossier
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
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
      <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-600"></span>${pct}% (High)
    </span>`;
  } else if (level === "Medium") {
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
      <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600"></span>${pct}% (Watch)
    </span>`;
  } else {
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
      <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-600"></span>${pct}% (Safe)
    </span>`;
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById("search-input");
  const filterRisk = document.getElementById("filter-risk");

  const filterHandler = () => {
    const query = searchInput.value.toLowerCase();
    const risk = filterRisk.value;

    const filtered = allStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(query) || s.student_id.toLowerCase().includes(query);
      const matchesRisk = risk === "ALL" || s.prediction.risk_level === risk;
      return matchesSearch && matchesRisk;
    });
    renderTable(filtered);
  };

  searchInput.addEventListener("input", filterHandler);
  filterRisk.addEventListener("change", filterHandler);
}
