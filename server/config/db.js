const sql = require("mssql")

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    options:{trustServerCertificate:true}
}

const pool = new sql.ConnectionPool(config).connect()

module.exports = { sql, pool }