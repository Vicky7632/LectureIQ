const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const liveRecordingUpload = require("./liveRecordingUpload");

const createMultipartRequest = () => {
  const boundary = "lectureiq-test-boundary";
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="recording"; filename="recording.webm"',
    "Content-Type: video/webm",
    "",
    "test video bytes",
    `--${boundary}--`,
    "",
  ].join("\r\n");
  const req = new PassThrough();

  req.method = "PATCH";
  req.url = "/lecture-123/end";
  req.originalUrl = req.url;
  req.params = { lectureId: "lecture-123" };
  req.headers = {
    "content-type": `multipart/form-data; boundary=${boundary}`,
    "content-length": Buffer.byteLength(body),
  };

  return { req, body };
};

const createResponse = (onJson) => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    onJson?.();
    return this;
  },
});

const consumeUploadedFile = (file) =>
  new Promise((resolve, reject) => {
    file.stream.on("error", reject);
    file.stream.on("end", resolve);
    file.stream.resume();
  });

test("configures asynchronous eager processing while retaining the source upload", () => {
  const options = liveRecordingUpload.getUploadParams({
    params: { lectureId: "lecture-123" },
  });

  assert.equal(options.folder, "lectureiq/live_recordings");
  assert.equal(options.resource_type, "video");
  assert.match(options.public_id, /^live_lecture-123_\d+$/);
  assert.equal(options.eager_async, true);
  assert.equal(options.eager, undefined);
  assert.equal(options.transformation, undefined);
});

test("attaches the original Cloudinary URL and public ID after upload succeeds", async () => {
  const originalUpload = CloudinaryStorage.prototype.upload;
  let receivedOptions;
  CloudinaryStorage.prototype.upload = async function (options, file) {
    receivedOptions = options;
    await consumeUploadedFile(file);
    return {
      secure_url: "https://res.cloudinary.com/example/video/upload/source.webm",
      public_id: "lectureiq/live_recordings/live_lecture-123",
      bytes: 16,
    };
  };

  const { req, body } = createMultipartRequest();
  const res = createResponse();
  let nextCalled = false;

  try {
    const completed = new Promise((resolve, reject) => {
      liveRecordingUpload(req, res, (error) => {
        if (error) reject(error);
        else {
          nextCalled = true;
          resolve();
        }
      });
    });
    req.end(body);
    await completed;
  } finally {
    CloudinaryStorage.prototype.upload = originalUpload;
  }

  assert.equal(receivedOptions.eager_async, true);
  assert.equal(req.liveRecording.videoUrl, "https://res.cloudinary.com/example/video/upload/source.webm");
  assert.equal(req.liveRecording.cloudinaryPublicId, "lectureiq/live_recordings/live_lecture-123");
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test("returns a Cloudinary upload error without passing the request to session ending", async () => {
  const originalUpload = CloudinaryStorage.prototype.upload;
  const cloudinaryError = Object.assign(
    new Error("Video is too large to process synchronously"),
    { http_code: 400 }
  );
  CloudinaryStorage.prototype.upload = async (_options, file) => {
    await consumeUploadedFile(file);
    throw cloudinaryError;
  };

  const originalConsoleError = console.error;
  console.error = () => {};
  const { req, body } = createMultipartRequest();
  let resolveResponse;
  const responseSent = new Promise((resolve) => {
    resolveResponse = resolve;
  });
  const res = createResponse(resolveResponse);
  let nextCalled = false;

  try {
    const completed = new Promise((resolve) => {
      liveRecordingUpload(req, res, () => {
        nextCalled = true;
        resolve();
      });
    });
    req.end(body);
    await Promise.race([responseSent, completed]);
  } finally {
    CloudinaryStorage.prototype.upload = originalUpload;
    console.error = originalConsoleError;
  }

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, cloudinaryError.message);
  assert.equal(nextCalled, false);
  assert.equal(req.liveRecording, undefined);
});
