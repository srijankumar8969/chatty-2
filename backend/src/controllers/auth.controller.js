import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/utils.utils.js';
import cloudinary from "../lib/cloudinary.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";


export const signup = async (req, res) => {
    // console.log('In signup controller', req.body);
    const { email, password, userName } = req.body;
    try {

        if (!email || !password || !userName) {
            return res.status(400).send('All fields are required');
        }
        //validate password
        if (password.length < 6) {
            return res.status(400).send('Password must be atleast 6 characters');
        }

        //validate email
        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).send('Invalid Email');
        };

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).send('Email already exists');
        }//later we will do a redirection to the login page
        const salt = await bcrypt.genSalt(10); // Add await
        const hash = await bcrypt.hash(password, salt); // Add await
        const newUser = new User({
            email,
            password: hash,
            userName
        });
        console.log('New user created', newUser);
        if (newUser) {
            await newUser.save();
            generateToken(newUser._id, res);
            res.status(201).json({
                _id: newUser._id,
                email: newUser.email,
                userName: newUser.userName
            });
        }
        else {
            res.status(400).send('Invalid user data');
        }
    } catch (error) {
        console.log('Error in signup controller', error.message);
        res.status(500).send('Internal Server Error');
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send(`User not registered`);
        }
        const passwordCheck = await bcrypt.compare(password, user.password);

        if (!passwordCheck) {
            return res.status(400).send('Invalid credentials');
        }
        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            email: user.email,
            userName: user.userName
        });

    } catch (error) {
        console.log('Error in login controller', error.message);
        res.status(500).send('Internal Server Error');
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('jwt');
        res.status(200).send('Logged out successfully');
    }
    catch (error) {
        console.log('Error in logout controller', error.message);
        res.status(500).send('Internal Server Error');
    }
}


export const updateProfile = async (req, res) => {
    //we will try to ensure that if something is there then only that gets updated and rest all remains the same
    try {
        const { profilePic } = req.body;
        console.log('Profile Pic', profilePic);
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!profilePic) {
            return res.status(400).json({ message: "Profile Pic is required" });
        }
        if (user.profilePic) {
            await deleteFromCloudinary(user.profilePic);
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true } //this cause the new object created to be returned
        );
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.log("Error in updateProfile controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



export const updateUserAvatar = async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        return res.status(400).json({ message: "Please provide avatar image" })
    }

    try {
        // Get the current user with their avatar URL
        const currentUser = await User.findById(req.user?._id);
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" })
        }

        // Upload new avatar
        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar?.url) {
            return res.status(400).json({ message: "Failed to upload avatar image" })
        }

        // If upload successful, delete the old profile pic
        if (currentUser.profilePic) {
            try {
                await deleteFromCloudinary(currentUser.profilePic);
            } catch (error) {
                console.log("Error deleting old profile pic:", error);
                // Continue execution even if deletion fails
            }
        }

        // Update user with new profile pic URL
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    profilePic: avatar.url
                }
            },
            { new: true }
        ).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // set new auth cookie and return updated user
        generateToken(user._id, res);
        return res.status(200).json({ message: "User avatar successfully updated", user });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" })

    }
}