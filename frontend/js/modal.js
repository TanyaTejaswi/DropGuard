/**
 * DropGuard — Student Modal & Counseling Drawer (Member 3)
 * Controls the slide-over student deep-dive dossier, animated risk gauge,
 * SHAP factors, and GenAI counseling intervention memo.
 */

function openStudentModal(student) {
  const modal = document.getElementById("student-modal");
  if (!modal) return;
  
  // Header details
  document.getElementById("modal-student-name").innerText = student.name || "Student Profile";
  document.getElementById("modal-student-meta").innerText = `ID: ${student.student_id} | Program: ${student.program} (Semester ${student.semester})`;
  
  // Print header details
  const printName = document.getElementById("print-student-name");
  if (printName) printName.innerText = student.name;
  const printMeta = document.getElementById("print-student-meta");
  if (printMeta) printMeta.innerText = `Student ID: ${student.student_id} | Program: ${student.program} | Semester: ${student.semester} | Date: ${new Date().toLocaleDateString()}`;

  // Risk metrics & Animated Gauge
  const prediction = student.prediction || { risk_score: 0.5, risk_level: "Medium" };
  const score = prediction.risk_score || 0.0;
  const level = prediction.risk_level || "Medium";

  // Trigger animated radial gauge in charts.js
  if (typeof updateRadialRiskGauge === "function") {
    updateRadialRiskGauge(score, level);
  }

  const badge = document.getElementById("modal-risk-badge");
  if (badge) {
    badge.innerText = `${level} Risk Tier`;
    if (level === "High") {
      badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200";
    } else if (level === "Medium") {
      badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200";
    } else {
      badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200";
    }
  }
  
  document.getElementById("modal-attendance").innerText = `${student.attendance_pct}%`;
  document.getElementById("modal-gpa").innerText = `${student.gpa}/20`;

  // SHAP Factors
  const factorsContainer = document.getElementById("modal-factors-list");
  if (factorsContainer) {
    factorsContainer.innerHTML = formatSHAPFactors(student.top_risk_factors || []);
  }

  // Counseling Memo (Safely handling both meeting_talking_points and talking_points)
  const memo = student.counseling_memo || {};
  document.getElementById("modal-memo-summary").innerText = memo.summary || "No diagnostic summary available.";
  
  const actionsList = document.getElementById("modal-memo-actions");
  const actions = memo.action_items || [];
  if (actionsList) {
    actionsList.innerHTML = actions.length > 0 
      ? actions.map(item => `<li>${item}</li>`).join("")
      : `<li class="italic text-slate-400">Standard continuous progress monitoring.</li>`;
  }

  const promptsList = document.getElementById("modal-memo-prompts");
  const prompts = memo.meeting_talking_points || memo.talking_points || [];
  if (promptsList) {
    promptsList.innerHTML = prompts.length > 0
      ? prompts.map(prompt => `<li>${prompt}</li>`).join("")
      : `<li class="italic text-slate-400">Review overall academic well-being and satisfaction with course progression.</li>`;
  }

  // Show Modal
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeStudentModal() {
  const modal = document.getElementById("student-modal");
  if (modal) modal.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal-close-btn")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-dismiss-btn")?.addEventListener("click", closeStudentModal);
  
  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeStudentModal();
  });
});
