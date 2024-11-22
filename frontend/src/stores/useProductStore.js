import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set) => ({
    products: [],
    loading: false,

    setProducts: (products) => set({ products }),
    createProduct: async (productData) => {
        set({ loading: true });
        try {
            const res = await axios.post("/products", productData);
            console.log(res.data)
            set((prevState) => ({
                products: Array.isArray(prevState.products)
                    ? [...prevState.products, res.data]
                    : [res.data],
                loading: false,
            }));

            toast.success("Product Created Successfully");
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.error);
            set({ loading: false });
        }
    },
    fetchAllProducts: async () => {
        set({ loading: true });
        try {
            const response = await axios.get("/products");
            console.log(response)
            set({ products: response.data.products, loading: false });
        } catch (error) {
            console.log(error)
            set({ error: "Failed to fetch products", loading: false });
            toast.error(error.response.data.error || "Failed to fetch products");
        }
    },
    fetchProductsByCategory: async (category) => {
        set({ loading: true });
        console.log("here")
        try {
            const response = await axios.get(`/products/category/${category}`);
            set({ products: response.data.products, loading: false });
        } catch (error) {
            set({ error: "Failed to fetch products", loading: false });
            toast.error(error.response.data.error || "Failed to fetch products");
        }
    },
    deleteProduct: async (productId) => {
        set({ loading: true });
        try {
            await axios.delete(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.filter((product) => product._id !== productId),
                loading: false,
            }));
            toast.success("Product Deleted Successfully");
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.error || "Failed to delete product");
        }
    },
    toggleFeaturedProduct: async (productId) => {
        set({ loading: true });
        try {
            const response = await axios.patch(`/products/${productId}`);
            // this will update the isFeatured prop of the product
            set((prevProducts) => ({
                products: prevProducts.products.map((product) =>
                    product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
                ),
                loading: false,
            }));
            toast.success("Product Updated Successfully");
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.error || "Failed to update product");
        }
    },
    fetchFeaturedProducts: async () => {
        set({ loading: true });
        try {
            const response = await axios.get("/products/featured");
            set({ products: response.data, loading: false });
        } catch (error) {
            set({ error: "Failed to fetch products", loading: false });
            console.log("Error fetching featured products:", error);
        }
    },
}));