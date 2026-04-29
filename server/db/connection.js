import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const uriLink = process.env.MONGODB_URI;

const client = new MongoClient(uriLink, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbInstance = null;

async function connectDB() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    dbInstance = client.db('OpenGlow;  // Nom de la DB cohérent
    return dbInstance;
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
    throw error;
  }
}

// Fonction pour fermer la connexion proprement (optionnel, pour les tests ou shutdown)
async function closeDB() {
  if (client) {
    await client.close();
    dbInstance = null;
    console.log("Connexion MongoDB fermée.");
  }
}

export default connectDB;
export { closeDB, uriLink as uri };