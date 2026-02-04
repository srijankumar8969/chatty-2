import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 FORCE IPV4 (CRITICAL ON WINDOWS)
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  requireTLS: true,
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
    ciphers: "TLS_AES_128_GCM_SHA256",
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

// verify on startup
(async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP READY (Gmail)");
  } catch (err) {
    console.error("❌ SMTP VERIFY FAILED:", err);
  }
})();

export const sendMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"Chatty" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
