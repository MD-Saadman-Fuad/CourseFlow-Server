const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;


// middleware
app.use(cors());
app.use(express.json())



const uri = process.env.URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Smart server is running')
})


async function run() {
    try {
        await client.connect();

        const db = client.db('courseflowDB');
        const coursesCollection = db.collection('courses');
        const usersCollection = db.collection('users');

        //courses
        
        app.get('/courses', async (req, res) => {
            const cursor = coursesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/courses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const course = await coursesCollection.findOne(query);
            res.send(course);
        });

        app.post('/courses', async (req, res) => {
            const newCourse = req.body;
            const result = await coursesCollection.insertOne(newCourse);
            res.send(result);
        });

        app.delete('/courses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await coursesCollection.deleteOne(query);
            res.send(result);
        });




        //users



        app.get('/users', async (req, res) => {
            const email = req.query.email;
            if (email) {
                const query = { email: email };
                const cursor = usersCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } else {
                const cursor = usersCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            }
        });
        
        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        });

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");




    }
    finally {

    }
}

run().catch(console.dir)

app.listen(port, () => {
    console.log(`Smart server is running on port: ${port}`)
})