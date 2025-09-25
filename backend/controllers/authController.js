//authController.js

import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';
import { sendSuccess, sendError } from '../helpers/responseHelpers.js';
import { generateAndHashOTP, verifyOTP } from '../helpers/otpHelpers.js';
import { setAuthCookie, clearAuthCookie } from '../helpers/cookieHelpers.js';
import { registerValidation, loginValidation, validate } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js'; // Import authMiddleware

const pendingUsers = new Map();
// Register
export const register = [
    registerValidation,
    validate,
    asyncHandler(async (req, res) => {
        const { name, email, password } = req.body;

        // Check for existing user by email
        const existingUserByEmail = await userModel.findOne({ email });
        if (existingUserByEmail) {
            return sendError(res, 'User with this email already exists', 400);
        }

        // Check for existing user by name
        const existingUserByName = await userModel.findOne({ name });
        if (existingUserByName) {
            return sendError(res, 'User with this name already exists', 400);
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const { otp, hashedOtp } = await generateAndHashOTP();

            pendingUsers.set(email, {
                name,
                email,
                password: hashedPassword,
                verifyOtp: hashedOtp,
                verifyOtpExpireAt: Date.now() + 24 * 60 * 60 * 1000
            });

            const otpMailOption = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: 'Account Verification OTP',
                html: EMAIL_VERIFY_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', email),
            };

            transporter.sendMail(otpMailOption)
            .then(() => console.log('OTP email sent'))
            .catch((err) => console.error('Error sending OTP email:', err));

            sendSuccess(res, {}, 'OTP sent to email. Please verify your account.', 201);
            
        } catch (error) {
            console.error('Registration error:', error);
            if (error.code === 11000) {
                return sendError(res, 'Username or email already exists', 400);
            }
            return sendError(res, 'Registration failed: ' + error.message, 500);
        }
    }),
];

// Login
export const login = [
  loginValidation,
  validate,
  asyncHandler(async (req, res) => {
      const { email, password } = req.body;

      try {
          const user = await userModel.findOne({ email });
          if (!user) {
              return sendError(res, 'Invalid email or password', 400);
          }
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
              return sendError(res, 'Invalid email or password', 400);
          }

          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
          setAuthCookie(res, token);

         
          sendSuccess(res, { 
              user: {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  isAccountVerified: user.isAccountVerified
              }
          }, 'Login successful');
      } catch (error) {
          console.error('Login error:', error);
          return sendError(res, 'Server error during login', 500);
      }
  }),
];


// Logout
export const logout = asyncHandler(async (req, res) => {
    clearAuthCookie(res);

    sendSuccess(res, {}, 'Logged Out');
});

// Send Verify OTP
export const sendVerifyOtp = [
    protect,
    asyncHandler(async (req, res) => {
        const userId = req.user._id; // Get userId from req.user
        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return sendError(res, 'Account Already verified', 400);
        }

        const { otp, hashedOtp } = await generateAndHashOTP();

        user.verifyOtp = hashedOtp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            html: EMAIL_VERIFY_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', user.email),
        };

        try {
            await transporter.sendMail(welcomeMailOptions);
            console.log('Welcome email sent successfully');
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }

        try {
            await transporter.sendMail(otpMailOption);
            console.log('OTP email sent successfully');
        } catch (error) {
            console.error('Error sending OTP email:', error);
        }

        sendSuccess(res, {}, 'Verification OTP Sent on Email');
    }),
];

// Verify Email using OTP
export const verifyEmail = [asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
        const pendingUser = pendingUsers.get(email);
        if (!pendingUser) {
            return sendError(res, 'No pending registration found', 404);
        }

    // Verify OTP
    const isOtpValid = await verifyOTP(otp, pendingUser.verifyOtp);
    if (!isOtpValid) {
        return sendError(res, 'Invalid OTP', 400);
    }

    // Check if OTP expired
    const user = new userModel({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            isAccountVerified: true
        });
    await user.save();
    pendingUsers.delete(email)
   


        const welcomeMailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Welcome to PlantZ',
            text: `Welcome to PlantZ website. Your account has been created with email id: ${user.email}`,
        };

        try {
            await transporter.sendMail(welcomeMailOptions);
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
         clearAuthCookie(res); 
         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        setAuthCookie(res, token); 
        sendSuccess(res, {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAccountVerified: user.isAccountVerified
            }
        }, 'Email verified and account created successfully');
    }),
];


// Check if user is authenticated
export const isAuthenticated = [
    protect,
    asyncHandler(async (req, res) => {
        sendSuccess(res, { user: req.user }); // Send user data
    }),
];

// Send Password Reset OTP
// Updated sendResetOtp function
export const sendResetOtp = asyncHandler(async (req, res) => {
    // Changed from req.query to req.body since form data usually comes in body
    const { email } = req.body; 
    
    if (!email) {
        return sendError(res, 'Email is required', 400);
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        return sendError(res, 'User not found', 404);
    }

    const { otp, hashedOtp } = await generateAndHashOTP();
    user.resetOtp = hashedOtp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    const mailOption = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Password Reset OTP',
        html: PASSWORD_RESET_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', user.email),
    };

    try {
        await transporter.sendMail(mailOption);
        sendSuccess(res, {}, 'OTP sent to your email');
    } catch (error) {
        console.error('Error sending reset OTP email:', error);
        sendError(res, 'Error sending email', 500);
    }
});

// Reset user Password
export const resetPassword = asyncHandler(async (req, res) => {
    console.log("Request Body:", req.body); // Add this line
    const { otp, newPassword, email } = req.body; // Get email from body

    if (!otp || !newPassword || !email) {
        return sendError(res, 'OTP, new password, and email are required', 400);
    }

    const user = await userModel.findOne({ email });
    if (!user) {
        return sendError(res, 'User not found', 404);
    }

    const isOtpValid = await verifyOTP(otp, user.resetOtp);
    if (!isOtpValid) {
        return sendError(res, 'Invalid OTP', 400);
    } 

    if (user.resetOtpExpireAt < Date.now()) {
        return sendError(res, 'OTP Expired', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    await user.save();

    sendSuccess(res, {}, 'Password has been reset successfully');
});
