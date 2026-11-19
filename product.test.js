const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const core=fs.readFileSync("study-core.js","utf8");

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


assert.ok(index.includes("visual-v45.css?v=44"));
assert.ok(index.includes("visual-v45.js?v=44"));
assert.ok(sw.includes("studysprint-shell-v65-v45"));
assert.ok(sw.includes("visual-v45.css?v=44"));
assert.ok(sw.includes("visual-v45.js?v=44"));
assert.doesNotMatch(index,/visual-v34\\.js/);
assert.doesNotMatch(index,/visual-v41\\.js/);
assert.doesNotMatch(index,/visual-v43\\.js/);
assert.doesNotMatch(index,/visual-v44\\.js/);
assert.doesNotMatch(index,/design-v2\\.js/);
assert.doesNotMatch(index,/design-v3\\.js/);
assert.doesNotMatch(index,/visual-upgrade\\.js/);
assert.doesNotMatch(index,/design-v2\\.css/);
assert.doesNotMatch(index,/design-v3\\.css/);
assert.doesNotMatch(index,/visual-upgrade\\.css/);
assert.ok(index.includes("visual-v45.css?v=45"));
assert.ok(index.includes("visual-v45.js?v=45"));
assert.doesNotMatch(app,/“/);
