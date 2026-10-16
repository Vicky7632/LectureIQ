const assert = require("node:assert/strict");
const test = require("node:test");
const Student = require("../models/student");
const Enrollment = require("../models/enrollment");
const Course = require("../models/course");
const { getMyProfile, updateMyProfile } = require("./profileController");

const originals = {
  enrollmentCount: Enrollment.countDocuments,
  courseCount: Course.countDocuments,
  studentCount: Student.countDocuments,
  studentFindOne: Student.findOne,
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

test.afterEach(() => {
  Enrollment.countDocuments = originals.enrollmentCount;
  Course.countDocuments = originals.courseCount;
  Student.countDocuments = originals.studentCount;
  Student.findOne = originals.studentFindOne;
});

test("returns the schema profileImage field to the authenticated user's profile", async () => {
  Enrollment.countDocuments = async (query) => {
    assert.deepEqual(query, { student: "student-1", status: "active" });
    return 2;
  };
  const response = createResponse();

  await getMyProfile(
    {
      student: {
        _id: "student-1",
        role: "student",
        firstName: "A",
        lastName: "Student",
        email: "student@example.test",
        profileImage: "https://images.example.test/student.png",
      },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.profile.profileImage, "https://images.example.test/student.png");
  assert.equal(response.body.profile.profilePicture, undefined);
});

test("profile updates use only the authenticated user and preserve their profile image", async () => {
  let savedUserId;
  const authenticatedUser = {
    _id: "student-1",
    role: "student",
    firstName: "Before",
    lastName: "Student",
    email: "student@example.test",
    profileImage: "https://images.example.test/current.png",
    save: async function save() {
      savedUserId = this._id;
    },
  };
  Student.findOne = async () => null;
  Enrollment.countDocuments = async () => 1;
  const response = createResponse();

  await updateMyProfile(
    {
      student: authenticatedUser,
      body: {
        firstName: "Updated",
        profileImage: "https://images.example.test/other-user.png",
      },
    },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(savedUserId, "student-1");
  assert.equal(authenticatedUser.firstName, "Updated");
  assert.equal(authenticatedUser.profileImage, "https://images.example.test/current.png");
  assert.equal(response.body.profile.profileImage, "https://images.example.test/current.png");
  assert.equal(response.body.profile.profilePicture, undefined);
});
