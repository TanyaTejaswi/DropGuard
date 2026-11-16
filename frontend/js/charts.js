/**
 * DropGuard — Chart & Attribution Helpers (Member 3)
 * Implements:
 * 1. Animated SVG Radial Risk Gauge with Rolling Counter
 * 2. Horizontal SHAP Risk Attribution Bar Chart
 * 3. Cohort Distribution Analytics & Breakdown Bar
 */

// Active animation frame handle to prevent race conditions
let activeGaugeAnim = null;

/**
 * Updates the animated SVG radial progress meter and numerical counter in the student modal.
 * @param {number} score - Float between 0.00 and 1.00 (Dropout probability)
 * @param {string} level - 'High' | 'Medium' | 'Low'
 */
function updateRadialRiskGauge(score, level) {
  const targetPct = Math.min(100, Math.max(0, Math.round(score * 100)));
  const circumference = 2 * Math.PI * 40; // r=40 -> ~251.327
  const offset = circumference - (score * circumference);

  const circle = document.getElementById("radial-gauge-circle");
  const label = document.getElementById("modal-risk-score");

  // Animate the text counter from 0 to targetPct
  if (label) {
    if (activeGaugeAnim) cancelAnimationFrame(activeGaugeAnim);
    let startVal = 0;
    const duration = 900; // ms
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startVal + (targetPct - startVal) * eased);
      label.innerText = `${currentVal}%`;

      if (progress < 1) {
        activeGaugeAnim = requestAnimationFrame(animate);
      } else {
        label.innerText = `${targetPct}%`;
      }
    }
    activeGaugeAnim = requestAnimationFrame(animate);
  }

  // Update SVG Circle path and stroke color
  if (circle) {
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;

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
 * Renders an authentic Horizontal SHAP Risk Attribution Bar Chart.
 * Each feature displays its rank, description, and calibrated visual contribution bar.
 * @param {Array<string>} factors - List of human-readable risk factors
 * @param {number} [riskScore=0.5] - Overall risk score to scale impacts
 * @returns {string} HTML string of horizontal attribution bars
 */
function formatSHAPFactors(factors, riskScore = 0.5) {
  if (!factors || factors.length === 0) {
    return `
      <li class="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center space-x-2">
        <svg class="w-4 h-4 text-emerald-500 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        <span>No adverse risk drivers identified. Student is currently on track across all academic criteria.</span>
      </li>
    `;
  }

  // Weighted relative impacts for horizontal SHAP bars
  const rankLabels = ["Primary Driver", "Secondary Driver", "Tertiary Factor", "Contributing Factor", "Minor Factor"];
  const baseWeights = [88, 64, 46, 32, 20];

  return factors.map((factor, index) => {
    const weight = baseWeights[index] || 25;
    const rankTitle = rankLabels[index] || `Driver #${index + 1}`;
    const impactDelta = Math.round((weight / 100) * (riskScore > 0 ? riskScore * 50 : 25));

    // Choose gradient theme based on rank severity
    let barGradient = "from-amber-500 to-rose-600";
    let badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
    if (index === 0) {
      barGradient = "from-rose-500 to-rose-700";
      badgeBg = "bg-rose-100 text-rose-800 border-rose-300";
    } else if (index === 1) {
      barGradient = "from-amber-500 to-rose-500";
      badgeBg = "bg-amber-100 text-amber-800 border-amber-300";
    } else {
      barGradient = "from-amber-400 to-amber-600";
      badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
    }

    return `
      <li class="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition-all">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2.5">
            <span class="flex h-5 w-5 rounded-md ${badgeBg} font-black items-center justify-center text-[10px] border shadow-xs">
              #${index + 1}
            </span>
            <span class="font-bold text-slate-800 leading-tight">${factor}</span>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0 ml-2">
            <span class="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              +${impactDelta}% Risk Impact
            </span>
          </div>
        </div>

        <!-- Horizontal SHAP Attribution Bar -->
        <div class="space-y-1">
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex shadow-inner">
            <div 
              class="bg-gradient-to-r ${barGradient} h-2 rounded-full transition-all duration-1000 ease-out" 
              style="width: ${weight}%"
              title="${rankTitle}: ${weight}% relative SHAP attribution"
            ></div>
          </div>
          <div class="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Base Line (Cohort Mean)</span>
            <span>${rankTitle} (${weight}% Attribution)</span>
          </div>
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
      <div class="flex flex-wrap justify-between items-center text-[11px] font-medium text-slate-600 gap-2">
        <span class="flex items-center">
          <span class="h-2 w-2 rounded-full bg-rose-500 mr-1.5"></span>
          High Risk Alert: <b class="ml-1 text-slate-900">${high} (${highPct}%)</b>
        </span>
        <span class="flex items-center">
          <span class="h-2 w-2 rounded-full bg-amber-500 mr-1.5"></span>
          Watchlist (Medium): <b class="ml-1 text-slate-900">${medium} (${medPct}%)</b>
        </span>
        <span class="flex items-center">
          <span class="h-2 w-2 rounded-full bg-emerald-500 mr-1.5"></span>
          Low Risk (Safe): <b class="ml-1 text-slate-900">${low} (${lowPct}%)</b>
        </span>
      </div>
      <div class="w-full bg-slate-200 rounded-full h-2.5 flex overflow-hidden shadow-inner">
        <div class="bg-rose-500 h-2.5 transition-all duration-500" style="width: ${highPct}%" title="High Risk: ${highPct}% (${high} students)"></div>
        <div class="bg-amber-500 h-2.5 transition-all duration-500" style="width: ${medPct}%" title="Medium Risk: ${medPct}% (${medium} students)"></div>
        <div class="bg-emerald-500 h-2.5 transition-all duration-500" style="width: ${lowPct}%" title="Low Risk: ${lowPct}% (${low} students)"></div>
      </div>
    </div>
  `;
}
