import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {redis} from "../lib/redis.js";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    })

    return {accessToken, refreshToken};
}

const storeRefreshToken = async(userId, refreshToken) => {
    await redis.set(`refreshToken:${userId}`, refreshToken, "EX", 7*24*60*60)
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, // prevent XSS attacks, cross site scripting attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", //prevents CSRF attack, cross-site request forgery attack
        maxAge: 15*60*1000
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // prevent XSS attacks, cross site scripting attack
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", //prevents CSRF attack, cross-site request forgery attack
        maxAge: 7*24*60*60*1000
    })
}

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try{
        const userExists = await User.findOne({email})

        if(userExists){
            return res.status(400).json({
                message:"User already exists"
            })
        }

        const user = await User.create({name, email, password})

        const {accessToken, refreshToken} = generateTokens(user._id)
        await storeRefreshToken(user._id, refreshToken)

        setCookies(res, accessToken, refreshToken)

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        })
    } catch (e) {
        res.status(500).json({
            message:e.message,
        })
    }

}

export const login = async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await User.findOne({email})

        if(user && (await user.comparePassword(password))){
            const {accessToken, refreshToken} = generateTokens(user._id)

            await storeRefreshToken(user._id, refreshToken)

            setCookies(res, accessToken, refreshToken)

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            })

        } else {
            res.status(401).json({
                message: "Invalid email or password"
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}

export const logout = async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken){
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken:${decoded.userId}`)
        }

        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")

        res.json({message: "Logged Out Successfully"})
    } catch (error){
        res.status(500).json({
            message: "Server Error",
            error: error.message
        })
    }
}

export const refreshToken = async (req, res) => {
    try{
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken){
            return res.status(401).json({
                message: "Refresh token not found"
            })
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`)

        if(storedToken !== refreshToken){
            return res.status(401).json({
                message: "Invalid Refresh token"
            })
        }

        const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"})

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7*24*60*60*60
        })

        res.json({
            message: "Token refreshed successfully"
        })
    } catch (error) {
        res.status(500).json({
            message: `Server Error`,
            error: error.message
        })
    }
}

export const getProfile = (req, res) => {
    try {
        res.json(req.user);
    } catch(error) {
        res.status(500).json({
            message: `Server Error`,
            error: error.message
        })
    }
}