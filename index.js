import mongodb, { ObjectId } from 'mongodb'
import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'forbidden' })
    }
    console.log('decoded', decoded)
    req.decoded = decoded
    next()
  })
}

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
     * authentication
     * json webtoken
     */

    app.post('/login', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1d',
      })
      console.log('my token', { token })
      res.send({ token })
    })
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

    /**
     * http://localhost:5000/api/my_activities?email=${email}
     *
     * individual user activities
     */
    app.get('/api/my_activities', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email
      const queryEmail = req.query.email
      if (queryEmail === decodedEmail) {
        const query = { email: queryEmail }
        const cursor = activityCollection.find(query)
        const activities = await cursor.toArray()
        res.send(activities)
      } else {
        res.status(403).send({ message: 'forbidden access' })
      }
    })

    /**
     * http://localhost:5000/api/my_activities?id=${_id}
     *
     * delete activity
     */

    app.delete('/api/my_activities', async (req, res) => {
      const queryId = req.query.id
      const query = { _id: ObjectId(queryId) }
      const result = await activityCollection.deleteOne(query)
      res.send(result)
    })
  } finally {
  }
}
run().catch(console.dir)
