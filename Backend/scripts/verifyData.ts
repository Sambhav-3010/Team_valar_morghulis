import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Activity } from '../src/models/Activity';

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        const count = await Activity.countDocuments();
        console.log(`Total Activities: ${count}`);

        const bySource = await Activity.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);
        console.log('Activities by Source:', bySource);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
