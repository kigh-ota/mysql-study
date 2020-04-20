const util = require("./util");

test("test", async () => {
  const conn = await util.createConnection();
  const dbName = await util.createDatabase(conn);
  const result = await conn.query("SHOW DATABASES;");
  await util.dropDatabase(dbName, conn);
  await conn.end();
});
