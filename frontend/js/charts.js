/**
 * DropGuard — Chart Helpers (Member 3)
 */

function formatSHAPFactors(factors) {
  return factors.map(f => `
    <li class="flex items-start space-x-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
      <span class="text-rose-500 font-bold mt-0.5">•</span>
      <span>${f}</span>
    </li>
  `).join("");
}
