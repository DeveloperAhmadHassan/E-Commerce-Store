import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoute from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import productRoute from "./routes/product.route.js";
import cartRoute from "./routes/cart.route.js";
import couponRoute from "./routes/coupon.route.js";
import paymentRoute from "./routes/payment.route.js";
import analyticsRoute from "./routes/analytics.route.js";
import path from "path"; // Fixed import for 'path'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

const corsOptions = {
    origin: 'http://localhost:5173', // Frontend origin
    credentials: true, // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Define API routes
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/coupons", couponRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/analytics", analyticsRoute);

// Serve the frontend in production
if (process.env.NODE_ENV === "production") {
    // Correct path to 'frontend/dist' for Vite build
    app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

    // Serve the React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);

    connectDB().then(r => {
        console.log(`Connected to MongoDB: ${r.connection.host}`);
    });
});
