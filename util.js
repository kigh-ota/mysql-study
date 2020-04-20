const mysql = require("promise-mysql");

function randomString() {
  const LENGTH = 16;
  let result = "";
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charsLength = CHARS.length;
  for (var i = 0; i < LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
}

async function createConnection() {
  const conn = await mysql.createConnection({
    host: "localhost",
    port: 13306,
    user: "root",
  });
  return conn;
}

async function createDatabase(conn) {
  const dbName = randomString();
  await conn.query(`CREATE DATABASE ${dbName}`);
  return dbName;
}

async function useDatabase(dbName, conn) {
  await conn.query(`USE ${dbName}`);
}

async function dropDatabase(dbName, conn) {
  await conn.query(`DROP DATABASE ${dbName}`);
}

module.exports = {
  createConnection,
  createDatabase,
  useDatabase,
  dropDatabase,
};
