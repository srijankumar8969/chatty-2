import mongoose from 'mongoose';
export const connectDB= async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI); //await is used to wait for the promise to be resolved
        console.log(`Mongodb Connected ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error occured while making connection to mongodb ${error}`);
    }
};