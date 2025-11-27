const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3001;


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
            try {
                const idParam = req.params.id;
                console.log('Requested course ID:', idParam);
                let query;
                if (ObjectId.isValid(idParam)) {
                    query = { _id: new ObjectId(idParam) };
                } else if (!isNaN(Number(idParam))) {
                    query = { _id: Number(idParam) };
                } else {
                    return res.status(400).send({ error: 'Invalid id format' });
                }

                const course = await coursesCollection.findOne(query);
                if (!course) return res.status(404).send({ error: 'Course not found' });
                res.send(course);
            } catch (err) {
                console.error('Error fetching course:', err);
                res.status(500).send({ error: 'Internal Server Error' });
            }
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

        app.put('/users/:email/courses', async (req, res) => {
            try {
                console.log('PUT /users/:email/courses', { params: req.params, body: req.body });

                // Defensive: collection must be set
                if (!usersCollection) {
                    console.error('usersCollection is not initialized');
                    return res.status(503).json({ message: 'Server DB not ready' });
                }

                const email = req.params.email;
                const { action, courseId } = req.body;
                if (!email || !action || !courseId) return res.status(400).json({ message: 'Missing params' });

                // Normalize courseId: if you use ObjectId in DB, convert safely
                let courseIdentifier = courseId;
                if (typeof courseId === 'string' && ObjectId.isValid(courseId)) {
                    courseIdentifier = new ObjectId(courseId);
                }
                // If your DB stores course ids as plain strings, keep courseIdentifier as string.

                if (action === 'add') {
                    const result = await usersCollection.findOneAndUpdate(
                        { email },
                        { $addToSet: { courses: courseIdentifier } }, // store id consistently
                        { returnDocument: 'after', upsert: true }
                    );
                    return res.json({ ok: true, user: result.value });
                } else if (action === 'remove') {
                    const result = await usersCollection.findOneAndUpdate(
                        { email },
                        { $pull: { courses: courseIdentifier } },
                        { returnDocument: 'after' }
                    );
                    return res.json({ ok: true, user: result.value });
                } else {
                    return res.status(400).json({ message: 'Invalid action' });
                }
            } catch (err) {
                console.error('ERROR in PUT /users/:email/courses', err);
                console.error('Request details:', { params: req.params, body: req.body });
                return res.status(500).json({ message: err.message || 'Server error' });
            }
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