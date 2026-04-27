import express from 'express';
import connectDB from '../db/connection.js';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';

const eventRouter = express.Router();

// Require a valid JWT for all event routes and attach req.userId
eventRouter.use(verifyToken);

eventRouter.get('/userEvents', async (req, res) => {
  try {
    const userId = req.userId;

    const db = await connectDB();
    const events = await db.collection('events').find({ userId: userId }).toArray();

    res.status(200).json(events);  // Returns an array of events for the user

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

eventRouter.post('/addEvent', async (req, res) => {
  try {
    const userId = req.userId;
    const { date, hour, name } = req.body;
    if (!date || !hour || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await connectDB();
    const newEvent = {
      userId,
      date,
      hour,
      name,
      createdAt: new Date(),
    };

    const result = await db.collection('events').insertOne(newEvent);
    res.status(201).json({ event: { id: result.insertedId, ...newEvent } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

eventRouter.delete('/deleteEvent', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const db = await connectDB();
    const result = await db.collection('events').deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exemple : Récupérer tous les produits
// router.get('/', async (req, res) => {
//   try {
//     const db = await connectDB();
//     const products = await db.collection('products').find({}).toArray();
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Exemple : Ajouter un produit
// eventRouter.get('/test', async (req, res) => {
//   try {
//     let userId = req.query.userId;

//     // const { name, price, description } = req.body;

//     // if (!name || !price) {
//     //   return res.status(400).json({ error: 'Name and price are required' });
//     // }

//     // const db = await connectDB();
//     // const newProduct = {
//     //   name,
//     //   price,
//     //   description: description || '',
//     //   createdAt: new Date(),
//     // };

//     const result = await db.collection('users').getEvents({ userId: userId }).toArray();
//     // res.status(201).json({ product: { id: result.insertedId, ...newProduct } });

//     res.status(200).json();
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

export default eventRouter;