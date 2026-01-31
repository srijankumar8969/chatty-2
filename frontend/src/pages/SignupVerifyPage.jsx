import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";

const SignupVerifyPage = () => {
    const navigate = useNavigate();
    const { pendingOtpEmail, verifyOtp, resendOtp, isVerifyingOtp, isResendingOtp } = useAuthStore();
    const [otpValue, setOtpValue] = useState("");

    useEffect(() => {
        if (!pendingOtpEmail) {
            // nothing to verify, redirect to signup
            navigate('/signup');
        }
    }, [pendingOtpEmail, navigate]);

    const handleVerify = async () => {
        if (!otpValue || otpValue.trim().length === 0) return;
        try {
            await verifyOtp({ email: pendingOtpEmail, otp: otpValue });
            navigate('/');
        } catch (err) {
            // error shown via toast in store
        }
    };

    const handleResend = async () => {
        try {
            await resendOtp(pendingOtpEmail);
        } catch (err) {
            // error shown via toast in store
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex flex-col justify-center items-center p-6 sm:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold">Verify your account</h1>
                        <p className="text-base-content/60">Enter the 6-digit OTP sent to your email to finish signing up.</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-base-200 space-y-4">
                        <p className="text-sm">OTP sent to <strong>{pendingOtpEmail}</strong></p>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">OTP</span>
                            </label>
                            <input
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value)}
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="6-digit code"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleVerify} className="btn btn-primary" disabled={isVerifyingOtp}>
                                {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button onClick={handleResend} className="btn btn-ghost" disabled={isResendingOtp}>
                                {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                            </button>
                        </div>

                        <p className="text-xs text-base-content/60">If you didn't receive the email, check your spam folder or try resending the OTP.</p>

                        <div className="text-center">
                            <p className="text-base-content/60">
                                Already verified? <Link to="/login" className="link link-primary">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AuthImagePattern
                title="Almost there"
                subtitle="Verify your email to complete account creation and start chatting."
            />
        </div>
    );
};

export default SignupVerifyPage;
