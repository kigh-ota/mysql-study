const util = require("./util");

let c1, c2, dbName;

beforeEach(async () => {
  c1 = await util.createConnection();
  c2 = await util.createConnection();
  dbName = await util.createDatabase(c1);
  await util.useDatabase(dbName, c1);
  await util.useDatabase(dbName, c2);
});

afterEach(async () => {
  await util.dropDatabase(dbName, c1);
  await c2.end();
  await c1.end();
});

test("Default isolation level is REPEATABLE-READ", async () => {
  const result = await c1.query("SELECT @@transaction_isolation");
  expect(result[0]["@@transaction_isolation"]).toBe("REPEATABLE-READ");
});

test("Default AUTOCOMMIT is 1", async () => {
  const result = await c1.query("SELECT @@autocommit");
  expect(result[0]["@@autocommit"]).toBe(1);
});

// TODO default engine is InnoDB

describe("READ UNCOMMITTED", () => {
  beforeEach(async () => {
    await c1.query("SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED");
    await c2.query("SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED");
  });

  test("allows dirty reads", async () => testDirtyReads(c1, c2, true));
  test("allows phantom reads", async () => testPhantomReads(c1, c2, true));
});

describe("READ COMMITED", () => {
  beforeEach(async () => {
    await c1.query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await c2.query("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED");
  });
  test("does not allow dirty reads", async () => testDirtyReads(c1, c2, false));

  test("allows non-repeatble reads", async () =>
    testNonRepeatableReads(c1, c2, true));
  test("allows phantom reads", async () => testPhantomReads(c1, c2, true));
});

describe("REPEATABLE READ (with MVCC)", () => {
  beforeEach(async () => {
    await c1.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await c2.query("SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ");
  });
  test("does not allow dirty reads", async () => testDirtyReads(c1, c2, false));

  test("does not allow non-repeatble reads", async () =>
    testNonRepeatableReads(c1, c2, false));

  test("does not allow phantom reads", async () =>
    testPhantomReads(c1, c2, false));
});

async function testDirtyReads(c1, c2, allow) {
  await c1.query("CREATE TABLE t (c int)");
  await c1.query("INSERT INTO t VALUES (3)");

  await c1.query("START TRANSACTION");
  await c2.query("START TRANSACTION");

  expect((await c2.query("SELECT * FROM t"))[0]["c"]).toBe(3);
  await c1.query("UPDATE t SET c = 4 WHERE c = 3");
  expect((await c2.query("SELECT * FROM t"))[0]["c"]).toBe(allow ? 4 : 3);

  await c1.query("ROLLBACK");
  await c2.query("ROLLBACK");
}

async function testNonRepeatableReads(c1, c2, allow) {
  await c1.query("CREATE TABLE t (c int)");
  await c1.query("INSERT INTO t VALUES (3)");

  await c1.query("START TRANSACTION");
  await c2.query("START TRANSACTION");

  expect((await c2.query("SELECT * FROM t"))[0]["c"]).toBe(3);
  await c1.query("UPDATE t SET c = 4 WHERE c = 3");
  expect((await c2.query("SELECT * FROM t"))[0]["c"]).toBe(3);
  await c1.query("COMMIT");
  expect((await c2.query("SELECT * FROM t"))[0]["c"]).toBe(allow ? 4 : 3);

  await c2.query("ROLLBACK");
}

async function testPhantomReads(c1, c2, allow) {
  await c1.query("CREATE TABLE t (c int)");

  await c1.query("START TRANSACTION");
  await c2.query("START TRANSACTION");

  expect((await c2.query("SELECT * FROM t")).length).toBe(0); // necessary to actually begin transaction
  await c1.query("INSERT INTO t VALUES (3)");
  await c1.query("COMMIT");
  expect((await c2.query("SELECT * FROM t")).length).toBe(allow ? 1 : 0);

  await c2.query("ROLLBACK");
}

// test("SERIALIZABLE", async (done) => {
//   await conn1.query("CREATE TABLE t (c int)");

//   await conn1.query("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE");
//   await conn1.query("START TRANSACTION");
//   await conn2.query("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE");
//   await conn2.query("START TRANSACTION");

//   await conn1.query("INSERT INTO t VALUES (1)");

//   // 1をCOMMITするまで2のSELECTは返ってこない
//   expect((await conn1.query("SELECT * FROM t")).length).toBe(1);
//   console.log("OK");
//   let commited1 = false;
//   let selected2 = false;
//   const p1 = conn1.query("COMMIT").then(() => {
//     commited1 = true;
//   });
//   const p2 = conn2.query("SELECT * FROM t").then((res) => {
//     expect(commited1).toBe(true);
//     selected2 = true;
//     done();
//   });
//   return Promise.all([p1, p2]).then(() => done());
// });
