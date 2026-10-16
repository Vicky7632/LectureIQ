const assert = require("node:assert/strict");
const test = require("node:test");
const Payment = require("../models/payment");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminRouter = require("../routes/adminRoutes");
const { getAllPayments, getCoursePayments } = require("./adminDashboard");

const originalFind = Payment.find;

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const createPaymentQuery = ({ records, projections, populates }) => ({
  select(fields) {
    projections.push(fields);
    return this;
  },
  populate(path, fields) {
    populates.push({ path, fields });
    return this;
  },
  sort() {
    return Promise.resolve(records);
  },
  then(resolve, reject) {
    return Promise.resolve(records).then(resolve, reject);
  },
});

test.afterEach(() => {
  Payment.find = originalFind;
});

test("admin payment endpoints whitelist response fields and keep enrollment population bounded", async () => {
  const projections = [];
  const populates = [];
  const payment = {
    _id: "payment-1",
    student: { firstName: "Student", email: "student@example.test" },
    course: { title: "Course", price: 100 },
    enrollment: { status: "active", paymentStatus: "paid" },
    amount: 100,
    currency: "INR",
    status: "success",
    paymentProvider: "razorpay",
    providerOrderId: "order-1",
    providerPaymentId: "payment-1",
    providerSignature: "sensitive-signature",
    meta: { email: "private@example.test" },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  Payment.find = () =>
    createPaymentQuery({
      records: [payment],
      projections,
      populates,
    });

  const allResponse = createResponse();
  await getAllPayments({}, allResponse);
  const courseResponse = createResponse();
  await getCoursePayments({ params: { courseId: "course-1" } }, courseResponse);

  assert.equal(allResponse.statusCode, 200);
  assert.equal(allResponse.body.payments[0].providerSignature, undefined);
  assert.equal(allResponse.body.payments[0].meta, undefined);
  assert.equal(courseResponse.statusCode, 200);
  assert.equal(courseResponse.body.payments[0].providerSignature, undefined);
  assert.equal(courseResponse.body.payments[0].meta, undefined);
  assert.equal(courseResponse.body.totalPayments, 1);
  assert.equal(courseResponse.body.totalRevenue, 100);
  assert.equal(projections.length, 2);
  for (const projection of projections) {
    assert.match(projection, /providerPaymentId/);
    assert.doesNotMatch(projection, /providerSignature|meta/);
  }
  assert.ok(
    populates.some(
      ({ path, fields }) =>
        path === "enrollment" &&
        fields === "_id student course status paymentStatus enrolledAt expiresAt"
    )
  );
});

test("payment reporting routes remain admin-only", () => {
  for (const path of ["/payments", "/course/:courseId/payments"]) {
    const route = adminRouter.stack.find(
      (layer) => layer.route?.path === path && layer.route.methods.get
    );
    assert.ok(route, `missing admin route ${path}`);
    assert.equal(route.route.stack[0].handle, adminMiddleware);
  }
});
