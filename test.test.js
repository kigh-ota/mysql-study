const mysql = require("promise-mysql");
const createDatabase = require("./util").createDatabase;
const dropDatabase = require("./util").dropDatabase;

test("test", async () => {
  const conn = await mysql.createConnection({
    host: "localhost",
    port: 13306,
    user: "root",
  });
  const dbName = await createDatabase(conn);
  const result = await conn.query("SHOW DATABASES;");
  console.dir(result);
  await dropDatabase(dbName, conn);
  await conn.end();
});
