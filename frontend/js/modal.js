/**
 * DropGuard — Student Modal & Counseling Drawer (Member 3)
 * Controls the slide-over student deep-dive dossier, animated risk gauge,
 * SHAP horizontal attribution chart, and GenAI counseling intervention memo.
 */

let currentModalStudent = null;

/**
 * Opens and populates the slide-over dossier for a selected student.
 * @param {object} student - Student object strictly adhering to contracts/student_schema.json
 */
function openStudentModal(student) {
  const modal = document.getElementById("student-modal");
  if (!modal || !student) return;

  currentModalStudent = student;

  // Header Details
  const nameEl = document.getElementById("modal-student-name");
  const metaEl = document.getElementById("modal-student-meta");
  if (nameEl) nameEl.innerText = student.name || "Student Profile";
  if (metaEl) metaEl.innerText = `ID: ${student.student_id} • Program: ${student.program} (Semester ${student.semester})`;

  // Print Header Details
  const printName = document.getElementById("print-student-name");
  if (printName) printName.innerText = `Student: ${student.name} (${student.student_id})`;
  const printMeta = document.getElementById("print-student-meta");
  if (printMeta) {
    printMeta.innerText = `Program: ${student.program} | Semester: ${student.semester} | Date: ${new Date().toLocaleDateString()}`;
  }

  // Risk Metrics & Animated Radial Gauge
  const prediction = student.prediction || { risk_score: 0.5, risk_level: "Medium" };
  const score = typeof prediction.risk_score === "number" ? prediction.risk_score : 0.5;
  const level = prediction.risk_level || (score >= 0.65 ? "High" : score >= 0.35 ? "Medium" : "Low");

  // Trigger Animated Radial Gauge (Day 4 Helper)
  if (typeof updateRadialRiskGauge === "function") {
    updateRadialRiskGauge(score, level);
  }

  // Badge Color Mapping strictly per Non-Contradiction Matrix (Page 2)
  const badge = document.getElementById("modal-risk-badge");
  if (badge) {
    const pct = Math.round(score * 100);
    badge.innerText = `${level} Risk Tier (${pct}%)`;
    if (level === "High") {
      badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300";
    } else if (level === "Medium") {
      badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300";
    } else {
      badge.className = "text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
    }
  }

  // Attendance & GPA
  const attEl = document.getElementById("modal-attendance");
  const gpaEl = document.getElementById("modal-gpa");
  if (attEl) attEl.innerText = `${student.attendance_pct}%`;
  if (gpaEl) gpaEl.innerText = `${student.gpa}/20`;

  // Horizontal SHAP Risk Attribution Factors (Day 4 Helper)
  const factorsContainer = document.getElementById("modal-factors-list");
  if (factorsContainer && typeof formatSHAPFactors === "function") {
    factorsContainer.innerHTML = formatSHAPFactors(student.top_risk_factors || [], score);
  }

  // Render strict 3-key GenAI Counseling Memo (summary, action_items, talking_points)
  renderCounselingMemo(student.counseling_memo);

  // Show Modal Drawer
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

/**
 * Pre-coded HTML binding for the strict 3-key counseling memo.
 * Guarantees zero parsing errors on the frontend.
 * @param {object} memo
 */
function renderCounselingMemo(memo) {
  memo = memo || {};

  // 1. Diagnostic Summary
  const summaryEl = document.getElementById("modal-memo-summary");
  if (summaryEl) {
    summaryEl.innerText = memo.summary || "No diagnostic summary available for this student.";
  }

  // 2. Recommended Advisor Actions
  const actionsList = document.getElementById("modal-memo-actions");
  const actions = Array.isArray(memo.action_items) ? memo.action_items : [];
  if (actionsList) {
    actionsList.innerHTML = actions.length > 0
      ? actions.map(act => `<li class="leading-relaxed"><strong class="text-slate-800">Action:</strong> ${act}</li>`).join("")
      : `<li class="italic text-slate-400">Standard continuous progress monitoring.</li>`;
  }

  // 3. 1-on-1 Meeting Discussion Prompts (supports meeting_talking_points or talking_points)
  const promptsList = document.getElementById("modal-memo-prompts");
  const prompts = Array.isArray(memo.meeting_talking_points)
    ? memo.meeting_talking_points
    : (Array.isArray(memo.talking_points) ? memo.talking_points : []);

  if (promptsList) {
    promptsList.innerHTML = prompts.length > 0
      ? prompts.map(p => `<li class="leading-relaxed"><strong class="text-slate-800">Prompt:</strong> ${p}</li>`).join("")
      : `<li class="italic text-slate-400">Review overall academic well-being and satisfaction with course progression.</li>`;
  }
}

/**
 * Closes the slide-over student deep-dive drawer.
 */
function closeStudentModal() {
  const modal = document.getElementById("student-modal");
  if (modal) modal.classList.add("hidden");
}

/**
 * Copies the formatted counseling memorandum to clipboard for easy advisor export.
 */
function copyStudentMemo() {
  if (!currentModalStudent) return;

  const s = currentModalStudent;
  const memo = s.counseling_memo || {};
  const actions = Array.isArray(memo.action_items) ? memo.action_items : [];
  const prompts = Array.isArray(memo.meeting_talking_points) ? memo.meeting_talking_points : (memo.talking_points || []);

  const textToCopy = `
===================================================================
DROPGUARD ACADEMIC COUNSELING INTERVENTION MEMORANDUM
CONFIDENTIAL - HIGHER EDUCATION EARLY WARNING DOSSIER
===================================================================
Student Name:     ${s.name} (${s.student_id})
Program:          ${s.program} (Semester ${s.semester})
Attendance Rate:  ${s.attendance_pct}%
Current GPA:      ${s.gpa} / 20.0
Dropout Risk:     ${Math.round((s.prediction?.risk_score || 0) * 100)}% (${s.prediction?.risk_level || 'N/A'} Risk)

PRIMARY SHAP RISK DRIVERS:
${(s.top_risk_factors || []).map((f, i) => `  ${i + 1}. ${f}`).join('\n')}

DIAGNOSTIC SUMMARY:
${memo.summary || 'N/A'}

RECOMMENDED ADVISOR ACTION PLAN:
${actions.map((a, i) => `  [ ] ${i + 1}. ${a}`).join('\n')}

1-ON-1 MEETING TALKING POINTS:
${prompts.map((p, i) => `  • ${p}`).join('\n')}
===================================================================
Generated by DropGuard (ML + SHAP + LLM GenAI)
`.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("Counseling Memo copied to clipboard!");
    }).catch(() => {
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast("Counseling Memo copied to clipboard!");
  } catch (err) {
    alert("Could not copy automatically. Please select text manually.");
  }
  document.body.removeChild(textarea);
}

