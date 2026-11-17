const assert=require("node:assert/strict");
const fs=require("node:fs");

const app=fs.readFileSync("app.js","utf8");
const index=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");

assert.match(app,/function studyPack\(\)/);
assert.match(app,/function practiceStudyPack\(packId\)/);
assert.match(app,/function reviewStudyPack\(packId\)/);
assert.match(app,/studyPacks/);
assert.match(app,/packContext/);
assert.match(app,/sourcePackId/);
assert.match(index,/visual-v35\.css\?v=36/);
assert.match(index,/visual-v35\.js\?v=36/);
assert.match(index,/visual-v36\.css\?v=36/);
assert.match(index,/visual-v36\.js\?v=36/);
assert.match(index,/visual-v37\.css\?v=37/);
assert.match(index,/visual-v37\.js\?v=37/);
assert.match(sw,/studysprint-shell-v58-v38/);
assert.match(sw,/visual-v35\.css\?v=36/);
assert.match(sw,/visual-v35\.js\?v=36/);
assert.match(sw,/visual-v36\.css\?v=36/);
assert.match(sw,/visual-v36\.js\?v=36/);
assert.match(sw,/visual-v37\.css\?v=37/);
assert.match(sw,/visual-v37\.js\?v=37/);

console.log("StudySprint product integration tests: PASS");
