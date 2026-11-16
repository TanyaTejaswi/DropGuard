/**
 * DropGuard — Chart & Attribution Helpers (Member 3)
 * Implements:
 * 1. Animated SVG Radial Risk Gauge
 * 2. Horizontal SHAP Risk Attribution Bar Cards
 * 3. Cohort Distribution Analytics
 */

/**
 * Updates the animated SVG radial progress meter in the student modal.
 * @param {number} score - Float between 0.00 and 1.00
 * @param {string} level - 'High' | 'Medium' | 'Low'
 */
function updateRadialRiskGauge(score, level) {
  const pct = Math.round(score * 100);
  const circumference = 2 * Math.PI * 40; // r=40 -> ~251.3
  const offset = circumference - (score * circumference);

  const circle = document.getElementById("radial-gauge-circle");
  const label = document.getElementById("modal-risk-score");
  
  if (label) {
    label.innerText = `${pct}%`;
  }

  if (circle) {
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;

    // Color coordination based on risk severity
    if (level === "High") {
      circle.setAttribute("stroke", "#e11d48"); // Rose-600
    } else if (level === "Medium") {
      circle.setAttribute("stroke", "#d97706"); // Amber-600
    } else {
      circle.setAttribute("stroke", "#059669"); // Emerald-600
    }
  }
}

/**
 * Renders horizontal SHAP risk attribution cards with weighted impact indicators.
 * @param {Array<string>} factors - List of human-readable risk factors
 * @returns {string} HTML string
 */
function formatSHAPFactors(factors) {
  if (!factors || factors.length === 0) {
    return `<li class="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">No adverse risk drivers identified. Student is on track.</li>`;
  }

  const weights = [90, 72, 54, 38, 26];

  return factors.map((factor, index) => {
    const weight = weights[index] || 30;
    return `
      <li class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <span class="flex h-5 w-5 rounded-full bg-rose-50 text-rose-600 font-bold items-center justify-center text-[10px] border border-rose-200">#${index + 1}</span>
            <span class="font-semibold text-slate-800">${factor}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400 font-medium">Impact Rank ${index + 1}</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div class="bg-gradient-to-r from-amber-500 to-rose-600 h-1.5 rounded-full transition-all duration-700" style="width: ${weight}%"></div>
        </div>
      </li>
    `;
  }).join("");
}

/**
 * Renders the Visual Cohort Breakdown Bar across the top of the roster.
 * @param {Array<object>} students - Active student cohort
 */
function renderCohortBreakdownBar(students) {
  const container = document.getElementById("cohort-breakdown-container");
  if (!container || !students || students.length === 0) return;

  const total = students.length;
  const high = students.filter(s => s.prediction && s.prediction.risk_level === "High").length;
  const medium = students.filter(s => s.prediction && s.prediction.risk_level === "Medium").length;
  const low = students.filter(s => s.prediction && s.prediction.risk_level === "Low").length;

  const highPct = Math.round((high / total) * 100);
  const medPct = Math.round((medium / total) * 100);
  const lowPct = 100 - highPct - medPct;

  container.innerHTML = `
    <div class="space-y-1.5">
      <div class="flex justify-between text-[11px] font-medium text-slate-600">
        <span class="flex items-center"><span class="h-2 w-2 rounded-full bg-rose-500 mr-1.5"></span>High Risk: <b>${high} (${highPct}%)</b></span>
        <span class="flex items-center"><span class="h-2 w-2 rounded-full bg-amber-500 mr-1.5"></span>Watchlist: <b>${medium} (${medPct}%)</b></span>
        <span class="flex items-center"><span class="h-2 w-2 rounded-full bg-emerald-500 mr-1.5"></span>Low Risk: <b>${low} (${lowPct}%)</b></span>
      </div>
      <div class="w-full bg-slate-200 rounded-full h-2.5 flex overflow-hidden shadow-inner">
        <div class="bg-rose-500 h-2.5" style="width: ${highPct}%" title="High Risk: ${highPct}%"></div>
        <div class="bg-amber-500 h-2.5" style="width: ${medPct}%" title="Medium Risk: ${medPct}%"></div>
        <div class="bg-emerald-500 h-2.5" style="width: ${lowPct}%" title="Low Risk: ${lowPct}%"></div>
      </div>
    </div>
  `;
}
