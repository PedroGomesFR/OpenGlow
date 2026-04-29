import { Resend } from 'resend';

export const sendEmail = async (options) => {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: process.env.SMTP_FROM || 'OpenGlow <onboarding@resend.dev>',
            to: options.email,
            subject: options.subject,
            html: options.html,
        });

        if (error) {
            console.error("Error sending email:", error);
            return null;
        }

        console.log("Email sent successfully:", data.id);
        return data;
    } catch (error) {
        console.error("Error sending email:", error);
        return null;
    }
};

