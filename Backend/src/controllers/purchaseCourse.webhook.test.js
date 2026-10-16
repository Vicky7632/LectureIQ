const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const crypto = require("node:crypto");
const express = require("express");
const Enrollment = require("../models/enrollment");
const Payment = require("../models/payment");

const originalKeyId = process.env.RAZORPAY_KEY_ID;
const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "test-key-id";
process.env.RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET || "test-key-secret";
const { mountPaymentWebhook } = require("../routes/paymentSystem");
const { verifyPayment } = require("./purchaseCourse");
if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
else process.env.RAZORPAY_KEY_ID = originalKeyId;
if (originalKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
else process.env.RAZORPAY_KEY_SECRET = originalKeySecret;

const webhookSecret = "test-webhook-signing-secret";
const orderId = "order_test123";
const paymentId = "pay_test123";
const studentId = "507f1f77bcf86cd799439011";
const courseId = "507f1f77bcf86cd799439012";
const enrollmentId = "507f1f77bcf86cd799439013";

const createWebhookBody = (overrides = {}) =>
  JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          status: "captured",
          amount: 12500,
          currency: "INR",
          ...overrides,
        },
      },
    },
  });

const signBody = (body) =>
  crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

const sendWebhook = (server, body, signature = signBody(body)) =>
  new Promise((resolve, reject) => {
    const address = server.address();
    const headers = {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      connection: "close",
    };
    if (signature !== null) {
      headers["x-razorpay-signature"] = signature;
    }
    const request = http.request(
      {
        host: "127.0.0.1",
        port: address.port,
        path: "/payment/webhooks/razorpay",
        method: "POST",
        headers,
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          const contentType = response.headers["content-type"] || "";
          resolve({
            statusCode: response.statusCode,
            body: contentType.includes("application/json")
              ? JSON.parse(responseBody)
              : responseBody,
          });
        });
      }
    );
    request.on("error", reject);
    request.end(body);
  });

