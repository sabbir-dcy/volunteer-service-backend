import mongodb from 'mongodb'
import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('on api')
})

app.listen(port, () => {
  console.log('listening to port', port)
})

const { MongoClient, ServerApiVersion } = mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8oshb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
})

async function run() {
  try {
    await client.connect()
    const activityCollection = client
      .db('volunteerService')
      .collection('activities')

    /**
     * http://localhost:5000/api/activity
     *
     * post activity to database
     */
    app.post('/api/activity', async (req, res) => {
      const activity = req.body
      const result = await activityCollection.insertOne(activity)
      res.send(result)
    })

    /**
     * http://localhost:5000/api/activities
     *
     * get all activities from the server
     */
    app.get('/api/activities', async (req, res) => {
      const query = req.query
      const cursor = activityCollection.find(query)
      const activities = await cursor.toArray()
      res.send(activities)
    })
  } finally {
  }
}
run().catch(console.dir)
