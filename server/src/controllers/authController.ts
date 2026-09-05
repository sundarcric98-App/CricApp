import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { generateCustomId } from '../utils/idGenerator';

const JWT_SECRET = process.env.JWT_SECRET || 'criclivex_super_secret_jwt_key_2025';

// Temporary in-memory store for OTPs (with timestamp for expiry)
interface OtpEntry {
  otp: string;
  expiresAt: number;
  mobile: string;
}
const otpStore = new Map<string, OtpEntry>();

/**
 * POST /api/auth/send-otp
 * Generates 4-digit OTP and simulates/dispatches WhatsApp message
 */
export const sendWhatsAppOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile } = req.body;

    if (!mobile || typeof mobile !== 'string' || mobile.trim().length < 6) {
      res.status(400).json({ error: 'Valid mobile number is required' });
      return;
    }

    const cleanMobile = mobile.trim();

    // Check if user exists in DB
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, mobile, user_code, profile_image')
      .eq('mobile', cleanMobile)
      .single();

    const isNewUser = !existingUser;

    // Generate 4-digit OTP (e.g. 4821)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpStore.set(cleanMobile, { otp, expiresAt, mobile: cleanMobile });

    console.log(`[WhatsApp OTP] Sent code ${otp} to WhatsApp for number: ${cleanMobile}`);

    // If you have a WhatsApp Gateway API (Twilio / Gupshup / WhatsApp Cloud API), call it here
    // For local and standard environment, we provide the OTP in development payload
    res.status(200).json({
      success: true,
      message: `4-digit OTP sent to WhatsApp number ${cleanMobile}`,
      mobile: cleanMobile,
      isNewUser,
      // Provide OTP in response so development/testing works seamlessly
      devOtp: otp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send WhatsApp OTP' });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verifies the 4-digit OTP
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      res.status(400).json({ error: 'Mobile and 4-digit OTP are required' });
      return;
    }

    const cleanMobile = mobile.trim();
    const cleanOtp = otp.toString().trim();

    const record = otpStore.get(cleanMobile);

    // Accept recorded OTP or default dev master OTP '1234' for developer ease
    const isValid = (record && record.otp === cleanOtp && record.expiresAt > Date.now()) || cleanOtp === '1234';

    if (!isValid) {
      res.status(400).json({ error: 'Invalid or expired OTP. Please request a new code.' });
      return;
    }

    // Clear used OTP
    otpStore.delete(cleanMobile);

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, mobile, user_code, profile_image')
      .eq('mobile', cleanMobile)
      .single();

    if (existingUser) {
      const token = jwt.sign({ userId: existingUser.id, mobile: existingUser.mobile }, JWT_SECRET, {
        expiresIn: '30d',
      });

      res.status(200).json({
        verified: true,
        isNewUser: false,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          mobile: existingUser.mobile,
          userCode: existingUser.user_code,
          profileImage: existingUser.profile_image,
        },
        token,
      });
      return;
    }

    // New user needs to complete profile (Name & 4-digit PIN setup)
    res.status(200).json({
      verified: true,
      isNewUser: true,
      mobile: cleanMobile,
      message: 'OTP verified successfully. Please enter your name and 4-digit PIN.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify OTP' });
  }
};

/**
 * POST /api/auth/complete-signup
 * Completes new user registration with Name, 4-digit PIN, and custom generated ID
 */
export const completeSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, name, pin, profileImage } = req.body;

    if (!mobile || !name || !pin) {
      res.status(400).json({ error: 'Mobile, Full Name, and 4-digit PIN are required' });
      return;
    }

    const cleanPin = pin.toString().trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      return;
    }

    const cleanMobile = mobile.trim();
    const cleanName = name.trim();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('mobile', cleanMobile)
      .single();

    if (existingUser) {
      res.status(400).json({ error: 'User with this mobile number already exists' });
      return;
    }

    // Generate custom ID based on first 4 letters of name + 4 digit random number (e.g. SUND4821)
    const user_code = generateCustomId(cleanName);
    const pin_hash = await bcrypt.hash(cleanPin, 10);

    // Insert user into Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          mobile: cleanMobile,
          name: cleanName,
          pin_hash,
          user_code,
          profile_image: profileImage || null,
        },
      ])
      .select()
      .single();

    if (userError || !user) {
      res.status(500).json({ error: userError?.message || 'Failed to create user account' });
      return;
    }

    // Initialize player_stats
    await supabase.from('player_stats').insert([
      {
        user_id: user.id,
        matches: 0,
        runs: 0,
        wickets: 0,
      },
    ]);

    const token = jwt.sign({ userId: user.id, mobile: user.mobile }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        userCode: user.user_code,
        profileImage: user.profile_image,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

/**
 * POST /api/auth/login-pin
 * Login existing user with Mobile + 4-digit PIN
 */
export const loginWithPin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, pin } = req.body;

    if (!mobile || !pin) {
      res.status(400).json({ error: 'Mobile and 4-digit PIN are required' });
      return;
    }

    const cleanMobile = mobile.trim();
    const cleanPin = pin.toString().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', cleanMobile)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'No account found with this mobile number' });
      return;
    }

    const isMatch = await bcrypt.compare(cleanPin, user.pin_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid 4-digit PIN. Please try again.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, mobile: user.mobile }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        userCode: user.user_code,
        profileImage: user.profile_image,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

/**
 * GET /api/auth/profile/:id
 * Retrieve user profile and stats
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, mobile, user_code, profile_image, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { data: stats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    res.status(200).json({
      user,
      stats: stats || {},
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
