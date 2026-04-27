import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
    try {
        // Create a transporter using SMTP settings from environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_FROM || '"MyPlanning" <noreply@myplanning.com>',
            to: options.email,
            subject: options.subject,
            html: options.html, // HTML body content
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        // We log the error but don't crash, so the user registration can still succeed if email fails
        return null;
    }
};
