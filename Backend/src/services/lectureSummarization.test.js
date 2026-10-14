const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const {
  SummarizationError,
  summarizeLectureDescription,
} = require("./lectureSummarization");

const originalApiKey = process.env.OPENAI_API_KEY;
const originalFetch = global.fetch;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }
  global.fetch = originalFetch;
});

test("rejects missing lecture text without calling the provider", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => {
    assert.fail("The provider must not be called for empty lecture text");
  };

  await assert.rejects(
    summarizeLectureDescription({ title: "Lecture", description: "  " }),
    (error) => error instanceof SummarizationError && error.statusCode === 422
  );
});

test("rejects descriptions above the request size limit", async () => {
  process.env.OPENAI_API_KEY = "test-key";

  await assert.rejects(
    summarizeLectureDescription({
      title: "Lecture",
      description: "x".repeat(20001),
    }),
    (error) => error instanceof SummarizationError && error.statusCode === 413
  );
});

test("requires server-side OpenAI configuration", async () => {
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    summarizeLectureDescription({ title: "Lecture", description: "Lecture notes." }),
    (error) => error instanceof SummarizationError && error.statusCode === 503
  );
});

test("returns provider summary text and sends the key only in the authorization header", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    assert.equal(options.headers["Content-Type"], "application/json");
    const request = JSON.parse(options.body);
    assert.equal(request.model, "gpt-4.1-mini");
    assert.match(request.input, /Lecture notes/);
    assert.doesNotMatch(request.input, /test-key/);
    assert.equal(request.max_output_tokens, 600);

    return {
      ok: true,
      json: async () => ({ output_text: "A concise study summary." }),
    };
  };

  const summary = await summarizeLectureDescription({
    title: "Lecture",
    description: "Lecture notes",
  });

  assert.equal(summary, "A concise study summary.");
});

test("does not expose provider error details", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: { message: "sensitive provider detail" } }),
  });

  await assert.rejects(
    summarizeLectureDescription({ title: "Lecture", description: "Lecture notes." }),
    (error) =>
      error instanceof SummarizationError &&
      error.statusCode === 502 &&
      !error.message.includes("sensitive provider detail")
  );
});

test("maps request timeouts to a retryable response", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => {
    const error = new Error("timed out");
    error.name = "TimeoutError";
    throw error;
  };

  await assert.rejects(
    summarizeLectureDescription({ title: "Lecture", description: "Lecture notes." }),
    (error) => error instanceof SummarizationError && error.statusCode === 504
  );
});

test("rejects a malformed provider response", async () => {
  process.env.OPENAI_API_KEY = "test-key";
  global.fetch = async () => ({
    ok: true,
    json: async () => null,
  });

  await assert.rejects(
    summarizeLectureDescription({ title: "Lecture", description: "Lecture notes." }),
    (error) => error instanceof SummarizationError && error.statusCode === 502
  );
});
