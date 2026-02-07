import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import express, { Express } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: '*',
        credentials: true,
    })
);


app.use('/', routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

const port = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI!;

async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

connectDatabase();

app.listen(port, () => {
    console.log(`GitHub App backend started on port ${port}`);
});


