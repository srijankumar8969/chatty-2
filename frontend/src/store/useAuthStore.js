import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";// this is used t give feedbacks in what you have done
import { io } from "socket.io-client";//not taught yet
import axios from "axios";
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const useAuthStore = create((set, get) => ({ //create is  used to create a store
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [], //this is to check whether the user is online or not//no this is something else
  socket: null,
  // OTP flow state
  pendingOtpEmail: null,
  isVerifyingOtp: false,
  isResendingOtp: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      console.log("checkAuth response:", res.data);
      set({ authUser: res.data }); //this is the user object and 
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    const { userName, email, password } = data; // Rename fullName to username
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post(`/auth/signup`, {
        userName,
        email,
        password
      });

      // If server requests OTP verification for signup
      if (res.data?.otpSent) {
        set({ pendingOtpEmail: res.data.email });
        toast.success("OTP sent to your email. Check your inbox to verify your account.");
        return res.data;
      }

      // legacy behavior (if server returns user)
      if (res.data && res.data._id) {
        set({ authUser: res.data });
        toast.success("Account created successfully");
        get().connectSocket();
        return res.data;
      }

      return res.data;
    } catch (error) {
      const msg = error?.response?.data || "Error creating account";
      toast.error(msg);
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      if (res.data?.otpSent) {
        // OTP step required
        set({ pendingOtpEmail: data.email });
        toast.success("OTP sent to your email. Check your inbox.");
      } else {
        set({ authUser: res.data });
        toast.success("Logged in successfully");
        get().connectSocket();
      }
    } catch (error) {
      const msg = error?.response?.data || "Error logging in";
      toast.error(msg);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  verifyOtp: async ({ email, otp }) => {
    set({ isVerifyingOtp: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
      set({ authUser: res.data, pendingOtpEmail: null });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      const msg = error?.response?.data || "Invalid OTP";
      toast.error(msg);
      throw error;
    } finally {
      set({ isVerifyingOtp: false });
    }
  },

  resendOtp: async (email) => {
    set({ isResendingOtp: true });
    try {
      await axiosInstance.post("/auth/resend-otp", { email });
      toast.success("OTP resent to your email.");
    } catch (error) {
      const msg = error?.response?.data || "Failed to resend OTP";
      toast.error(msg);
      throw error;
    } finally {
      set({ isResendingOtp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, pendingOtpEmail: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    console.log(data);
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateProfilepic: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      let res;

      // If the payload contains a base64 'profilePic' string, use the JSON PUT endpoint
      if (typeof data?.profilePic === "string") {
        res = await axiosInstance.put("/auth/update-profile", { profilePic: data.profilePic });
      } else {
        // Assume FormData/file upload and send multipart to upload-avatar
        const form = data instanceof FormData ? data : new FormData();
        // If caller passed a File object as `file` or `avatar`, append it
        if (!form.has("avatar")) {
          if (data?.file) form.append("avatar", data.file);
          else if (data?.avatar) form.append("avatar", data.avatar);
        }
        res = await axiosInstance.patch("/auth/upload-avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
