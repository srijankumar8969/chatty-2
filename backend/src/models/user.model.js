import mongoose from "mongoose";

const mongoSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    profilePic: {
        type: String,
        default: ""
    },
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationExpiresAt: {
        type: Date,
        default: Date.now,
        index: { expires: '0s' } 
    }
},
    {
        timestamps: true 
    }
);
const User = mongoose.model('User', mongoSchema);
export default User;