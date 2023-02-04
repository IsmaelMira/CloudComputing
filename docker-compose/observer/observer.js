const { Kafka } = require("kafkajs")

const clientId = "observer"
const brokers = [process.env.KAFKA_BOOTSTRAP]
const topicResultados = "resultados"

const kafka = new Kafka({ clientId, brokers })
const consumer = kafka.consumer({ groupId: "observer" })

const consume = async () => {
  await consumer.connect()
  await consumer.subscribe({ topics: [topicResultados] })
  await consumer.run({
    // This function is called every time the consumer gets a new message
    eachMessage: async ({ topic, message }) => {
      var statusOfJob = JSON.parse(message.value)
      var timeWait = (parseInt(message.timestamp, 10) - parseInt(statusOfJob.timeJobPosted, 10) - parseInt(statusOfJob.timeExecution,10))
      console.log("received message: " + message.value + " timeResultArrived: " + message.timestamp + " wait was: " + timeWait)
    }
  })
}

consume().catch(error => console.log(error))
