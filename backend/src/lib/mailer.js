import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 FORCE IPV4 (CRITICAL ON WINDOWS)
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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
