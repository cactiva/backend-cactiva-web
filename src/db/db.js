const {Client} = require("pg")

const Clientdb = new Client({
    port: 5432,
    host: "db.web.andromedia.co.id",
    user: "postgres",
    password: "andromedia123oke",
    database: "cactivaDB"
})


module.exports = {Clientdb}