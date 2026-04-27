import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import connectDB from '../db/connection.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Ajouter un avis
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { professionalId, rating, comment, serviceId } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Note invalide (1-5)' });
        }

        const database = await connectDB();
        const reviews = database.collection('reviews');
        const users = database.collection('users');

        // Vérifier que le pro existe
        const professional = await users.findOne({ _id: new ObjectId(professionalId) });
        if (!professional) {
            return res.status(404).json({ message: 'Professionnel non trouvé' });
        }

        const review = {
            professionalId: new ObjectId(professionalId),
            clientId: new ObjectId(req.userId),
            rating: parseInt(rating),
            comment: comment || '',
            serviceId: serviceId ? new ObjectId(serviceId) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await reviews.insertOne(review);

        // Mettre à jour la moyenne du professionnel
        await updateProfessionalRating(professionalId);

        res.status(201).json({
            message: 'Avis ajouté avec succès',
            reviewId: result.insertedId
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les avis d'un professionnel
router.get('/professional/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const reviews = database.collection('reviews');

        const reviewsList = await reviews.aggregate([
            { $match: { professionalId: new ObjectId(req.params.id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'clientId',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    rating: 1,
                    comment: 1,
                    createdAt: 1,
                    'client.prenom': 1,
                    'client.nom': 1,
                    'client.profilePhoto': 1,
                    'service.name': 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json(reviewsList);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les avis d'un client
router.get('/my-reviews', verifyToken, async (req, res) => {
    try {
        const database = await connectDB();
        const reviews = database.collection('reviews');

        const myReviews = await reviews.aggregate([
            { $match: { clientId: new ObjectId(req.userId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'professionalId',
                    foreignField: '_id',
                    as: 'professional'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'serviceId',
                    foreignField: '_id',
                    as: 'service'
                }
            },
            { $unwind: { path: '$professional', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    rating: 1,
                    comment: 1,
                    createdAt: 1,
                    'professional.companyName': 1,
                    'professional.prenom': 1,
                    'professional.nom': 1,
                    'professional.profilePhoto': 1,
                    'service.name': 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        res.json(myReviews);
    } catch (error) {
        console.error('Error fetching my reviews:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Modifier un avis
router.put('/update/:id', verifyToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const database = await connectDB();
        const reviews = database.collection('reviews');

        // Vérifier que l'avis appartient au client
        const review = await reviews.findOne({
            _id: new ObjectId(req.params.id),
            clientId: new ObjectId(req.userId)
        });

        if (!review) {
            return res.status(404).json({ message: 'Avis non trouvé' });
        }

        const updateData = { updatedAt: new Date() };
        if (rating) updateData.rating = parseInt(rating);
        if (comment !== undefined) updateData.comment = comment;

        await reviews.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateData }
        );

        // Mettre à jour la moyenne du professionnel
        await updateProfessionalRating(review.professionalId.toString());

        res.json({ message: 'Avis mis à jour' });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Supprimer un avis
router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        const database = await connectDB();
        const reviews = database.collection('reviews');

        const review = await reviews.findOne({
            _id: new ObjectId(req.params.id),
            clientId: new ObjectId(req.userId)
        });

        if (!review) {
            return res.status(404).json({ message: 'Avis non trouvé' });
        }

        await reviews.deleteOne({ _id: new ObjectId(req.params.id) });

        // Mettre à jour la moyenne du professionnel
        await updateProfessionalRating(review.professionalId.toString());

        res.json({ message: 'Avis supprimé' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Fonction helper pour mettre à jour la note moyenne
async function updateProfessionalRating(professionalId) {
    try {
        const database = await connectDB();
        const reviews = database.collection('reviews');
        const users = database.collection('users');

        const stats = await reviews.aggregate([
            { $match: { professionalId: new ObjectId(professionalId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]).toArray();

        if (stats.length > 0) {
            await users.updateOne(
                { _id: new ObjectId(professionalId) },
                {
                    $set: {
                        averageRating: Math.round(stats[0].averageRating * 10) / 10,
                        totalReviews: stats[0].totalReviews
                    }
                }
            );
        } else {
            await users.updateOne(
                { _id: new ObjectId(professionalId) },
                {
                    $set: {
                        averageRating: 0,
                        totalReviews: 0
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error updating professional rating:', error);
    }
}

// Statistiques des avis pour un professionnel
router.get('/stats/:id', async (req, res) => {
    try {
        const database = await connectDB();
        const reviews = database.collection('reviews');

        const stats = await reviews.aggregate([
            { $match: { professionalId: new ObjectId(req.params.id) } },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]).toArray();

        const distribution = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };

        stats.forEach(stat => {
            distribution[stat._id] = stat.count;
        });

        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        const average = total > 0 ? stats.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / total : 0;

        res.json({
            distribution,
            total,
            average: Math.round(average * 10) / 10
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

export default router;
