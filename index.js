const express = require('express')
var cors = require('cors')
const admin = require('firebase-admin')
const serviceAccount = require('./firebase_token.json')
const dotenv = require('dotenv')
dotenv.config()
const app = express()
const port = 3000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndbz4pp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') && authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const decoded = await admin.auth().verifyIdToken(token);
  req.user = decoded; // contains uid, email, etc.
  next()
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // all route here
    const listcollection = client.db("shopX").collection("shopX")
    const categories = client.db("shopX").collection("categories")
    const cart = client.db("shopX").collection("cart")


    app.get('/', verifyFirebaseToken, async (req, res) => {

      if (req.user.email) {
        const cursor = listcollection.find();
        const data = await cursor.toArray()
        res.send(data)
      }

    })

    app.get('/category', async (req, res) => {
      const cursor = categories.find();
      const data = await cursor.toArray()
      res.send(data)
    })

    app.get('/test', (req, res) => {
      res.send("Server is running")
    })

    app.get('/home', verifyFirebaseToken, async (req, res) => {
      const cursor = listcollection.find().limit(16);
      const data = await cursor.toArray()
      res.send(data)
    })


    app.post('/add', verifyFirebaseToken, async (req, res) => {
      const body = req.body;

      // force number type
      const product = {
        ...body,
        price: Number(body.price),
        stock: Number(body.stock),
        rating: Number(body.rating),
        minimumOrderQuantity: Number(body.minimumOrderQuantity),
        discountPercentage: Number(body.discountPercentage)
      };
      const added = await listcollection.insertOne(product)
      res.send(added)
    })

    app.get('/myproducts/:email', verifyFirebaseToken, async (req, res) => {
      if (req.user.email === req.params.email) {
        const email = req.params.email;
        const query = { userEmail: email }
        const result = await listcollection.find(query).toArray();
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })

    })

    app.get('/products/:id', verifyFirebaseToken, async (req, res) => {
      if (req.user.email) {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await listcollection.findOne(query);
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })

    app.get('/category/:slug', verifyFirebaseToken, async (req, res) => {
      if (req.user.email) {
        const slug1 = req.params.slug;
        // console.log(slug)
        const query = { slug: slug1 }
        const result = await listcollection.find(query).toArray();
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })


    app.patch("/api/products/:id/decrement", verifyFirebaseToken, async (req, res) => {
      if (req.user.email) {
        const { id } = req.params;
        const { amount } = req.body;
        const result = await listcollection.updateOne(
          { _id: new ObjectId(id), stock: { $gt: 0 } }, // prevent negative stock
          { $inc: { stock: -amount } });
        // console.log(id, amount)
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })

    app.patch('/update/:id', verifyFirebaseToken, async (req, res) => {
      if (req.user.email) {
        const id = req.params.id;
        const body = req.body;

        // force number type
        const product = {
          ...body,
          price: Number(body.price),
          stock: Number(body.stock),
          rating: Number(body.rating),
          minimumOrderQuantity: Number(body.minimumOrderQuantity),
          discountPercentage: Number(body.discountPercentage)
        };
        const query = { _id: new ObjectId(id) }
        const lookup = await listcollection.findOne(query);
        const updatedDoc = {
          $set: product
        }
        const result = await listcollection.updateOne(lookup, updatedDoc)
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })


    app.post('/cart/add', verifyFirebaseToken, async (req, res) => {
      if (req.user.email) {
        const added = await cart.insertOne(req.body)
        res.send(added)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })

    app.get('/cart/:email', verifyFirebaseToken, async (req, res) => {
      if (req.user.email === req.params.email) {
        const email = req.params.email;
        const query = { userEmail: email }
        const result = await cart.find(query).toArray();
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })



    app.delete('/delete/:id', verifyFirebaseToken, async (req, res) => {
      if (req.user.email) {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result1 = await cart.find(query).toArray();
        const amount = Number(result1[0].orderQuantity);
        const result2 = await listcollection.updateOne(
          { _id: new ObjectId(result1[0].id) },
          { $inc: { stock: amount } });
        const result = await cart.deleteOne(query);
        res.send(result)
      }
      res.status(401).send({ "messsage": "unauthorized" })
    })






  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
