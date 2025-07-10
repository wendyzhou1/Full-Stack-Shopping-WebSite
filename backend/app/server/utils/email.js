// utils/email.js
/**
 * Use Mailjet
 * If mail number not enough, plz change api
 */
const Mailjet = require('node-mailjet');

// Initialize Mailjet client
// !!! Better to update KEY, use your own KEY
// For security reasons, you'd better add a configuration file and reference the variables of the configuration file below
const mailjet = Mailjet.apiConnect(
    //choose your own api here
);

// !!! If you update KEY, update EMAIL FROM.
const config = {
    EMAIL_FROM: 'old@deal.com',//choose your own email here
    EMAIL_FROM_NAME: 'Old Phone Deals'
};

// Helper function to send emails
const sendEmail = async (emailData) => {
    try {
        const request = await mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [{
                    From: {
                        Email: config.EMAIL_FROM,
                        Name: config.EMAIL_FROM_NAME
                    },
                    To: [{ Email: emailData.to }],
                    Subject: emailData.subject,
                    HTMLPart: emailData.html
                }]
            });

        console.log('Email sent successfully:', request.body);
        return true;
    } catch (error) {
        console.error('Mailjet Error:', error.statusCode, error.message);
        throw new Error('Failed to send email');
    }
};

exports.sendVerificationEmail = async (email, url) => {
    const emailData = {
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <p>Please click the link below to verify your email address:</p>
            <p style="margin: 20px 0;">
                <a href="${url}" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                ">Verify Email</a>
            </p>
            <p>If you didn't create an account, please ignore this email.</p>
        `
    };

    return sendEmail(emailData);
};

exports.sendPasswordResetEmail = async (to, url) => {
    const emailData = {
        to: to,
        subject: 'Password Reset Request',
        html: `
            <h2 style="color: #2d3748;">Password Reset Instructions</h2>
            <p>Click the button below to reset your password:</p>
            <div style="margin: 25px 0;">
                <a href="${url}" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #4299e1;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                ">Reset Password</a>
            </div>
            <div style="color: #718096; font-size: 14px;">
                <p>This link will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    return sendEmail(emailData);
};

exports.sendPasswordChangeConfirmationEmail = async (to) => {
    const emailData = {
        to: to,
        subject: 'Password Change Confirmation',
        html: `
            <h2 style="color: #2d3748;">Your Password Has Been Changed</h2>
            <p>This is a confirmation that the password for your account has been successfully changed.</p>
            <div style="color: #718096; font-size: 14px; margin-top: 20px;">
                <p>If you did not make this change, please contact our support team immediately.</p>
            </div>
        `
    };
    return sendEmail(emailData);
};