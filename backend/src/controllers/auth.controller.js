import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/utils.utils.js';
import cloudinary from "../lib/cloudinary.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../lib/cloudinary.js";
import { sendMail } from "../lib/mailer.js";


export const signup = async (req, res) => {
    const { email, password, userName } = req.body;
    try {

        if (!email || !password || !userName) {
            return res.status(400).send('All fields are required');
        }
        if (password.length < 6) {
            return res.status(400).send('Password must be atleast 6 characters');
        }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).send('Invalid Email');
        };

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).send('Email already exists');
        }

        const existingUsername = await User.findOne({ userName });
        if (existingUsername) {
            return res.status(400).send('Username already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = new User({
            email,
            password: hash,
            userName
        });

        if (!newUser) {
            return res.status(400).send('Invalid user data');
        }

        await newUser.save();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpSalt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, otpSalt);

        newUser.otp = otpHash;
        newUser.otpExpires = Date.now() + 5 * 60 * 1000; 
        newUser.verificationExpiresAt = Date.now() + 5 * 60 * 1000; 
        await newUser.save();

        try {
            await sendMail({
                to: newUser.email,
                subject: 'Verify your Chatty account',
                text: `Your OTP for Chatty signup is: ${otp}. It will expire in 5 minutes.`,
                html: `<p>Your OTP for Chatty signup is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
            });
        } catch (err) {
            console.log('Error sending signup OTP email', err);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Dev OTP for ${newUser.email}: ${otp}`);
                return res.status(201).json({ otpSent: true, email: newUser.email, message: 'OTP logged (dev)', otpDev: otp });
            }
            return res.status(500).send('Failed to send OTP email');
        }
        res.status(201).json({ otpSent: true, email: newUser.email, message: 'OTP sent to your email' });
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

        if (!user.isVerified) {
            return res.status(400).send('Account exists but email is not verified. Please verify your email.');
        }
        const passwordCheck = await bcrypt.compare(password, user.password);

        if (!passwordCheck) {
            return res.status(400).send('Invalid credentials');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        user.otp = otpHash;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        try {
            await sendMail({
                to: user.email,
                subject: 'Your Chatty login OTP',
                text: `Your OTP for Chatty login is: ${otp}. It will expire in 5 minutes.`,
                html: `<p>Your OTP for Chatty login is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
            });
        } catch (err) {
            console.log('Error sending OTP email', err);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Dev OTP for ${user.email}: ${otp}`);
                return res.status(200).json({ otpSent: true, message: 'OTP logged (dev)', otpDev: otp });
            }
            return res.status(500).send('Failed to send OTP email');
        }

        res.status(200).json({ otpSent: true, message: 'OTP sent to registered email' });

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


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).send('Email and OTP are required');

        const user = await User.findOne({ email });
        if (!user || !user.otp) return res.status(400).send('No OTP request found for this user');

        if (user.otpExpires < Date.now()) {
            return res.status(400).send('OTP expired');
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).send('Wrong OTP');
        }

        user.otp = null;
        user.otpExpires = null;
        user.isVerified = true;
        user.verificationExpiresAt = undefined; 
        await user.save();

        generateToken(user._id, res);
        res.status(200).json({ _id: user._id, email: user.email, userName: user.userName });

    } catch (error) {
        console.log('Error in verifyOtp controller', error.message);
        res.status(500).send('Internal Server Error');
    }
};

export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).send('Email is required');

        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('User not found');

        // generate OTP again
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        user.otp = otpHash;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
        user.verificationExpiresAt = Date.now() + 5 * 60 * 1000; // Extend auto-delete timer
        await user.save();

        try {
            await sendMail({
                to: user.email,
                subject: 'Your Chatty login OTP (resend)',
                text: `Your OTP for Chatty login is: ${otp}. It will expire in 5 minutes.`,
                html: `<p>Your OTP for Chatty login is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
            });
        } catch (err) {
            console.log('Error sending OTP email', err);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Dev OTP for ${user.email}: ${otp}`);
                return res.status(200).json({ otpSent: true, message: 'OTP logged (dev)', otpDev: otp });
            }
            return res.status(500).send('Failed to send OTP email');
        }

        res.status(200).json({ otpSent: true, message: 'OTP resent to registered email' });

    } catch (error) {
        console.log('Error in resendOtp controller', error.message);
        res.status(500).send('Internal Server Error');
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