const withWebhookFixture = async (
  { paymentOverrides = {}, enrollmentOverrides = {} } = {},
  action
) => {
  const originals = {
    paymentFindOne: Payment.findOne,
    paymentFindOneAndUpdate: Payment.findOneAndUpdate,
    paymentUpdateOne: Payment.updateOne,
    enrollmentFindOne: Enrollment.findOne,
    enrollmentFindOneAndUpdate: Enrollment.findOneAndUpdate,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    clientKeySecret: process.env.RAZORPAY_KEY_SECRET,
  };
  const payment = {
    _id: "payment-id",
    student: studentId,
    course: courseId,
    enrollment: enrollmentId,
    amount: 125,
    currency: "INR",
    paymentProvider: "razorpay",
    providerOrderId: orderId,
    providerPaymentId: null,
    status: "created",
    meta: null,
    saveCount: 0,
    updateCount: 0,
    save: async function () {
      this.saveCount += 1;
    },
    ...paymentOverrides,
  };
  const enrollment = {
    _id: enrollmentId,
    student: studentId,
    course: courseId,
    status: "pending",
    paymentStatus: "pending",
    enrolledAt: null,
    ...enrollmentOverrides,
  };
  const counts = {
    activationUpdates: 0,
    clientVerificationUpdates: 0,
    steps: [],
  };

  process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
  process.env.RAZORPAY_KEY_SECRET = "test-client-signing-secret";
  Payment.findOne = async (query) =>
    query.providerOrderId === payment.providerOrderId &&
    (query.paymentProvider === undefined ||
      query.paymentProvider === payment.paymentProvider)
      ? payment
      : null;
  Payment.findOneAndUpdate = async (query, update) => {
    const matches =
      query.providerOrderId === payment.providerOrderId &&
      query.paymentProvider === payment.paymentProvider &&
      String(query.student) === String(payment.student) &&
      query.status.$in.includes(payment.status) &&
      query.$or.some(
        (condition) =>
          condition.providerPaymentId == null ||
          condition.providerPaymentId === payment.providerPaymentId
      );
    if (!matches) {
      return null;
    }
    Object.assign(payment, update.$set);
    counts.clientVerificationUpdates += 1;
    counts.steps.push("client-verification");
    return payment;
  };
  Payment.updateOne = async (query, update) => {
    const matches =
      String(query._id) === String(payment._id) &&
      query.paymentProvider === payment.paymentProvider &&
      query.providerOrderId === payment.providerOrderId &&
      query.status.$in.includes(payment.status) &&
      (payment.providerPaymentId == null ||
        query.$or.some(
          (condition) =>
            condition.providerPaymentId === payment.providerPaymentId
        ));
    if (!matches) {
      return { matchedCount: 0 };
    }
    counts.steps.push("payment");
    Object.assign(payment, update.$set);
    payment.updateCount += 1;
    return { matchedCount: 1 };
  };
  Enrollment.findOne = async (query) =>
    String(query._id) === String(enrollment._id) &&
    String(query.student) === String(enrollment.student) &&
    String(query.course) === String(enrollment.course)
      ? enrollment
      : null;
  Enrollment.findOneAndUpdate = async (query, update) => {
    if (
      String(query._id) !== String(enrollment._id) ||
      String(query.student) !== String(enrollment.student) ||
      String(query.course) !== String(enrollment.course) ||
      query.status !== enrollment.status
    ) {
      return null;
    }
    counts.steps.push("enrollment");
    Object.assign(enrollment, update.$set);
    counts.activationUpdates += 1;
    return enrollment;
  };

  const app = express();
  mountPaymentWebhook(app);
  app.use(express.json());
  const server = http.createServer(app);

  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    return await action({ server, payment, enrollment, counts });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    Payment.findOne = originals.paymentFindOne;
    Payment.findOneAndUpdate = originals.paymentFindOneAndUpdate;
    Payment.updateOne = originals.paymentUpdateOne;
    Enrollment.findOne = originals.enrollmentFindOne;
    Enrollment.findOneAndUpdate = originals.enrollmentFindOneAndUpdate;
    if (originals.webhookSecret === undefined) {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    } else {
      process.env.RAZORPAY_WEBHOOK_SECRET = originals.webhookSecret;
    }
    if (originals.clientKeySecret === undefined) {
      delete process.env.RAZORPAY_KEY_SECRET;
    } else {
      process.env.RAZORPAY_KEY_SECRET = originals.clientKeySecret;
    }
  }
};

const createControllerResponse = () => ({
  statusCode: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("verifies exact raw webhook bytes and activates the matching enrollment", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const rawBody = ` {\n  "event": "payment.captured",\n  "payload": {"payment":{"entity":{"id":"${paymentId}","order_id":"${orderId}","status":"captured","amount":12500,"currency":"INR"}}}\n}\n`;
    const response = await sendWebhook(server, rawBody);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(enrollment.status, "active");
    assert.equal(enrollment.paymentStatus, "paid");
    assert.ok(enrollment.enrolledAt instanceof Date);
    assert.equal(payment.status, "success");
    assert.equal(payment.providerPaymentId, paymentId);
    assert.equal(counts.activationUpdates, 1);
    assert.equal(payment.saveCount, 0);
    assert.equal(payment.updateCount, 1);
    assert.deepEqual(counts.steps, ["payment", "enrollment"]);
  });
});

test("rejects an invalid signature without changing payment or enrollment", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const body = createWebhookBody();
    const response = await sendWebhook(server, body, "0".repeat(64));

    assert.equal(response.statusCode, 400);
    assert.equal(payment.status, "created");
    assert.equal(enrollment.status, "pending");
    assert.equal(counts.activationUpdates, 0);
    assert.equal(payment.updateCount, 0);
  });
});

test("rejects missing and malformed webhook signatures without changing state", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const body = createWebhookBody();
    const missingSignature = await sendWebhook(server, body, null);
    const malformedSignature = await sendWebhook(server, body, "not-a-signature");

    assert.equal(missingSignature.statusCode, 400);
    assert.equal(malformedSignature.statusCode, 400);
    assert.equal(payment.status, "created");
    assert.equal(enrollment.status, "pending");
    assert.equal(counts.activationUpdates, 0);
    assert.equal(payment.updateCount, 0);
  });
});

