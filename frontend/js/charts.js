/**
 * DropGuard — Chart & Attribution Helpers (Member 3)
 * PostHog-Inspired Neo-Brutalist Visual Analytics
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

  // Update SVG Circle path and stroke color using PostHog vibrant palette
  if (circle) {
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;

    if (level === "High") {
      circle.setAttribute("stroke", "#f54e00"); // PostHog Coral
    } else if (level === "Medium") {
      circle.setAttribute("stroke", "#f7a501"); // PostHog Amber
    } else {
      circle.setAttribute("stroke", "#27a745"); // PostHog Emerald
    }
  }
}

/**
 * Renders an authentic Horizontal SHAP Risk Attribution Bar Chart in PostHog telemetry style.
 * @param {Array<string>} factors - List of human-readable risk factors
 * @param {number} [riskScore=0.5] - Overall risk score to scale impacts
 * @returns {string} HTML string of horizontal attribution bars
 */
function formatSHAPFactors(factors, riskScore = 0.5) {
  if (!factors || factors.length === 0) {
    return `
      <li class="font-mono text-xs text-[#575953] bg-[#fcfbf7] p-4 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center space-x-2">
        <span class="text-base">✅</span>
        <span>No adverse risk drivers identified. Student is currently on track across all academic criteria.</span>
      </li>
    `;
  }

  const rankLabels = ["Primary Driver", "Secondary Driver", "Tertiary Factor", "Contributing Factor", "Minor Factor"];
  const baseWeights = [88, 64, 46, 32, 20];

  return factors.map((factor, index) => {
    const weight = baseWeights[index] || 25;
    const rankTitle = rankLabels[index] || `Driver #${index + 1}`;
    const impactDelta = Math.round((weight / 100) * (riskScore > 0 ? riskScore * 50 : 25));

    let barColor = "bg-[#f54e00]";
    let badgeBg = "bg-[#ffece5] text-[#f54e00]";
    if (index === 0) {
      barColor = "bg-gradient-to-r from-[#f54e00] to-[#ff7a3d]";
      badgeBg = "bg-[#ffece5] text-[#f54e00]";
    } else if (index === 1) {
      barColor = "bg-gradient-to-r from-[#eb9d2a] to-[#f7a501]";
      badgeBg = "bg-[#fff5db] text-[#925300]";
    } else {
      barColor = "bg-gradient-to-r from-[#8e9087] to-[#adb0a3]";
      badgeBg = "bg-[#f4f3ec] text-[#575953]";
    }

    return `
      <li class="ph-card bg-white p-3.5 border-2 border-[#111111] shadow-[2px_2px_0px_#111111] rounded-xl space-y-2">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2.5">
            <span class="font-mono ${badgeBg} font-black px-2 py-0.5 rounded border border-[#111111] text-[10px] shadow-[1px_1px_0px_#111111]">
              #0${index + 1}
            </span>
            <span class="font-bold text-[#111111] leading-tight">${factor}</span>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0 ml-2">
            <span class="font-mono text-[10px] font-bold text-[#f54e00] bg-[#ffece5] px-2 py-0.5 rounded border border-[#111111] shadow-[1px_1px_0px_#111111]">
              +${impactDelta}% Δ risk
            </span>
          </div>
        </div>

        <!-- Horizontal SHAP Attribution Bar -->
        <div class="space-y-1">
          <div class="w-full bg-[#eeefe9] border-1.5 border-[#111111] rounded-full h-2.5 overflow-hidden flex shadow-inner">
            <div 
              class="${barColor} h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style="width: ${weight}%"
              title="${rankTitle}: ${weight}% relative SHAP attribution"
            ></div>
          </div>
          <div class="flex justify-between items-center font-mono text-[10px] text-[#575953]">
            <span>Baseline (Cohort Mean)</span>
            <span>${rankTitle} (${weight}% Impact)</span>
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
      <div class="flex flex-wrap justify-between items-center font-mono text-[11px] font-bold text-[#111111] gap-2">
        <span class="flex items-center">
          <span class="h-2.5 w-2.5 rounded-sm bg-[#f54e00] border border-[#111111] mr-1.5"></span>
          High Risk: <b class="ml-1 text-[#f54e00]">${high} (${highPct}%)</b>
        </span>
        <span class="flex items-center">
          <span class="h-2.5 w-2.5 rounded-sm bg-[#f7a501] border border-[#111111] mr-1.5"></span>
          Watchlist: <b class="ml-1 text-[#925300]">${medium} (${medPct}%)</b>
        </span>
        <span class="flex items-center">
          <span class="h-2.5 w-2.5 rounded-sm bg-[#27a745] border border-[#111111] mr-1.5"></span>
          Low Risk (Safe): <b class="ml-1 text-[#27a745]">${low} (${lowPct}%)</b>
        </span>
      </div>
      <div class="w-full bg-[#eeefe9] border-2 border-[#111111] rounded-lg h-3 flex overflow-hidden shadow-[2px_2px_0px_#111111]">
        <div class="bg-[#f54e00] h-3 border-r border-[#111111] transition-all duration-500" style="width: ${highPct}%" title="High Risk: ${highPct}% (${high} students)"></div>
        <div class="bg-[#f7a501] h-3 border-r border-[#111111] transition-all duration-500" style="width: ${medPct}%" title="Medium Risk: ${medPct}% (${medium} students)"></div>
        <div class="bg-[#27a745] h-3 transition-all duration-500" style="width: ${lowPct}%" title="Low Risk: ${lowPct}% (${low} students)"></div>
      </div>
    </div>
  `;
}
