const { before, beforeEach, after, test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { Readable } = require("node:stream");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const { mockClient } = require("aws-sdk-client-mock");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const origin = "http://localhost:5173";
let mongo, app, owner, other, file, shared, ownerCookie;
const content = Buffer.from(
  "Private test document. Only the owner and permitted recipients may read this.",
);

// In-memory fake S3 bucket: Key -> Buffer. Replaces real S3 calls in tests
// so the suite never touches an actual AWS bucket.
const s3Store = new Map();
let s3Mock;

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
  process.env.APP_ORIGIN = origin;

  // Dummy, non-functional AWS config: storage.service.js reads these at
  // module load time to construct its S3Client, but every call is
  // intercepted below, so nothing ever reaches real AWS.
  process.env.AWS_REGION = "us-east-1";
  process.env.AWS_ACCESS_KEY_ID = "test";
  process.env.AWS_SECRET_ACCESS_KEY = "test";
  process.env.AWS_S3_BUCKET_NAME = "test-bucket";

  s3Mock = mockClient(S3Client);
  s3Mock.on(PutObjectCommand).callsFake((input) => {
    s3Store.set(input.Key, Buffer.from(input.Body));
    return {};
  });
  s3Mock.on(GetObjectCommand).callsFake((input) => {
    const body = s3Store.get(input.Key);
    if (!body) {
      const error = new Error("The specified key does not exist.");
      error.name = "NoSuchKey";
      throw error;
    }
    return { Body: Readable.from(body) };
  });
  s3Mock.on(DeleteObjectCommand).callsFake((input) => {
    s3Store.delete(input.Key);
    return {};
  });

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = require("../src/app");
  await Promise.all([
    require("../src/model/User").init(),
    require("../src/model/File").init(),
    require("../src/model/ShareLink").init(),
  ]);
  owner = request.agent(app);
  other = request.agent(app);
});
after(async () => {
  s3Mock.restore();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
test("health, security headers, API 404 and unauthenticated routes", async () => {
  const health = await request(app).get("/api/health").expect(200);
  assert.equal(health.body.status, "ok");
  assert.equal(health.headers["x-content-type-options"], "nosniff");
  assert.equal(health.headers["cache-control"], "no-store");
  await request(app).get("/api/files").expect(401);
  await request(app).get("/api/share").expect(401);
  await request(app).get("/api/missing").expect(404);
});
test("signup validates values, sets HttpOnly cookie and hides sensitive fields", async () => {
  await owner
    .post("/api/auth/signup")
    .set("Origin", origin)
    .send({ email: "bad", password: "short" })
    .expect(400);
  const result = await owner
    .post("/api/auth/signup")
    .set("Origin", origin)
    .send({
      name: "Test Owner",
      email: "Owner+vault@example.technology",
      password: "owner-password-123",
    })
    .expect(201);
  ownerCookie = result.headers["set-cookie"][0].split(";")[0];
  assert.match(result.headers["set-cookie"][0], /HttpOnly/);
  assert.match(result.headers["set-cookie"][0], /SameSite=Lax/);
  assert.equal(result.body.user.name, "Test Owner");
  assert.equal(result.body.token, undefined);
  assert.equal(result.body.user.password, undefined);
  await owner
    .post("/api/auth/signup")
    .set("Origin", origin)
    .send({
      email: "owner+vault@example.technology",
      password: "owner-password-123",
    })
    .expect(409);
  await other
    .post("/api/auth/signup")
    .set("Origin", origin)
    .send({ email: "other@example.test", password: "other-password-123" })
    .expect(201);
  const profile = await owner.get("/api/auth/profile").expect(200);
  assert.equal(profile.body.user.email, "owner+vault@example.technology");
});
test("CSRF rejects untrusted origins and cookie writes without an origin", async () => {
  await owner
    .post("/api/auth/logout")
    .set("Origin", "https://untrusted.example")
    .send({})
    .expect(403);
  await owner.post("/api/auth/logout").send({}).expect(403);
  await owner.get("/api/auth/profile").expect(200);
});
test("upload stores authenticated ciphertext and returns only public fields", async () => {
  const result = await owner
    .post("/api/files/upload")
    .set("Origin", origin)
    .attach("file", content, {
      filename: "private-notes.txt",
      contentType: "text/plain",
    })
    .expect(201);
  file = result.body.file;
  assert.equal(file.storagePath, undefined);
  assert.equal(file.storedName, undefined);
  const stored = await require("../src/model/File").findById(file._id);
  // stored.storagePath is now the S3 object key; read straight from the
  // fake bucket instead of the filesystem.
  const ciphertext = s3Store.get(stored.storagePath);
  assert.ok(ciphertext, "expected an object to have been stored under this key");
  assert.equal(ciphertext.subarray(0, 4).toString(), "ZTS1");
  assert.equal(ciphertext.includes(content), false);
  const resultList = await owner.get("/api/files").expect(200);
  assert.equal(resultList.body.files.length, 1);
  const downloaded = await owner
    .get("/api/files/" + file._id + "/download")
    .expect(200);
  assert.equal(downloaded.text, content.toString());
  assert.match(downloaded.headers["content-disposition"], /attachment/);
  await owner.get("/api/files/download/" + file._id).expect(200);
});
test("tenant isolation prevents reading, sharing, downloading or deleting another users file", async () => {
  assert.equal(
    (await other.get("/api/files").expect(200)).body.files.length,
    0,
  );
  await other.get("/api/files/" + file._id).expect(404);
  await other.get("/api/files/" + file._id + "/download").expect(404);
  await other
    .delete("/api/files/" + file._id)
    .set("Origin", origin)
    .expect(404);
  await other
    .post("/api/share")
    .set("Origin", origin)
    .send({ fileId: file._id })
    .expect(404);
  await owner.get("/api/files/not-an-id").expect(400);
});
test("upload rejects unsupported formats and oversize documents", async () => {
  await owner
    .post("/api/files/upload")
    .set("Origin", origin)
    .attach("file", Buffer.from("<html>"), {
      filename: "unsafe.html",
      contentType: "text/html",
    })
    .expect(400);
  await owner
    .post("/api/files/upload")
    .set("Origin", origin)
    .attach("file", Buffer.alloc(25 * 1024 * 1024 + 1), {
      filename: "large.txt",
      contentType: "text/plain",
    })
    .expect(413);
});
test("password-protected links persist without exposing hashes or counting metadata views", async () => {
  const result = await owner
    .post("/api/share")
    .set("Origin", origin)
    .send({ fileId: file._id, password: "private-pass", allowDownload: true })
    .expect(201);
  shared = result.body.data;
  assert.equal(shared.isPasswordProtected, true);
  assert.equal(shared.passwordHash, undefined);
  const meta = await request(app)
    .get("/api/share/" + shared.token)
    .expect(200);
  assert.equal(meta.body.passwordRequired, true);
  const links = await owner.get("/api/share").expect(200);
  assert.equal(links.body.links.length, 1);
  assert.equal(links.body.links[0].passwordHash, undefined);
  assert.equal(links.body.links[0].accessCount, 0);
  assert.equal(
    (await other.get("/api/share").expect(200)).body.links.length,
    0,
  );
});
test("share access validates password, supports download and preview, and counts accesses atomically", async () => {
  await request(app)
    .post("/api/share/" + shared.token + "/download")
    .send({ password: "wrong" })
    .expect(401);
  const result = await request(app)
    .post("/api/share/" + shared.token + "/download")
    .send({ password: "private-pass" })
    .expect(200);
  assert.equal(result.text, content.toString());
  const preview = await request(app)
    .post("/api/share/" + shared.token + "/preview")
    .send({ password: "private-pass" })
    .expect(200);
  assert.equal(preview.text, content.toString());
  assert.match(preview.headers["content-disposition"], /inline/);
  assert.match(preview.headers["content-security-policy"], /sandbox/);
  await request(app)
    .post("/api/share/" + shared.token + "/access")
    .send({ password: "private-pass" })
    .expect(200);
  assert.equal((await owner.get("/api/share")).body.links[0].accessCount, 3);
});
test("preview-only permission denies download and validates link options", async () => {
  const result = await owner
    .post("/api/share")
    .set("Origin", origin)
    .send({ fileId: file._id, allowDownload: false })
    .expect(201);
  const token = result.body.data.token;
  await request(app)
    .post("/api/share/" + token + "/download")
    .send({})
    .expect(403);
  await request(app)
    .post("/api/share/" + token + "/preview")
    .send({})
    .expect(200);
  await owner
    .post("/api/share")
    .set("Origin", origin)
    .send({ fileId: file._id, allowDownload: "false" })
    .expect(400);
  await owner
    .post("/api/share")
    .set("Origin", origin)
    .send({ fileId: file._id, expiresAt: "invalid" })
    .expect(400);
  await owner
    .post("/api/share")
    .set("Origin", origin)
    .send({ fileId: file._id, password: { $ne: null } })
    .expect(400);
});
test("revocation is owner-only, idempotent and blocks every public access route", async () => {
  await other
    .delete("/api/share/" + shared.token)
    .set("Origin", origin)
    .expect(404);
  await owner
    .post("/api/share/" + shared.token + "/revoke")
    .set("Origin", origin)
    .send({})
    .expect(200);
  await owner
    .delete("/api/share/" + shared.token)
    .set("Origin", origin)
    .expect(200);
  await request(app)
    .get("/api/share/" + shared.token)
    .expect(410);
  for (const route of ["download", "preview", "access"])
    await request(app)
      .post("/api/share/" + shared.token + "/" + route)
      .send({ password: "private-pass" })
      .expect(410);
  assert.equal(
    (await owner.get("/api/share")).body.links.find(
      (link) => link.token === shared.token,
    ).isRevoked,
    true,
  );
});
test("expired links cannot be opened or downloaded", async () => {
  const model = require("../src/model/ShareLink");
  const link = await model.findOne({ isRevoked: false });
  await model.updateOne(
    { _id: link._id },
    { expiresAt: new Date(Date.now() - 1000) },
  );
  await request(app)
    .get("/api/share/" + link.token)
    .expect(410);
  await request(app)
    .post("/api/share/" + link.token + "/download")
    .send({})
    .expect(410);
});
test("deletion removes ciphertext and associated links", async () => {
  await owner
    .delete("/api/files/" + file._id)
    .set("Origin", origin)
    .expect(200);
  assert.equal((await owner.get("/api/share")).body.links.length, 0);
  // Fake bucket should be empty once the object has been deleted from S3.
  assert.equal(s3Store.size, 0);
  await owner.get("/api/files/" + file._id).expect(404);
});
test("logout invalidates existing tokens and login restores a new session", async () => {
  await owner
    .post("/api/auth/logout")
    .set("Origin", origin)
    .send({})
    .expect(200);
  await request(app)
    .get("/api/auth/profile")
    .set("Cookie", ownerCookie)
    .expect(401);
  await owner
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: "owner+vault@example.technology", password: "wrong" })
    .expect(401);
  await owner
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({
      email: "OWNER+VAULT@example.technology",
      password: "owner-password-123",
    })
    .expect(200);
  await owner.get("/api/auth/profile").expect(200);
});
test("login attempts are rate limited", async () => {
  let status;
  for (let i = 0; i < 16; i++)
    status = (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.test", password: "incorrect" })
    ).status;
  assert.equal(status, 429);
});