test("rejects a captured payment with a conflicting stored payment ID", async () => {
  await withWebhookFixture(
    { paymentOverrides: { providerPaymentId: "pay_other" } },
    async ({ server, payment, enrollment, counts }) => {
      const response = await sendWebhook(server, createWebhookBody());

      assert.equal(response.statusCode, 409);
      assert.equal(payment.status, "created");
      assert.equal(payment.providerPaymentId, "pay_other");
      assert.equal(enrollment.status, "pending");
      assert.equal(counts.activationUpdates, 0);
      assert.equal(payment.updateCount, 0);
    }
  );
});

test("does not activate enrollment when payment persistence does not match", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    Payment.updateOne = async () => ({ matchedCount: 0 });
    const response = await sendWebhook(server, createWebhookBody());

    assert.equal(response.statusCode, 409);
    assert.equal(payment.status, "created");
    assert.equal(enrollment.status, "pending");
    assert.equal(counts.activationUpdates, 0);
  });
});

test("does not activate enrollment for failed or mismatched captured payments", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const failedBody = JSON.stringify({
      event: "payment.failed",
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            status: "failed",
            amount: 12500,
            currency: "INR",
          },
        },
      },
    });
    const failedResponse = await sendWebhook(server, failedBody);
    assert.equal(failedResponse.statusCode, 200);
    assert.equal(failedResponse.body.status, "ignored");

    const mismatchedBody = createWebhookBody({ amount: 12501 });
    const mismatchedResponse = await sendWebhook(server, mismatchedBody);
    assert.equal(mismatchedResponse.statusCode, 400);
    assert.equal(payment.status, "created");
    assert.equal(enrollment.status, "pending");
    assert.equal(counts.activationUpdates, 0);
    assert.equal(payment.saveCount, 0);
  });
});

test("rejects webhook data not associated with the stored order and enrollment", async () => {
  await withWebhookFixture(
    { paymentOverrides: { providerOrderId: "order_unrelated" } },
    async ({ server, payment, enrollment, counts }) => {
      const response = await sendWebhook(server, createWebhookBody());

      assert.equal(response.statusCode, 404);
      assert.equal(payment.status, "created");
      assert.equal(enrollment.status, "pending");
      assert.equal(counts.activationUpdates, 0);
      assert.equal(payment.saveCount, 0);
    }
  );

  await withWebhookFixture(
    { paymentOverrides: { currency: "USD" } },
    async ({ server, payment, enrollment, counts }) => {
      const response = await sendWebhook(server, createWebhookBody());

      assert.equal(response.statusCode, 400);
      assert.equal(payment.status, "created");
      assert.equal(enrollment.status, "pending");
      assert.equal(counts.activationUpdates, 0);
      assert.equal(payment.saveCount, 0);
    }
  );

  await withWebhookFixture(
    { paymentOverrides: { enrollment: "unrelated-enrollment" } },
    async ({ server, payment, enrollment, counts }) => {
      const response = await sendWebhook(server, createWebhookBody());

      assert.equal(response.statusCode, 404);
      assert.equal(payment.status, "created");
      assert.equal(enrollment.status, "pending");
      assert.equal(counts.activationUpdates, 0);
      assert.equal(payment.saveCount, 0);
    }
  );
});

test("duplicate delivery activates and persists payment only once", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const body = createWebhookBody();
    const firstResponse = await sendWebhook(server, body);
    const duplicateResponse = await sendWebhook(server, body);

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(firstResponse.body.status, "ok");
    assert.equal(duplicateResponse.statusCode, 200);
    assert.equal(duplicateResponse.body.status, "already_processed");
    assert.equal(enrollment.status, "active");
    assert.equal(counts.activationUpdates, 1);
    assert.equal(payment.saveCount, 0);
    assert.equal(payment.updateCount, 1);
  });
});

