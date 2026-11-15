/**
 * DropGuard — Student Modal & Counseling Drawer (Member 3)
 */

function openStudentModal(student) {
  const modal = document.getElementById("student-modal");
  
  // Header details
  document.getElementById("modal-student-name").innerText = student.name;
  document.getElementById("modal-student-meta").innerText = `ID: ${student.student_id} | Program: ${student.program} (Sem ${student.semester})`;
  
  // Risk metrics
  const pct = Math.round(student.prediction.risk_score * 100);
  document.getElementById("modal-risk-score").innerText = `${pct}%`;
  
  const badge = document.getElementById("modal-risk-badge");
  badge.innerText = `${student.prediction.risk_level} Risk`;
  if (student.prediction.risk_level === "High") {
    badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800";
  } else if (student.prediction.risk_level === "Medium") {
    badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800";
  } else {
    badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800";
  }
  
  document.getElementById("modal-attendance").innerText = `${student.attendance_pct}%`;
  document.getElementById("modal-gpa").innerText = `${student.gpa}/20`;

  // SHAP Factors
  const factorsContainer = document.getElementById("modal-factors-list");
  factorsContainer.innerHTML = formatSHAPFactors(student.top_risk_factors);

  // Counseling Memo
  const memo = student.counseling_memo;
  document.getElementById("modal-memo-summary").innerText = memo.summary;
  
  const actionsList = document.getElementById("modal-memo-actions");
  actionsList.innerHTML = memo.action_items.map(item => `<li>${item}</li>`).join("");

  const promptsList = document.getElementById("modal-memo-prompts");
  promptsList.innerHTML = memo.meeting_talking_points.map(prompt => `<li>${prompt}</li>`).join("");

  // Show Modal
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

function closeStudentModal() {
  document.getElementById("student-modal").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal-close-btn")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-dismiss-btn")?.addEventListener("click", closeStudentModal);
});
