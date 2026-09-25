const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const encrypt = require("../src/utils/encrypt");
const decrypt = require("../src/utils/decrypt");
test("authenticated encryption round trip, fresh nonces, tamper and wrong-key rejection", () => {
  const key = crypto.randomBytes(32),
    plain = Buffer.from("private contents");
  const one = encrypt(plain, key),
    two = encrypt(plain, key);
  assert.deepEqual(decrypt(one, key), plain);
  assert.notDeepEqual(one, two);
  assert.throws(() => decrypt(one, crypto.randomBytes(32)));
  const modified = Buffer.from(one);
  modified[modified.length - 1] ^= 1;
  assert.throws(() => decrypt(modified, key));
  assert.throws(() => decrypt(Buffer.from("invalid"), key));
});
