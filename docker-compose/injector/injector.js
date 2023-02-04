const { Client } = require('pg')

const connectionData = {

	  user: process.env.POSTGRES_USER,

	  host: 'postgres',

	  database: process.env.POSTGRES_DB,

	  password: process.env.POSTGRES_PASSWORD,

	  port: process.env.POSTGRES_PORT,

}

const client = new Client(connectionData)
client.connect()

var query = "CREATE table Resultados("
  + "Usuario varchar(500),"
  + "Key varchar(500),"
  + "Status varchar(20),"
  + "Results varchar(500),"
  + "PRIMARY KEY (Usuario, Key)"
  + ");"

client.query(query)
  .then(response => {
    console.log(response.rows)
    client.end()
 })
.catch(err => {
    client.end()
})
