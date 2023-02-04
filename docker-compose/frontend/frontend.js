//-----------------------------------------------------------------------
// Source: frontend.js
// Authors: Ismael Mira, Blanca Mellado 
//-----------------------------------------------------------------------

//Kafka parameters
const { Kafka } = require("kafkajs")
const clientId = "frontend"
const brokers = [process.env.KAFKA_BOOTSTRAP]  
const topicJobs = "trabajos"
const topicResults = "resultados"
const kafka = new Kafka({clientId, brokers})

const connectToDatabase = async() => {
  const { Client } = require('pg')
  const connectionData = {
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRESS_PORT,
  }
  client = new Client(connectionData)
  client.connect().catch(error => console.log(error))
  return client
}
const clientDatabase = connectToDatabase()

//Create kafka topic if it doesnt exist
try {
  administrador = kafka.admin()
  administrador.connect()
  administrador.createTopics({
    topics:[{topic:'trabajos'}],
    waitForLeaders:true,
  })
  administrador.disconnect()
} catch (error) {
  console.log(error)
  exit(1)
}

//Express parameters
const express = require('express')
const app = express()
const port = 3000

//Uuid (generates unique ids for requests)
const { v4:uuidv4 } = require('uuid')

//Start producer
const producer = kafka.producer()
try {
  producer.connect()
} catch (error) {
  console.log(error)
  exit(2)
}

//GET Produce messages on jobs queue on request
app.get('/add', async (req, res) => {
  try{
    const url_github = req.query.url
    key = uuidv4() //Generate unique key
    producer.send({
      topic:topicJobs,
      messages: [
        {
          key: key,
	  value: url_github
        }
      ]
    })
    res.send("Trabajo añadido: " + key + "\n")
  } catch (error) {
    console.log(error)
    res.send("Error")
  }
})

//GET Show all jobs for user
app.get('/all', async (req, res) => {
  
  //Buscar en base de datos todos los trabajos del usuario
  var query = "SELECT * FROM resultados"
  client.query(query)
    .then(responseDatabase => {
       console.log(responseDatabase.rows)
       res.json(responseDatabase.rows)
    })
    .catch(err => {
       client.end()
       res.send("Error in database")
    })
})

//GET Show status of job for user with key
app.get('/status', async (req, res) => {
  
  //Buscar en base de datos el status de un trabajo
  var query = "SELECT * FROM resultados WHERE key='" + req.query.key + "';"
  client.query(query)
    .then(responseDatabase => {
       console.log(responseDatabase.rows)
       res.json(responseDatabase.rows)
    })
    .catch(err => {
       client.end()
       res.send("Error in database with query: " + query)
    })
})

//GET Healthcheck on request
app.get('/healthcheck', async (req, res) => {
  res.send("OK")
})

//Bind app to port
app.listen(port, () => {
  console.log(`Frontend listening on port ${port}`)
})
