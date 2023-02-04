const { Kafka } = require("kafkajs")
const Minio = require("minio")
const shell = require("shelljs")

//const path = '../repos/'
//shell.cd(path)

// Kafka const
const clientId = "workers"
const brokers = [process.env.KAFKA_BOOTSTRAP]
const topicTrabajos = "trabajos"
const topicResultados = "resultados"

const kafka = new Kafka({ clientId, brokers })
const consumer = kafka.consumer({ groupId: "worker" })
const producerResults = kafka.producer()

const administrator = kafka.admin()

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

// Create topic if it doesnt exist
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

const executeURL = async (url) => {
  //shell.exec('git clone https://github.com/atomicptr/dauntless-builder')
}

const writeStatusInResultsQueue = async (producer, key, statusOfJob) => {
  producer.send({
    topic:topicResultados,
    messages: [
        {
	  key: key,
	  value: JSON.stringify(statusOfJob)
        } 	   
    ]
  }).catch(error => console.log(error))
  console.log("Escrito mensaje de estado")
}

const writeToDatabase = async(user, key, statusCode) => {
  //TODO: Escribir clave, propietario del trabajo, estado y resultados del trabajo en una base de datos
  //Si puede ser ordenada por propietario
  var query = "INSERT INTO resultados (usuario, key, status) VALUES ('" + user + "','" + key + "','" + statusCode.toString() + "');"
  client.query(query)
  .then(response => {
    console.log(response.rows)
    client.end()
  })
  .catch(err => {
    client.end()
  })
}

const writeJobFailed = async (producer, key, timeJobPosted) => {
  console.log("Trabajo " + key + " ha fallado")
  statusOfJob = {code:"Failed", timeJobPosted:timeJobPosted}
  writeStatusInResultsQueue(producer, key, statusOfJob)
  writeToDatabase("user", key, "Failed")
}

const writeJobDone = async (producer, key, timeJobPosted, timeExecution) => {
  console.log("Trabajo " + key + " terminado")
  statusOfJob = {code:"Finished", timeJobPosted:timeJobPosted, timeExecution:timeExecution}
  writeStatusInResultsQueue(producer, key, statusOfJob)
  writeToDatabase("user", key, "Finished")
}

const consume = async () => {
  // First, we wait to connect and subscribe to the jobs queue, and connect to the results queue
  await consumer.connect()
  await consumer.subscribe({ topics: [topicTrabajos] })
  await producerResults.connect()

  await connectToDatabase()
	
  await consumer.run({
    // This function is called every time the consumer gets a new message
    eachMessage: async ({ message }) => {
      console.log("received message: " + message.key + " " + message.value)
      key = message.key
      url = message.value
      var timeJobPosted = Number(message.timestamp) 
      // Execute job
      var timeStart = new Date()
      console.log("timeStart: " + timeStart)
      executeURL(url).catch(error => {
        console.log(error)
	// Write in results queue that job failed
	writeJobFailed(producerResults, key, timeJobPosted)
      });
      var timeExecution = new Date() - timeStart
      // Write in results queue that job was completed
      writeJobDone(producerResults, key, timeJobPosted, timeExecution)
    }
  })
}
consume().catch(error => console.log(error))

