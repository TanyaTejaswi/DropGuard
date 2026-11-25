/**
 * DropGuard — Student Modal & Counseling Drawer (Member 3)
 * Linear-Inspired Slide-Over Dossier Controller
 */

let currentModalStudent = null;

/**
 * Opens and populates the slide-over dossier for a selected student.
 * @param {object} student - Student object strictly adhering to contracts/student_schema.json
 */
function openStudentModal(student) {
  const modal = document.getElementById("student-modal");
  if (!modal || !student) return;

  // Gated Authentication Check: Only logged-in advisors can inspect student dossiers & predictions
  if (typeof currentUser !== "undefined" && !currentUser) {
    if (typeof openAuthModal === "function") {
      openAuthModal(
        "signin",
        `Advisor sign-in required to inspect risk predictions and counseling dossiers for ${student.name}.`,
        { type: "open_student", student }
      );
    }
    return;
  }

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

  // Trigger Animated Radial Gauge
  if (typeof updateRadialRiskGauge === "function") {
    updateRadialRiskGauge(score, level);
  }

  // Linear Status Tag Badge Mapping
  const badge = document.getElementById("modal-risk-badge");
  if (badge) {
    const pct = Math.round(score * 100);
    badge.innerText = `${level} Risk Tier (${pct}%)`;
    if (level === "High") {
      badge.className = "linear-tag linear-tag-high";
    } else if (level === "Medium") {
      badge.className = "linear-tag linear-tag-medium";
    } else {
      badge.className = "linear-tag linear-tag-low";
    }
  }

  // Attendance & GPA & Backlogs
  const attEl = document.getElementById("modal-attendance");
  const gpaEl = document.getElementById("modal-gpa");
  if (attEl) attEl.innerText = `${student.attendance_pct}%`;
  if (gpaEl) gpaEl.innerText = `${student.gpa}/10`;

  const backlogsRow = document.getElementById("modal-backlogs-row");
  const backlogsEl = document.getElementById("modal-backlogs");
  if (backlogsRow && backlogsEl) {
    if (student.total_backlogs !== undefined) {
      backlogsRow.classList.remove("hidden");
      backlogsEl.innerText = `${student.total_backlogs} subjects`;
      if (student.total_backlogs > 0) {
        backlogsRow.className = "text-rose-600 font-semibold";
      } else {
        backlogsRow.className = "text-emerald-600 font-semibold";
        backlogsEl.innerText = "0 (Clear)";
      }
    } else {
      backlogsRow.classList.add("hidden");
    }
  }

  // Horizontal SHAP Risk Attribution Factors
  const factorsContainer = document.getElementById("modal-factors-list");
  if (factorsContainer && typeof formatSHAPFactors === "function") {
    factorsContainer.innerHTML = formatSHAPFactors(student.top_risk_factors || [], score);
  }

  // Render strict 3-key GenAI Counseling Memo
  renderCounselingMemo(student.counseling_memo);

  // Initialize Interactive "What-If" Academic Recovery Simulator
  initRecoverySimulator(student);

  // Show Modal Drawer
  modal.classList.remove("hidden");
  if (window.lucide) lucide.createIcons();
}

/**
 * Initializes and wires the Interactive "What-If" Academic Recovery Simulator.
 * Allows advisors to adjust attendance, passed credits, backlog clearance, and tuition status
 * to see live risk reduction on the animated radial gauge.
 * @param {object} student
 */
