const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('Attempting to send password reset email to:', email);

    // Log SMTP configuration (excluding sensitive data)
    const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER ? '(set)' : '(not set)',
        pass: process.env.SMTP_PASS ? '(set)' : '(not set)'
    };
    console.log('SMTP Configuration:', smtpConfig);

    // Construct reset URL based on environment
    const clientUrl = process.env.CLIENT_URL || 'https://lies-client.onrender.com';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Chat Support" <noreply@chat.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #7C4DFF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <p>Best regards,<br>Chat Support Team</p>
        `
    };

    try {
        console.log('Sending email with options:', {
            ...mailOptions,
            html: '(html content)'  // Don't log the actual HTML content
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        // Log detailed error information
        console.error('Email sending error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
            message: error.message
        });

        throw new Error(`Failed to send password reset email: ${error.message}`);
    }
};

module.exports = {
    sendPasswordResetEmail
};