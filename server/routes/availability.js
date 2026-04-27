import express from 'express';
import { ObjectId } from 'mongodb';
import connectDB from '../db/connection.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get availability settings for a professional
router.get('/settings/:professionalId', async (req, res) => {
    try {
        const { professionalId } = req.params;
        const db = await connectDB();

        let settings = await db.collection('availability_settings').findOne({
            professionalId: new ObjectId(professionalId)
        });

        if (!settings) {
            // Default settings
            settings = {
                professionalId: new ObjectId(professionalId),
                workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
                hours: { start: '09:00', end: '19:00' },
                slotDuration: 60, // minutes
                breakStart: '12:00',
                breakEnd: '14:00'
            };
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching availability settings:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Update availability settings
router.post('/settings', verifyToken, async (req, res) => {
    try {
        const { workingDays, hours, slotDuration, breakStart, breakEnd } = req.body;
        const professionalId = req.userId;

        const db = await connectDB();

        const updateData = {
            professionalId: new ObjectId(professionalId),
            workingDays,
            hours,
            slotDuration: parseInt(slotDuration),
            breakStart,
            breakEnd,
            updatedAt: new Date()
        };

        await db.collection('availability_settings').updateOne(
            { professionalId: new ObjectId(professionalId) },
            { $set: updateData },
            { upsert: true }
        );

        res.json({ message: 'Paramètres mis à jour', settings: updateData });
    } catch (error) {
        console.error('Error updating availability settings:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Get available slots for a specific date
router.get('/slots/:professionalId', async (req, res) => {
    try {
        const { professionalId } = req.params;
        const { date } = req.query; // YYYY-MM-DD

        if (!date) return res.status(400).json({ message: 'Date requise' });

        const db = await connectDB();

        // 1. Get settings
        const settings = await db.collection('availability_settings').findOne({
            professionalId: new ObjectId(professionalId)
        }) || {
            workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
            hours: { start: '09:00', end: '19:00' },
            slotDuration: 60,
            breakStart: '12:00',
            breakEnd: '14:00'
        };

        // 2. Check if working day
        const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        if (!settings.workingDays.includes(capitalizedDay)) {
            return res.json([]);
        }

        // 3. Generate all possible slots
        const slots = [];
        let currentTime = settings.hours.start;
        const endTime = settings.hours.end;

        while (currentTime < endTime) {
            // Check if in break time
            if (currentTime >= settings.breakStart && currentTime < settings.breakEnd) {
                // Skip break
                currentTime = addMinutes(currentTime, settings.slotDuration);
                continue;
            }

            // Check existing bookings (professionalId is stored as string in bookings)
            const existingBooking = await db.collection('bookings').findOne({
                professionalId: professionalId,
                date: date,
                time: currentTime,
                status: { $ne: 'cancelled' }
            });

            slots.push({
                time: currentTime,
                available: !existingBooking
            });

            currentTime = addMinutes(currentTime, settings.slotDuration);
        }

        res.json(slots);
    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Helper for time calculation
function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default router;
