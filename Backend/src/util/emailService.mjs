import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.PASSWORD
  }
});

export const sendPasswordResetEmail = async (email, resetLink) => {
  // Verify required environment variables
  if (!process.env.USER || !process.env.PASSWORD) {
    throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_APP_PASSWORD in .env file');
  }

  const mailOptions = {
    from: `"Visa Management System" <${process.env.USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>Best regards,<br>Visa Management System</p>
    `
  };

  try {
    console.log('Attempting to send email with configuration:', {
      host: transporter.options.host,
      port: transporter.options.port,
      user: process.env.USER,
      hasPassword: !!process.env.PASSWORD
    });
    
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email. Please check your email configuration.');
  }
};