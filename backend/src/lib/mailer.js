import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async ({ to, subject, html, text }) => {
    try {
        const data = await resend.emails.send({
            from: 'Chatty <onboarding@resend.dev>', // Update this with your verified domain if available
            to,
            subject,
            html: html || text, // Resend prefers HTML, fallback to text if HTML not provided. 
        });

        return data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};