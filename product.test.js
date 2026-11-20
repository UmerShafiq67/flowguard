const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const core=fs.readFileSync("study-core.js","utf8");
const v59=fs.readFileSync("visual-v59.css","utf8");

assert.match(app,/function studyPack\(\)/);
assert.match(app,/studysprint-mark\.svg/);
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

assert.ok(index.includes("visual-v59.css?v=59"));
assert.doesNotMatch(index,/visual-v49\.css|visual-v50\.css|visual-v51\.css|visual-v52\.css|visual-v53\.css|visual-v54\.css|visual-v55\.css|visual-v56\.css/);
assert.ok(index.includes('theme-color" content="#11151b"'));
assert.doesNotMatch(index,/visual-v45\.js/);
assert.ok(sw.includes("studysprint-shell-v80-v59"));
assert.ok(sw.includes("visual-v59.css?v=59"));
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

assert.match(v59,/\.ss-shell/);
assert.match(v59,/\.today-visual-story/);
assert.match(v59,/\.ss-quick-actions/);
assert.match(v59,/\.mobile-nav/);
assert.match(v59,/\.hero-action:after/);
assert.match(v59,/max-width:700px/);
assert.match(v59,/prefers-reduced-motion:reduce/);
assert.match(app,/toggleTheme/);
assert.match(app,/applyTheme\(currentTheme\(\)/);
assert.match(app,/function openTutorSearch\(\)/);
assert.match(app,/function showNotifications\(\)/);
assert.match(app,/ss-goal-banner/);
assert.match(app,/ss-quick-actions/);

console.log("StudySprint visual integration tests: PASS");
