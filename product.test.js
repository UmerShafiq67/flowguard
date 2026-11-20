const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const core=fs.readFileSync("study-core.js","utf8");
const v61=fs.readFileSync("visual-v61.css","utf8");

assert.match(app,/function studyPack\(\)/);
assert.match(app,/studysprint-mark\.svg/);
assert.match(app,/function practiceStudyPack\(packId\)/);
assert.match(app,/function reviewStudyPack\(packId\)/);
assert.match(app,/studyPacks/);
assert.match(app,/packContext/);
assert.match(app,/sourcePackId/);
assert.match(app,/lastResult/);
assert.match(app,/source:"practice",sourcePackId:packId/);
assert.match(core,/Array\.isArray\(evidence\.attempts\)/);

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

assert.ok(index.includes("visual-v61.css?v=64"));
assert.doesNotMatch(index,/visual-v49\.css|visual-v50\.css|visual-v51\.css|visual-v52\.css|visual-v53\.css|visual-v54\.css|visual-v55\.css|visual-v56\.css/);
assert.ok(index.includes('theme-color" content="#11151b"'));
assert.doesNotMatch(index,/visual-v45\.js/);
assert.ok(sw.includes("studysprint-shell-v87-premium-v64"));
assert.ok(sw.includes("assets/study-hero.svg"));
assert.ok(sw.includes("assets/today-progress.svg"));
assert.ok(sw.includes("assets/plan-visual.svg"));
assert.ok(sw.includes("assets/subjects-visual.svg"));
assert.ok(sw.includes("assets/session-visual.svg"));
assert.ok(sw.includes("assets/practice-visual.svg"));
assert.ok(sw.includes("assets/tutor-visual.svg"));
assert.ok(sw.includes("assets/review-visual.svg"));
assert.ok(sw.includes("assets/progress-visual.svg"));
assert.ok(sw.includes("assets/focus-visual.svg"));
assert.ok(sw.includes("visual-v61.css?v=64"));
assert.doesNotMatch(sw,/visual-v49\.css|visual-v50\.css|visual-v51\.css|visual-v52\.css|visual-v53\.css|visual-v54\.css|visual-v55\.css|visual-v56\.css/);
assert.doesNotMatch(sw,/visual-v45\.js/);
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

assert.match(v61,/\.ss-shell/);
assert.match(v61,/\.today-visual-story/);
assert.match(v61,/\.ss-quick-actions/);
assert.match(v61,/\.mobile-nav/);
assert.match(v61,/\.hero-action:before/);
assert.match(v61,/max-width:760px/);
assert.match(v61,/prefers-reduced-motion:reduce/);
assert.match(app,/toggleTheme/);
assert.match(app,/applyTheme\(currentTheme\(\)/);
assert.match(app,/function openTutorSearch\(\)/);
assert.match(app,/function showNotifications\(\)/);
assert.match(app,/ss-goal-banner/);
assert.match(app,/ss-quick-actions/);

console.log("StudySprint visual integration tests: PASS");

assert.ok(sw.includes("assets/plan-detail.svg"));
assert.ok(sw.includes("assets/subjects-detail.svg"));
assert.ok(sw.includes("assets/session-detail.svg"));
assert.ok(sw.includes("assets/practice-detail.svg"));
assert.ok(sw.includes("assets/tutor-detail.svg"));
assert.ok(sw.includes("assets/review-detail.svg"));
assert.ok(sw.includes("assets/progress-detail.svg"));
assert.ok(sw.includes("assets/focus-detail.svg"));
assert.ok(sw.includes("assets/account-visual.svg"));
assert.ok(sw.includes("assets/account-detail.svg"));