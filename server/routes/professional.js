import express from 'express';
import connectDB from '../db/connection.js';

const professionalRouter = express.Router();

// Get featured professionals (public route)
professionalRouter.get('/feature', async (req, res) => {
    try {
        const db = await connectDB();
        const professionals = await db.collection('users').find(
            { isClient: false, isAdmin: { $ne: true }, isSuspended: { $ne: true } },
            { projection: { password: 0 } }
        ).sort({ averageRating: -1, totalReviews: -1 }).limit(6).toArray();
        res.json(professionals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default professionalRouter;