test("concurrent deliveries cannot replace a different captured payment ID", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const firstBody = createWebhookBody();
    const competingPaymentId = "pay_competing";
    const secondBody = createWebhookBody({ id: competingPaymentId });
    const results = await Promise.all([
      sendWebhook(server, firstBody).then((response) => ({
        paymentId,
        response,
      })),
      sendWebhook(server, secondBody).then((response) => ({
        paymentId: competingPaymentId,
        response,
      })),
    ]);
    const accepted = results.find(({ response }) => response.statusCode === 200);
    const rejected = results.find(({ response }) => response.statusCode === 409);

    assert.ok(accepted);
    assert.ok(rejected);
    assert.equal(payment.providerPaymentId, accepted.paymentId);
    assert.equal(enrollment.status, "active");
    assert.equal(counts.activationUpdates, 1);
    assert.equal(payment.updateCount, 1);
  });
});

test("retry activates enrollment after the first enrollment write fails", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const originalUpdate = Enrollment.findOneAndUpdate;
    let failFirstActivation = true;
    Enrollment.findOneAndUpdate = async (query, update, options) => {
      if (failFirstActivation) {
        failFirstActivation = false;
        throw new Error("Simulated enrollment persistence failure");
      }
      return originalUpdate(query, update, options);
    };
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const body = createWebhookBody();
      const firstResponse = await sendWebhook(server, body);
      assert.equal(firstResponse.statusCode, 500);
      assert.equal(payment.status, "success");
      assert.equal(enrollment.status, "pending");

      const retryResponse = await sendWebhook(server, body);
      assert.equal(retryResponse.statusCode, 200);
      assert.equal(enrollment.status, "active");
      assert.equal(enrollment.paymentStatus, "paid");
      assert.equal(counts.activationUpdates, 1);
      assert.equal(payment.updateCount, 1);
    } finally {
      console.error = originalConsoleError;
      Enrollment.findOneAndUpdate = originalUpdate;
    }
  });
});

test("activates enrollment after the actual client verification handler runs", async () => {
  await withWebhookFixture({}, async ({ server, payment, enrollment, counts }) => {
    const verificationSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    const verificationResponse = createControllerResponse();

    await verifyPayment(
      {
        student: { _id: studentId, role: "student" },
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: verificationSignature,
        },
      },
      verificationResponse
    );
    assert.equal(verificationResponse.statusCode, 200);
    assert.equal(payment.status, "success");
    assert.equal(payment.providerPaymentId, paymentId);
    assert.equal(counts.clientVerificationUpdates, 1);

    const response = await sendWebhook(server, createWebhookBody());

    assert.equal(response.statusCode, 200);
    assert.equal(enrollment.status, "active");
    assert.equal(enrollment.paymentStatus, "paid");
    assert.equal(payment.status, "success");
    assert.equal(counts.activationUpdates, 1);
    assert.equal(payment.updateCount, 1);
  });
});

test("client verification cannot update another student's payment", async () => {
  await withWebhookFixture({}, async ({ payment, enrollment, counts }) => {
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    const response = createControllerResponse();

    await verifyPayment(
      {
        student: { _id: "507f1f77bcf86cd799439099", role: "student" },
        body: {
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        },
      },
      response
    );

    assert.equal(response.statusCode, 404);
    assert.equal(payment.status, "created");
    assert.equal(payment.providerPaymentId, null);
    assert.equal(counts.clientVerificationUpdates, 0);
    assert.equal(enrollment.status, "pending");
  });
});

test("duplicate delivery leaves enrollment activation time unchanged", async () => {
  await withWebhookFixture({}, async ({ server, enrollment, counts }) => {
    const body = createWebhookBody();
    await sendWebhook(server, body);
    const enrolledAt = enrollment.enrolledAt;
    const duplicateResponse = await sendWebhook(server, body);

    assert.equal(duplicateResponse.statusCode, 200);
    assert.equal(duplicateResponse.body.status, "already_processed");
    assert.equal(enrollment.enrolledAt, enrolledAt);
    assert.equal(counts.activationUpdates, 1);
  });
});

test("rejects captured events for a payment already marked failed", async () => {
  await withWebhookFixture(
    { paymentOverrides: { status: "failed" } },
    async ({ server, payment, enrollment, counts }) => {
      const response = await sendWebhook(server, createWebhookBody());

      assert.equal(response.statusCode, 409);
      assert.equal(payment.status, "failed");
      assert.equal(enrollment.status, "pending");
      assert.equal(counts.activationUpdates, 0);
    }
  );
});
