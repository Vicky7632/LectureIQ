const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const {
  SummarizationError,
  summarizeLectureDescription,
} = require("./lectureSummarization");

const originalApiKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
const originalConsoleError = console.error;

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalApiKey;
  }
  if (originalModel === undefined) {
    delete process.env.GEMINI_MODEL;
  } else {
    process.env.GEMINI_MODEL = originalModel;
  }
  console.error = originalConsoleError;
});

test("rejects missing lecture text without calling Gemini", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  const clientFactory = () => {
    assert.fail("Gemini must not be called for empty lecture text");
  };

  await assert.rejects(
    summarizeLectureDescription(
      { title: "Lecture", description: "  " },
      { clientFactory }
    ),
    (error) => error instanceof SummarizationError && error.statusCode === 422
  );
});

test("rejects descriptions above the request size limit", async () => {
  process.env.GEMINI_API_KEY = "test-key";

  await assert.rejects(
    summarizeLectureDescription({
      title: "Lecture",
      description: "x".repeat(20001),
    }),
    (error) => error instanceof SummarizationError && error.statusCode === 413
  );
});

test("requires the server-side Gemini API key", async () => {
  delete process.env.GEMINI_API_KEY;
  const clientFactory = () => {
    assert.fail("Gemini must not be called without an API key");
  };

  await assert.rejects(
    summarizeLectureDescription(
      { title: "Lecture", description: "Lecture notes." },
      { clientFactory }
    ),
    (error) => error instanceof SummarizationError && error.statusCode === 503
  );
});

test("returns Gemini summary text with the supported default model", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;

  let receivedRequest;
  let receivedApiKey;
  const clientFactory = (apiKey) => {
    receivedApiKey = apiKey;
    return {
      models: {
        generateContent: async (request) => {
          receivedRequest = request;
          return { text: "  A concise study summary.  " };
        },
      },
    };
  };

  const summary = await summarizeLectureDescription(
    { title: "Lecture", description: "Lecture notes" },
    { clientFactory }
  );

  assert.equal(summary, "A concise study summary.");
  assert.equal(receivedApiKey, "test-key");
  assert.equal(receivedRequest.model, "gemini-2.5-flash");
  assert.match(receivedRequest.contents, /Lecture notes/);
  assert.doesNotMatch(receivedRequest.contents, /test-key/);
  assert.equal(receivedRequest.config.maxOutputTokens, 600);
  assert.equal(typeof receivedRequest.config.systemInstruction, "string");
  assert.ok(receivedRequest.config.abortSignal instanceof AbortSignal);
});

test("uses an explicitly configured Gemini model", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_MODEL = " custom-model ";
  let requestedModel;

  await summarizeLectureDescription(
    { title: "Lecture", description: "Lecture notes" },
    {
      clientFactory: () => ({
        models: {
          generateContent: async ({ model }) => {
            requestedModel = model;
            return { text: "Summary" };
          },
        },
      }),
    }
  );

  assert.equal(requestedModel, "custom-model");
});

test("maps Gemini authentication, model, and quota errors to service unavailable", async () => {
  process.env.GEMINI_API_KEY = "test-key";

  for (const status of [401, 403, 404, 429]) {
    const clientFactory = () => ({
      models: {
        generateContent: async () => {
          const error = new Error("sensitive provider response");
          error.status = status;
          throw error;
        },
      },
    });

    await assert.rejects(
      summarizeLectureDescription(
        { title: "Lecture", description: "Lecture notes." },
        { clientFactory }
      ),
      (error) =>
        error instanceof SummarizationError &&
        error.statusCode === 503 &&
        !error.message.includes("sensitive provider response")
    );
  }
});

test("maps provider failures without exposing API keys or lecture text", async () => {
  process.env.GEMINI_API_KEY = "private-test-key";
  const logged = [];
  console.error = (...args) => logged.push(args);
  const clientFactory = () => ({
    models: {
      generateContent: async () => {
        const error = new Error("private prompt and provider response");
        error.status = 500;
        throw error;
      },
    },
  });

  await assert.rejects(
    summarizeLectureDescription(
      { title: "Secret lecture", description: "Private lecture notes." },
      { clientFactory }
    ),
    (error) =>
      error instanceof SummarizationError &&
      error.statusCode === 502 &&
      !error.message.includes("private")
  );

  assert.equal(logged.length, 1);
  assert.doesNotMatch(JSON.stringify(logged), /private-test-key|Private lecture notes|private prompt/);
});

test("maps Gemini request timeouts to gateway timeout", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  console.error = () => {};
  const clientFactory = () => ({
    models: {
      generateContent: async () => {
        const error = new Error("timed out");
        error.name = "TimeoutError";
        throw error;
      },
    },
  });

  await assert.rejects(
    summarizeLectureDescription(
      { title: "Lecture", description: "Lecture notes." },
      { clientFactory }
    ),
    (error) => error instanceof SummarizationError && error.statusCode === 504
  );
});

test("rejects malformed or empty Gemini text responses", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  console.error = () => {};

  for (const response of [null, {}, { text: "  " }]) {
    const clientFactory = () => ({
      models: { generateContent: async () => response },
    });

    await assert.rejects(
      summarizeLectureDescription(
        { title: "Lecture", description: "Lecture notes." },
        { clientFactory }
      ),
      (error) => error instanceof SummarizationError && error.statusCode === 502
    );
  }
});