function initRecoverySimulator(student) {
  const attSlider = document.getElementById("sim-attendance-slider");
  const passedSlider = document.getElementById("sim-passed-slider");
  const backlogsSlider = document.getElementById("sim-backlogs-slider");
  const tuitionToggle = document.getElementById("sim-tuition-toggle");
  const resetBtn = document.getElementById("sim-reset-btn");

  if (!attSlider || !passedSlider || !backlogsSlider || !tuitionToggle) return;

  const baselineAttendance = Math.min(100, Math.max(40, parseFloat(student.attendance_pct || 75)));
  const baselinePrediction = student.prediction || { risk_score: 0.5, risk_level: "Medium" };
  const baselineScore = typeof baselinePrediction.risk_score === "number" ? baselinePrediction.risk_score : 0.5;
  const baselineLevel = baselinePrediction.risk_level || (baselineScore >= 0.65 ? "High" : baselineScore >= 0.35 ? "Medium" : "Low");

  let baselineBacklogs = 0;
  if (typeof student.total_backlogs === "number") {
    baselineBacklogs = student.total_backlogs;
  } else if (Array.isArray(student.top_risk_factors)) {
    const factorStr = student.top_risk_factors.join(" ").toLowerCase();
    if (factorStr.includes("failed") || factorStr.includes("backlog")) baselineBacklogs = 2;
  }

  let baselinePassed = 4;
  if (student.approved_units_by_sem && student.approved_units_by_sem[`Sem ${student.semester}`] !== undefined) {
    baselinePassed = student.approved_units_by_sem[`Sem ${student.semester}`];
  } else if (baselineScore >= 0.70) {
    baselinePassed = 1;
  } else if (baselineScore >= 0.40) {
    baselinePassed = 4;
  } else {
    baselinePassed = 6;
  }

  const baselineTuitionPaid =
    student["Tuition fees up to date"] !== 0 &&
    !(student.top_risk_factors || []).some(f => f.toLowerCase().includes("tuition") || f.toLowerCase().includes("fee"));

  const applyBaseline = () => {
    attSlider.value = Math.round(baselineAttendance);
    passedSlider.value = Math.round(baselinePassed);
    backlogsSlider.max = Math.max(1, baselineBacklogs || 3);
    backlogsSlider.value = 0;
    tuitionToggle.checked = baselineTuitionPaid;
    recalculateSimulation(true);
  };

  const recalculateSimulation = (isReset = false) => {
    const currentAtt = parseFloat(attSlider.value);
    const currentPassed = parseInt(passedSlider.value, 10);
    const backlogsCleared = parseInt(backlogsSlider.value, 10);
    const tuitionPaid = tuitionToggle.checked;

    const attValEl = document.getElementById("sim-attendance-val");
    const attDeltaEl = document.getElementById("sim-attendance-delta");
    const passedValEl = document.getElementById("sim-passed-val");
    const passedDeltaEl = document.getElementById("sim-passed-delta");
    const backlogsValEl = document.getElementById("sim-backlogs-val");
    const backlogsDeltaEl = document.getElementById("sim-backlogs-delta");

    const attDelta = currentAtt - baselineAttendance;
    if (attValEl) attValEl.innerText = `${Math.round(currentAtt)}%`;
    if (attDeltaEl) {
      attDeltaEl.innerText = attDelta >= 0 ? `+${Math.round(attDelta)}% Improvement` : `${Math.round(attDelta)}% Decline`;
      attDeltaEl.className = attDelta >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold";
    }

    const passedDelta = currentPassed - baselinePassed;
    if (passedValEl) passedValEl.innerText = `${currentPassed} / 6 units`;
    if (passedDeltaEl) {
      passedDeltaEl.innerText = passedDelta >= 0 ? `+${passedDelta} more units cleared` : `${passedDelta} fewer units`;
      passedDeltaEl.className = passedDelta >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold";
    }

    if (backlogsValEl) backlogsValEl.innerText = `${backlogsCleared} cleared`;
    if (backlogsDeltaEl) {
      backlogsDeltaEl.innerText = backlogsCleared > 0 ? `-${backlogsCleared} backlogs resolved` : "0 backlogs cleared";
      backlogsDeltaEl.className = backlogsCleared > 0 ? "text-emerald-600 font-semibold" : "text-slate-400 font-semibold";
    }

    let simulatedScore = baselineScore;
    simulatedScore += attDelta * -0.007;
    simulatedScore += passedDelta * -0.09;
    simulatedScore += backlogsCleared * -0.08;

    if (!baselineTuitionPaid && tuitionPaid) {
      simulatedScore -= 0.16;
    } else if (baselineTuitionPaid && !tuitionPaid) {
      simulatedScore += 0.16;
    }

    simulatedScore = Math.max(0.05, Math.min(0.98, parseFloat(simulatedScore.toFixed(2))));
    const simLevel = simulatedScore >= 0.65 ? "High" : (simulatedScore >= 0.35 ? "Medium" : "Low");

    if (!isReset && typeof updateRadialRiskGauge === "function") {
      updateRadialRiskGauge(simulatedScore, simLevel);
    } else if (isReset && typeof updateRadialRiskGauge === "function") {
      updateRadialRiskGauge(baselineScore, baselineLevel);
    }

    const badge = document.getElementById("modal-risk-badge");
    if (badge) {
      const displayScore = isReset ? baselineScore : simulatedScore;
      const displayLevel = isReset ? baselineLevel : simLevel;
      const pct = Math.round(displayScore * 100);
      const isSimulated = !isReset && Math.abs(simulatedScore - baselineScore) > 0.01;
      badge.innerText = isSimulated ? `Simulated: ${displayLevel} Tier (${pct}%)` : `${displayLevel} Risk Tier (${pct}%)`;
      badge.className =
        displayLevel === "High"
          ? "linear-tag linear-tag-high"
          : displayLevel === "Medium"
          ? "linear-tag linear-tag-medium"
          : "linear-tag linear-tag-low";
    }

    const basePct = Math.round(baselineScore * 100);
    const projPct = isReset ? basePct : Math.round(simulatedScore * 100);
    const netDiff = basePct - projPct;

    const originalEl = document.getElementById("sim-original-pct");
    const projectedEl = document.getElementById("sim-projected-pct");
    const headlineEl = document.getElementById("sim-impact-headline");
    const deltaBadge = document.getElementById("sim-delta-badge");
    const impactDot = document.getElementById("sim-impact-dot");

    if (originalEl) originalEl.innerText = `${basePct}%`;
    if (projectedEl) {
      projectedEl.innerText = `${projPct}%`;
      projectedEl.className =
        simLevel === "Low" ? "text-emerald-600 font-bold" : simLevel === "Medium" ? "text-amber-600 font-bold" : "text-rose-600 font-bold";
    }

    if (deltaBadge) {
      if (netDiff > 0) {
        deltaBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0";
        deltaBadge.innerText = `-${netDiff}% Risk Reduction`;
        if (headlineEl) headlineEl.innerText = simLevel === "Low" ? "Projected Recovery: On Track to Graduate!" : "Projected Trajectory: Watchlist Stabilization";
        if (impactDot) impactDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0";
      } else if (netDiff < 0) {
        deltaBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0";
        deltaBadge.innerText = `+${Math.abs(netDiff)}% Risk Increase`;
        if (headlineEl) headlineEl.innerText = "Adverse Trajectory: Immediate Attrition Risk";
        if (impactDot) impactDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0";
      } else {
        deltaBadge.className = "px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0";
        deltaBadge.innerText = "Baseline State";
        if (headlineEl) headlineEl.innerText = `Current Baseline: ${baselineLevel} Risk Tier`;
        if (impactDot) impactDot.className = "w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0";
      }
    }
  };

  attSlider.oninput = () => recalculateSimulation(false);
  passedSlider.oninput = () => recalculateSimulation(false);
  backlogsSlider.oninput = () => recalculateSimulation(false);
  tuitionToggle.onchange = () => recalculateSimulation(false);
  if (resetBtn) {
    resetBtn.onclick = () => applyBaseline();
  }

  applyBaseline();
}

