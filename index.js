const express = require('express')
var cors = require('cors')
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



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // all route here
    const listcollection = client.db("shopX").collection("shopX")
    const categories = client.db("shopX").collection("categories")

    app.get('/', async (req, res) => {
      const cursor = listcollection.find();
      const data = await cursor.toArray()
      res.send(data)
    })

    app.get('/category', async (req, res) => {
      const cursor = categories.find();
      const data = await cursor.toArray()
      res.send(data)
    })

    app.get('/test',  (req, res) => {
      res.send("Server is running")
    })

    // app.get('/home', async (req, res) => {
    //   const cursor = listcollection.find({availability : true}).limit(6);
    //   const data = await cursor.toArray()
    //   res.send(data)
    // })
    

    app.post('/add', async (req, res) => {
      const added = await listcollection.insertOne(req.body)
      res.send(added)
    })

    app.get('/myproducts/:email', async (req, res) => {
      const email = req.params.email;
      const query = {userEmail: email}
      const result = await listcollection.find(query).toArray();
      res.send(result)
    })

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id : new ObjectId(id)}
      const result = await listcollection.findOne(query);
      res.send(result)
    })

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id : new ObjectId(id)}
      const result = await listcollection.findOne(query);
      res.send(result)
    })



    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await listcollection.deleteOne(query);
      res.send(result)
    })



    app.patch('/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const lookup = await listcollection.findOne(query);
      const updatedDoc = {
        $set : req.body
      }
      const result = await listcollection.updateOne(lookup, updatedDoc)
      res.send(result)
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
