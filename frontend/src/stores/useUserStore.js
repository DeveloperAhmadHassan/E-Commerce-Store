import {create} from "zustand";
import {toast} from "react-hot-toast";
import axios from "../lib/axios.js";

export const useUserStore = create((set, get)=>({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({name, email, password, confirmPassword, navigate}) => {
        set({loading: true});

        if(password !== confirmPassword){
            set({loading: false});
            return toast.error("Passwords do not match");
        }

        try {
            const res = await axios.post("/auth/signup", {name, email, password, confirmPassword})
            set({user: res.data.user, loading: false});
            navigate("/login");
            return toast.success( "Account created successfully");
        } catch (error) {
            set({loading: false});
            console.log(error.response.data.message);
            return toast.error(error.response.data.message || "An error occurred");
        }
    },
    login: async (email, password, navigate) => {
        set({loading: true});

        try {
            const res = await axios.post("/auth/login", {email, password})
            set({user: res.data, loading: false});
            navigate("/");
            return toast.success( "Logged In successfully");
        } catch (error) {
            set({loading: false});
            console.log(error.response.data.message);
            return toast.error(error.response.data.message || "An error occurred");
        }
    },
    checkAuth: async () => {
        set({ checkingAuth: true });
        try {
            const response = await axios.get("/auth/profile");
            set({ user: response.data, checkingAuth: false });
        } catch (error) {
            console.log(error.message);
            set({ checkingAuth: false, user: null });
        }
    },
    logout: async (navigate) => {
        try {
            await axios.post("/auth/logout");
            set({ user: null });
            navigate("/login");
            return toast.success( "Logged Out successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred during logout");
        }
    },
    refreshToken: async () => {
        // Prevent multiple simultaneous refresh attempts
        if (get().checkingAuth) return;

        set({ checkingAuth: true });
        try {
            const response = await axios.post("/auth/refresh-token");
            set({ checkingAuth: false });
            return response.data;
        } catch (error) {
            set({ user: null, checkingAuth: false });
            throw error;
        }
    },
}));

let refreshPromise = null;

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // If a refresh is already in progress, wait for it to complete
                if (refreshPromise) {
                    await refreshPromise;
                    return axios(originalRequest);
                }
                // Start a new refresh process
                refreshPromise = useUserStore.getState().refreshToken();
                await refreshPromise;
                refreshPromise = null;

                return axios(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or handle as needed
                await useUserStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);