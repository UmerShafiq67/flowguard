const FlowGuardCore = (() => {
  const clamp = (n,min=0,max=100) => Math.max(min, Math.min(max, n));
  const stableStringify = value => {
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
    if (value && typeof value === "object") return "{" + Object.keys(value).sort().map(k => JSON.stringify(k)+":"+stableStringify(value[k])).join(",") + "}";
    return JSON.stringify(value);
  };
  const hash = input => {
    let h = 2166136261;
    for (const ch of input) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  };
  const baselineHash = workflow => hash(stableStringify(workflow.definition || {}));
  const expectedIntervalMs = workflow => Math.max(60_000, Number(workflow.expectedIntervalMinutes || 1440) * 60_000);
  function checkCadence(workflow, now) {
    if (!workflow.active || !workflow.lastSuccessAt) return null;
    const age = now - new Date(workflow.lastSuccessAt).getTime();
    const limit = expectedIntervalMs(workflow) * Number(workflow.graceMultiplier || 1.5);
    return age > limit ? {type:"silent", severity: workflow.criticality === "critical" ? "critical" : "warning", ageMs:age, limitMs:limit} : null;
  }
  function checkZombie(workflow) {
    if (!workflow.active || !workflow.lastRun) return null;
    const run = workflow.lastRun;
    const zeroRate = Number(workflow.normalZeroOutputRate || 0);
    if (run.status === "success" && Number(run.outputCount || 0) === 0 && zeroRate < 0.25) {
      return {type:"zombie", severity: workflow.criticality === "critical" ? "critical" : "warning"};
    }
    return null;
  }
  function checkDrift(workflow) {
    if (!workflow.baselineHash) return null;
    const current = baselineHash(workflow);
    return current !== workflow.baselineHash ? {type:"drift", severity:"warning", currentHash:current, baselineHash:workflow.baselineHash} : null;
  }
  function evaluate(workflow, now=Date.now()) {
    const findings = [checkCadence(workflow, now), checkZombie(workflow), checkDrift(workflow)].filter(Boolean);
    const weights = {critical:40, warning:20, info:5};
    const penalty = findings.reduce((sum,f)=>sum+(weights[f.severity]||5),0);
    return {score:clamp(100-penalty), findings};
  }
  function priority(workflow, findings) {
    const impact = {critical:3, high:2, medium:1, low:0}[workflow.criticality || "medium"];
    const max = findings.reduce((m,f)=>Math.max(m, {critical:3,warning:2,info:1}[f.severity]||0),0);
    return ["low","medium","high","urgent"][clamp(impact+max-1,0,3)];
  }
  return {baselineHash,checkCadence,checkZombie,checkDrift,evaluate,priority,stableStringify};
})();
if (typeof module !== "undefined") module.exports = FlowGuardCore;