import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/User.js";

/* --------------------------------
   EMAIL CONFIGURATION
--------------------------------- */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

/* --------------------------------
   FORGOT PASSWORD
--------------------------------- */

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Generic response prevents account enumeration.
    const genericResponse = {
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate a secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hashed token in MongoDB.
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetURL = `${FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: `"LYRICS WAYYY" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "LYRICS WAYYY - Password Reset",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;background:#15181d;color:#ffffff;border-radius:14px;">
            <h2 style="color:#8c7cf7;">LYRICS WAYYY</h2>

            <h3>Password Reset Request</h3>

            <p>We received a request to reset your password.</p>

            <p>Click the button below to create a new password.</p>

            <a
              href="${resetURL}"
              style="display:inline-block;padding:13px 22px;background:#8c7cf7;color:white;text-decoration:none;border-radius:8px;font-weight:bold;"
            >
              Reset Password
            </a>

            <p style="margin-top:25px;">
              This link expires in 15 minutes.
            </p>

            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Password reset email error:", emailError);

      // Clear the token if sending fails.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request.",
    });
  }
};

/* --------------------------------
   RESET PASSWORD
--------------------------------- */

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password is too long.",
      });
    }

    // Hash the token received from the URL.
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find a user with a valid, unexpired token.
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link.",
      });
    }

    // Hash the new password.
    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate the reset token.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};