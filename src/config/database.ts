import mongoose from "mongoose";

export const initMongoConnection = async (): Promise<void> => {
    const url = process.env.MONGODB_URI;

    if(!url) {
        throw new Error('MONGODB_URI is not defined in .env file');
    }

    await mongoose.connect(url);

    const db = mongoose.connection;

    db.on('error', (error) => {
        console.error(`Mongo db connection error: ${error}`);
    });

    db.on('disconected', () => {
        console.log('Disconect from db');
    });

    console.log('Connected to db successfully');
}