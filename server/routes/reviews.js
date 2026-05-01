import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import connectDB from '../db/connection.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Ajouter un avis
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { professionalId, rating, comment, serviceId, bookingId } = req.body;

        if (!professionalId) {
            return res.status(400).json({ message: 'Professionnel requis' });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Note invalide (1-5)' });
        }

        const database = await connectDB();
        const reviews = database.collection('reviews');
        const users = database.collection('users');
        const bookings = database.collection('bookings');

        // Vérifier que le pro existe
        const professional = await users.findOne({ _id: new ObjectId(professionalId) });
        if (!professional) {
            return res.status(404).json({ message: 'Professionnel non trouvé' });
        }

        let eligibleBooking = null;

        if (bookingId) {
            eligibleBooking = await bookings.findOne({
                _id: new ObjectId(bookingId),
                clientId: req.userId,
                professionalId,
                status: 'completed'
            });

            if (!eligibleBooking) {
                return res.status(403).json({ message: 'Aucune prestation terminée éligible pour cet avis' });
            }

            const existingReview = await reviews.findOne({
                bookingId: new ObjectId(bookingId),
                clientId: new ObjectId(req.userId)
            });

            if (existingReview) {
                return res.status(409).json({ message: 'Un avis existe déjà pour cette prestation' });
            }
        } else {
            const bookingFilter = {
                clientId: req.userId,
                professionalId,
                status: 'completed'
            };

            if (serviceId) {
                bookingFilter.serviceId = serviceId;
            }

            eligibleBooking = await bookings.findOne(bookingFilter, {
                sort: { updatedAt: -1, date: -1, time: -1 }
            });

            if (!eligibleBooking) {
                return res.status(403).json({ message: 'Vous devez terminer une prestation avec ce salon avant de laisser un avis' });
            }

            const existingReview = await reviews.findOne({
                bookingId: new ObjectId(eligibleBooking._id),
                clientId: new ObjectId(req.userId)
            });

            if (existingReview) {
                return res.status(409).json({ message: 'Un avis existe déjà pour cette prestation' });
            }
        }

        const effectiveServiceId = eligibleBooking?.serviceId || serviceId || null;

        const review = {
            professionalId: new ObjectId(professionalId),
            clientId: new ObjectId(req.userId),
            rating: parseInt(rating),
            comment: comment || '',
            serviceId: effectiveServiceId ? new ObjectId(effectiveServiceId) : null,
            bookingId: eligibleBooking?._id ? new ObjectId(eligibleBooking._id) : null,
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
                    _id: 1,
                    clientId: 1,
                    serviceId: 1,
                    bookingId: 1,
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
                    _id: 1,
                    professionalId: 1,
                    serviceId: 1,
                    bookingId: 1,
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

// Vérifier si un client peut laisser un avis pour un professionnel
router.get('/eligibility/:professionalId', verifyToken, async (req, res) => {
    try {
        const { professionalId } = req.params;

        if (!ObjectId.isValid(professionalId)) {
            return res.status(400).json({ message: 'Professionnel invalide' });
        }

        const database = await connectDB();
        const bookings = database.collection('bookings');
        const reviews = database.collection('reviews');

        const completedBookings = await bookings.find({
            clientId: req.userId,
            professionalId,
            status: 'completed'
        }).sort({ updatedAt: -1, date: -1, time: -1 }).toArray();

        const bookingIds = completedBookings.map((booking) => booking._id);
        const existingReviews = bookingIds.length > 0
            ? await reviews.find({
                clientId: new ObjectId(req.userId),
                professionalId: new ObjectId(professionalId),
                bookingId: { $in: bookingIds }
            }).project({ bookingId: 1 }).toArray()
            : [];

        const reviewedBookingIds = new Set(
            existingReviews
                .map((review) => review.bookingId?.toString())
                .filter(Boolean)
        );

        const eligibleBookings = completedBookings.filter(
            (booking) => !reviewedBookingIds.has(booking._id.toString())
        );

        const nextBooking = eligibleBookings[0]
            ? {
                bookingId: eligibleBookings[0]._id.toString(),
                serviceId: eligibleBookings[0].serviceId || null,
                serviceName: eligibleBookings[0].serviceName || null,
                date: eligibleBookings[0].date,
                time: eligibleBookings[0].time,
            }
            : null;

        res.json({
            canLeaveReview: eligibleBookings.length > 0,
            totalCompletedBookings: completedBookings.length,
            reviewedCompletedBookings: completedBookings.length - eligibleBookings.length,
            nextBooking,
        });
    } catch (error) {
        console.error('Error checking review eligibility:', error);
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
