const { Kafka } = require("kafkajs")
const Minio = require("minio")
const shell = require("shelljs")


const path = '../repos/'
shell.cd(path)
const KAFKA_URL = ["localhost:9092"];
const MINIO_URL = ".."

// the client ID lets kafka know who's producing the messages
const clientId = "workers"
// we can define the list of brokers in the cluster
const brokers = ["localhost:9092"]
// this is the topic to which we want to write messages
const topic = "trabajos"

const kafka = new Kafka({ clientId, brokers })
const consumer = kafka.consumer({ groupId: clientId })
const administrator = kafka.admin()

const admin = async () => {
    await administrator.connect()
    administrator.createTopics( {
        topics: [ { topic: "workers" } ]
      } )
}

const consume = async () => {
	// first, we wait for the client to connect and subscribe to the given topic
	await consumer.connect()
	await consumer.subscribe({ topic })
	await consumer.run({
		// this function is called every time the consumer gets a new message
		eachWork: ({ message }) => {
			// here, we just log the message to the standard output
			console.log(`received message: ${message.value}`)
            //shell.exec('git clone https://github.com/atomicptr/dauntless-builder')
		},
	})
}


shell.exec('git clone https://github.com/atomicptr/dauntless-builder')