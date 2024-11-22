import mongoose from 'mongoose'

export const connectDB = async () =>{
    try {
        return await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.log(`Error connecting to MongoDB: ${error.message}`)
        process.exit(1);
    }
}