import {redis} from "../lib/redis.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({})
        res.json({products: products});
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        let featured_products = await redis.get("featured_products");
        if(featured_products) {
            return res.status(200).json(JSON.parse(featured_products));
        }

        // .lean() is gonna return a plain js object instead of mongodb object
        // which is good for performance
        featured_products = Product.find({isFeatured: true}).lean();

        if(!featured_products) {
            return res.status(404).json({
                message: "No featured products found"
            })
        }

        await redis.set("featured_products", JSON.stringify(featured_products));

        res.status(200).json(featured_products);
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

export const createProduct = async (req, res) => {
    try {
        console.log("here")
        const {name, description, price, image, category} = req.body;

        let cloudinaryResponse = null;

        if(image){
            console.log("here2")
            cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products"});
            console.log(cloudinaryResponse);
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
            category
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if(!product){
            return res.status(404).json({
                message: "Product not found"
            })
        }

        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0]

            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Deleted Image")
            } catch (error) {
                console.log("Error deleting image")
            }
        }

        await Product.findByIdAndDelete(req.params.id)

        res.json({
            message: "Product deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: {size: 4}
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ])

        res.json(products)
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

export const getProductsByCategory = async (req, res) => {
    const {category} = req.params
    try {
        const products = await Product.find({category})
        res.json({products: products})
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductCache()

            res.json(updatedProduct);
        } else {
            res.status(404).json({
                message: "Product not found"
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

async function updateFeaturedProductCache(){
    try {
        const featuredProducts = await Product.find({isFeatured: true}).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("error updating cache");
    }
}