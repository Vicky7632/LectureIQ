const assert = require("node:assert/strict");
const test = require("node:test");
const Payment = require("../models/payment");
const Student = require("../models/student");
const Course = require("../models/course");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminRouter = require("../routes/adminRoutes");
const {
  getAllPayments,
  getCoursePayments,
  getAdminDashboardStats,
} = require("./adminDashboard");

const originals = {
  paymentFind: Payment.find,
  paymentAggregate: Payment.aggregate,
  studentCount: Student.countDocuments,
  courseCount: Course.countDocuments,
};

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
  Payment.find = originals.paymentFind;
  Payment.aggregate = originals.paymentAggregate;
  Student.countDocuments = originals.studentCount;
  Course.countDocuments = originals.courseCount;
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

test("admin dashboard returns aggregate counts and successful revenue only", async () => {
  const countQueries = [];
  Student.countDocuments = async (query) => {
    countQueries.push(query);
    return query.role === "student" ? 12 : 3;
  };
  Course.countDocuments = async (query = {}) => {
    countQueries.push(query);
    return query.status === "pending" ? 2 : 24;
  };
  let revenuePipeline;
  Payment.aggregate = async (pipeline) => {
    revenuePipeline = pipeline;
    return [{ total: 1250 }];
  };

  const res = createResponse();
  await getAdminDashboardStats({}, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    totalStudents: 12,
    totalTeachers: 3,
    totalCourses: 24,
    pendingApprovals: 2,
    totalRevenue: 1250,
  });
  assert.deepEqual(countQueries, [
    { role: "student" },
    { role: "teacher" },
    {},
    { status: "pending" },
  ]);
  assert.deepEqual(revenuePipeline[0], { $match: { status: "success" } });
});

test("admin dashboard reports zero for empty collections and no successful payments", async () => {
  Student.countDocuments = async () => 0;
  Course.countDocuments = async () => 0;
  Payment.aggregate = async () => [];

  const res = createResponse();
  await getAdminDashboardStats({}, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
  });
});

test("admin dashboard statistics route remains admin-only", () => {
  const route = adminRouter.stack.find(
    (layer) => layer.route?.path === "/dashboard-stats" && layer.route.methods.get
  );
  assert.ok(route);
  assert.equal(route.route.stack[0].handle, adminMiddleware);
});
