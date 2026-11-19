const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const core=fs.readFileSync("study-core.js","utf8");
const v52=fs.readFileSync("visual-v52.css","utf8");

assert.match(app,/function studyPack\(\)/);
assert.match(app,/function practiceStudyPack\(packId\)/);
assert.match(app,/function reviewStudyPack\(packId\)/);
assert.match(app,/studyPacks/);
assert.match(app,/packContext/);
assert.match(app,/sourcePackId/);
assert.match(app,/lastResult/);
assert.match(app,/source:"practice",sourcePackId:packId/);
assert.match(core,/Array\.isArray\(evidence\.evidence\)/);

console.log("StudySprint product integration tests: PASS");

assert.match(app,/function accountPage\(\)/);
assert.match(app,/state\.view==="account"\?accountPage\(\)/);
assert.match(app,/if\(state\.practice\.packId\)return base/);
assert.match(app,/source:"tutor-quiz",sourcePackId:packId/);
assert.match(app,/kind:"evidence-review"/);
assert.match(app,/pack.reviewDate=today\(\)/);
assert.match(app,/const preserved=oldPlan\.filter/);

assert.doesNotMatch(app,/“/);
assert.doesNotMatch(app,/— James Clear/);
assert.doesNotMatch(app,/— Helen Hayes/);

assert.ok(index.includes("visual-v49.css?v=49"));
assert.ok(index.includes("visual-v50.css?v=50"));
assert.ok(index.includes("visual-v51.css?v=51"));
assert.ok(index.includes("visual-v52.css?v=52"));
assert.ok(index.includes('theme-color" content="#ffffff"'));
assert.ok(index.includes("visual-v45.js?v=49"));
assert.ok(sw.includes("studysprint-shell-v72-v52"));
assert.ok(sw.includes("visual-v52.css?v=52"));
assert.ok(sw.includes("visual-v51.css?v=51"));
assert.ok(sw.includes("visual-v49.css?v=49"));
assert.ok(sw.includes("visual-v45.js?v=49"));
assert.doesNotMatch(index,/visual-v34\.js/);
assert.doesNotMatch(index,/visual-v41\.js/);
assert.doesNotMatch(index,/visual-v43\.js/);
assert.doesNotMatch(index,/visual-v44\.js/);
assert.doesNotMatch(index,/design-v2\.js/);
assert.doesNotMatch(index,/design-v3\.js/);
assert.doesNotMatch(index,/visual-upgrade\.js/);
assert.doesNotMatch(index,/design-v2\.css/);
assert.doesNotMatch(index,/design-v3\.css/);
assert.doesNotMatch(index,/visual-upgrade\.css/);
assert.ok(app.includes("adaptive-learning-system.svg"));
assert.match(app,/class="landing49"/);
assert.match(app,/Know what to do next/);
assert.doesNotMatch(app,/class="landing45"/);

assert.match(v52,/--ss52-white:#fff/);
assert.match(v52,/--ss52-blue:#2463eb/);
assert.match(v52,/--ss52-cyan:#13b8c7/);
assert.match(v52,/--ss52-violet:#7056d9/);
assert.match(v52,/html,body,#app,.app-main\{background:#fff!important/);
assert.match(v52,/\.appbar\{[\s\S]*background:rgba\(255,255,255/);
assert.match(v52,/\.landing49\{[\s\S]*#fff!important/);
assert.match(v52,/prefers-reduced-motion:reduce/);

console.log("StudySprint visual integration tests: PASS");