/**
 * Pre-coded HTML binding for the strict 3-key counseling memo.
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
      ? actions.map(act => `
        <li class="bg-white p-2.5 rounded-lg border border-indigo-100/80 shadow-2xs flex items-start space-x-2 text-xs">
          <span class="text-indigo-600 font-bold shrink-0">✓</span>
          <span class="text-slate-800 leading-relaxed font-medium">${act}</span>
        </li>
      `).join("")
      : `<li class="text-xs italic text-slate-400">Standard continuous progress monitoring.</li>`;
  }

  // 3. 1-on-1 Meeting Discussion Prompts
  const promptsList = document.getElementById("modal-memo-prompts");
  const prompts = Array.isArray(memo.meeting_talking_points)
    ? memo.meeting_talking_points
    : (Array.isArray(memo.talking_points) ? memo.talking_points : []);

  if (promptsList) {
    promptsList.innerHTML = prompts.length > 0
      ? prompts.map(p => `
        <li class="bg-white p-2.5 rounded-lg border border-indigo-100/80 shadow-2xs flex items-start space-x-2 text-xs">
          <span class="text-indigo-500 font-bold shrink-0">•</span>
          <span class="text-slate-800 leading-relaxed font-medium">${p}</span>
        </li>
      `).join("")
      : `<li class="text-xs italic text-slate-400">Review overall academic well-being and satisfaction with course progression.</li>`;
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
 * Copies the formatted counseling memorandum to clipboard.
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
Current CGPA:     ${s.gpa} / 10.0
Dropout Risk:     ${Math.round((s.prediction?.risk_score || 0) * 100)}% (${s.prediction?.risk_level || 'N/A'} Risk)

PRIMARY SHAP RISK DRIVERS:
${(s.top_risk_factors || []).map((f, i) => `  #0${i + 1}. ${f}`).join('\n')}

DIAGNOSTIC SUMMARY:
${memo.summary || 'N/A'}

RECOMMENDED ADVISOR ACTION PLAN:
${actions.map((a, i) => `  [✓] ${i + 1}. ${a}`).join('\n')}

1-ON-1 MEETING TALKING POINTS:
${prompts.map((p, i) => `  • ${p}`).join('\n')}
===================================================================
Generated by DropGuard Early Warning System (ML + SHAP + LLM GenAI)
`.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("Counseling Memo copied to clipboard");
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
    showToast("Counseling Memo copied to clipboard");
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
 */
async function regenerateAIMemo() {
  if (!currentModalStudent) return;

  if (typeof currentUser !== "undefined" && !currentUser) {
    if (typeof openAuthModal === "function") {
      openAuthModal("signin", "Advisor sign-in required to synthesize AI counseling strategies.", { type: "open_student", student: currentModalStudent });
    }
    return;
  }

  const regenBtn = document.getElementById("modal-regenerate-memo-btn");
  const icon = document.getElementById("memo-regen-icon");
  const label = document.getElementById("memo-regen-label");

  if (regenBtn) regenBtn.disabled = true;
  if (icon) icon.classList.add("animate-spin");
  if (label) label.innerText = "Synthesizing...";

  try {
    let newMemo = null;
    const API_BASE = "http://localhost:8000";

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
      const s = currentModalStudent;
      const isHigh = (s.prediction?.risk_score || 0) >= 0.65;
      newMemo = {
        summary: `Refreshed clinical diagnostic for ${s.name}: High-priority advisory intervention recommended to address ${s.top_risk_factors?.[0] || 'course friction'} via structured study pacing and bi-weekly milestone checks.`,
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
    showToast("New GenAI Counseling Strategy synthesized");
  } catch (err) {
    showToast("Strategy refreshed");
  } finally {
    if (regenBtn) regenBtn.disabled = false;
    if (icon) icon.classList.remove("animate-spin");
    if (label) label.innerText = "Regenerate AI";
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
});
