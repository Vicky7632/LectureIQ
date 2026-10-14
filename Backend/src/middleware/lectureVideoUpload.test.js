const test = require("node:test");
const assert = require("node:assert/strict");
const lectureVideoUpload = require("./lectureVideoUpload");

test("uploads source lecture videos without synchronous format conversion", () => {
  const options = lectureVideoUpload.getUploadParams();

  assert.equal(options.folder, "lecture-videos");
  assert.equal(options.resource_type, "video");
  assert.match(options.public_id, /^lecture_\d+$/);
  assert.equal(options.format, undefined);
  assert.equal(options.transformation, undefined);
  assert.equal(options.eager, undefined);
});
