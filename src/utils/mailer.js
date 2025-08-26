import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationCode = async (toEmail, code) => {
  const mailOptions = {
    from: `"Legal Vault" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Legal Vault 2FA Code",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p> <p>This code is valid for only 5 minutes.</p>`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendResetLink = async (toEmail, link) => {
  // Determine if it's a mobile deep link
  const isMobileLink = link.startsWith('legalvaultmobile://');
  
  const mailOptions = {
    from: `"Legal Vault" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    text: `Click the link below to reset your password:\n${link}`,
    html: isMobileLink 
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #173B7E;">Password Reset Request</h2>
          <p>You've requested to reset your password for your Legal Vault mobile account.</p>
          <p><strong>To reset your password:</strong></p>
          <ol>
            <li>Make sure you have the Legal Vault mobile app installed</li>
            <li>Click the button below to open the app and reset your password</li>
          </ol>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #173B7E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password in App</a>
          </div>
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> This link will expire in 15 minutes for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your mobile browser: <br>
            ${link}
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #173B7E;">Password Reset Request</h2>
          <p>You've requested to reset your password for your Legal Vault account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #173B7E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> This link will expire in 15 minutes for security reasons.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link: <br>
            <a href="${link}">${link}</a>
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this password reset, please ignore this email.
          </p>
        </div>
      `,
  };

  return transporter.sendMail(mailOptions);
};