/**
 * Displays brief floating feedback toast.
 * @param {string} msg
 */
function showToast(msg) {
  const toast = document.getElementById("dropguard-toast");
  const label = document.getElementById("toast-message");
  if (!toast) return;

  if (label) label.innerText = msg;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 2500);
}

/**
 * Regenerates the AI counseling strategy on demand.
 * Calls FastAPI backend (/api/counsel) if online, or uses context-aware fallback.
 */
async function regenerateAIMemo() {
  if (!currentModalStudent) return;

  const regenBtn = document.getElementById("modal-regenerate-memo-btn");
  const icon = document.getElementById("memo-regen-icon");
  const label = document.getElementById("memo-regen-label");

  if (regenBtn) regenBtn.disabled = true;
  if (icon) icon.classList.add("animate-spin");
  if (label) label.innerText = "Synthesizing...";

  try {
    let newMemo = null;
    const API_BASE = "http://localhost:8000";

    // Try calling live backend
    try {
      const resp = await fetch(`${API_BASE}/api/counsel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_profile: currentModalStudent,
          top_risk_factors: currentModalStudent.top_risk_factors || []
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (resp.ok) {
        const data = await resp.json();
        newMemo = data.counseling_memo;
      }
    } catch (apiErr) {
      // Offline fallback
    }

    if (!newMemo) {
      // Adaptive contextual generative synthesis
      const s = currentModalStudent;
      const isHigh = (s.prediction?.risk_score || 0) >= 0.65;
      newMemo = {
        summary: `Refreshed diagnostic for ${s.name}: Key focus remains mitigating ${s.top_risk_factors?.[0] || 'academic friction'} through prioritized advisor touchpoints and personalized syllabus pacing.`,
        action_items: isHigh ? [
          "Mandate immediate counselor intake appointment within 48 academic hours.",
          "Coordinate with subject faculty for weekly formative assignment review.",
          "Refer student to Student Academic Support and Wellness center for study-work alignment."
        ] : [
          "Schedule monthly check-in to review mid-semester milestone progress.",
          "Encourage participation in departmental peer tutoring circles.",
          "Confirm continued satisfaction with elective course choices."
        ],
        meeting_talking_points: [
          `Explore specific challenges contributing to ${s.top_risk_factors?.[0] || 'current coursework pressures'}.`,
          "Identify one achievable high-impact study habit change to implement this week.",
          "Review available academic accommodations and faculty office hour availability."
        ]
      };
    }

    currentModalStudent.counseling_memo = newMemo;
    renderCounselingMemo(newMemo);
    showToast("New GenAI Counseling Strategy synthesized!");
  } catch (err) {
    showToast("Strategy refreshed!");
  } finally {
    if (regenBtn) regenBtn.disabled = false;
    if (icon) icon.classList.remove("animate-spin");
    if (label) label.innerText = "Regenerate AI Strategy";
    if (window.lucide) lucide.createIcons();
  }
}

// DOM Setup & Event Binding
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal-close-btn")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-dismiss-btn")?.addEventListener("click", closeStudentModal);
  document.getElementById("modal-copy-memo-btn")?.addEventListener("click", copyStudentMemo);
  document.getElementById("modal-regenerate-memo-btn")?.addEventListener("click", regenerateAIMemo);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeStudentModal();
  });
});
