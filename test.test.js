const mysql = require("promise-mysql");

test("test", async () => {
  const conn = await mysql.createConnection({
    host: "localhost",
    port: 13306,
    user: "root",
  });
  const result = await conn.query("SHOW DATABASES;");
  console.dir(result);
  await conn.end();
});
