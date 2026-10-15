import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { isConnectedToMySQL, mysqlPool, memoryStore, saveStore, generateNextPartnerId } from '../db.js';

// Register a new partner
export async function registerPartner(req: Request, res: Response) {
  try {
    const { full_name, email, mobile_number, password, confirm_password, terms_accepted, profile_image } = req.body;

    // Field validations
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Full name is required (minimum 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A valid email address is required.' });
      return;
    }

    if (!mobile_number || typeof mobile_number !== 'string' || mobile_number.trim().length < 8) {
      res.status(400).json({ success: false, message: 'A valid mobile contact number is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirm_password) {
      res.status(400).json({ success: false, message: 'Passwords do not match.' });
      return;
    }

    if (!terms_accepted) {
      res.status(400).json({ success: false, message: 'You must accept the Terms and Conditions and Privacy Policy.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile_number.trim();
    const cleanName = full_name.trim();

    // Check duplicate email
    if (isConnectedToMySQL && mysqlPool) {
      const [existing]: any = await mysqlPool.execute('SELECT id FROM partners WHERE email = ? LIMIT 1', [cleanEmail]);
      if (existing && existing.length > 0) {
        res.status(409).json({ success: false, message: 'This email address is already registered.' });
        return;
      }

      const partnerIdCode = await generateNextPartnerId();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const [result]: any = await mysqlPool.execute(
        `INSERT INTO partners (partner_id, full_name, email, mobile_number, password_hash, profile_image, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
        [partnerIdCode, cleanName, cleanEmail, cleanMobile, passwordHash, profile_image || null]
      );

      res.status(201).json({
        success: true,
        message: 'Registration submitted successfully! Your account is pending admin approval.',
        partner: {
          id: result.insertId,
          partner_id: partnerIdCode,
          full_name: cleanName,
          email: cleanEmail,
          status: 'PENDING',
        },
      });
      return;
    }

    // Local engine registration
    const existing = memoryStore.partners.find((p) => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({ success: false, message: 'This email address is already registered.' });
      return;
    }

    const partnerIdCode = await generateNextPartnerId();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newPartner = {
      id: memoryStore.partners.length > 0 ? Math.max(...memoryStore.partners.map((p) => p.id)) + 1 : 1,
      partner_id: partnerIdCode,
      full_name: cleanName,
      email: cleanEmail,
      mobile_number: cleanMobile,
      password_hash: passwordHash,
      profile_image: profile_image || null,
      status: 'PENDING',
      rejection_reason: null,
      created_at: new Date().toISOString(),
    };

    memoryStore.partners.push(newPartner);
    saveStore();

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your account is pending admin review and approval.',
      partner: {
        id: newPartner.id,
        partner_id: newPartner.partner_id,
        full_name: newPartner.full_name,
        email: newPartner.email,
        status: 'PENDING',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Partner Login
export async function loginPartner(req: Request, res: Response) {
  try {
    const { login_identifier, password } = req.body;

    if (!login_identifier || !password) {
      res.status(400).json({ success: false, message: 'Please provide your Partner ID or Email, and password.' });
      return;
    }

    const identifier = String(login_identifier).trim();

    let partner: any = null;

    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute(
        'SELECT * FROM partners WHERE partner_id = ? OR email = ? LIMIT 1',
        [identifier, identifier.toLowerCase()]
      );
      if (rows && rows.length > 0) {
        partner = rows[0];
      }
    } else {
      partner = memoryStore.partners.find(
        (p) => p.partner_id.toUpperCase() === identifier.toUpperCase() || p.email.toLowerCase() === identifier.toLowerCase()
      );
    }

    if (!partner) {
      res.status(401).json({ success: false, message: 'Invalid Partner ID/Email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, partner.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid Partner ID/Email or password.' });
      return;
    }

    // Status check
    if (partner.status === 'PENDING') {
      res.status(403).json({
        success: false,
        message: 'Your partner account is currently PENDING approval from the administrator. You will be notified once activated.',
      });
      return;
    }

    if (partner.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        message: `Your partner account application was rejected. ${partner.rejection_reason ? 'Reason: ' + partner.rejection_reason : 'Please contact support.'}`,
      });
      return;
    }

    if (partner.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Your partner account has been suspended. Please contact support.',
      });
      return;
    }

    if (partner.status !== 'APPROVED') {
      res.status(403).json({ success: false, message: 'Account is not authorized for dashboard access.' });
      return;
    }

    // Set server-side session
    req.session.partnerId = partner.id;
    req.session.partnerCode = partner.partner_id;
    req.session.partnerEmail = partner.email;
    req.session.partnerName = partner.full_name;

    res.json({
      success: true,
      message: 'Login successful. Welcome back!',
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        full_name: partner.full_name,
        email: partner.email,
        mobile_number: partner.mobile_number,
        profile_image: partner.profile_image,
        status: partner.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Partner Session Check
export async function getPartnerSession(req: Request, res: Response) {
  try {
    if (!req.session || !req.session.partnerId) {
      res.json({ authenticated: false, partner: null });
      return;
    }

    let partner: any = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute(
        'SELECT id, partner_id, full_name, email, mobile_number, profile_image, status, created_at FROM partners WHERE id = ? LIMIT 1',
        [req.session.partnerId]
      );
      if (rows && rows.length > 0) partner = rows[0];
    } else {
      partner = memoryStore.partners.find((p) => p.id === req.session.partnerId);
    }

    if (!partner || partner.status !== 'APPROVED') {
      req.session.destroy(() => {});
      res.json({ authenticated: false, partner: null });
      return;
    }

    res.json({
      authenticated: true,
      partner: {
        id: partner.id,
        partner_id: partner.partner_id,
        full_name: partner.full_name,
        email: partner.email,
        mobile_number: partner.mobile_number,
        profile_image: partner.profile_image,
        status: partner.status,
        created_at: partner.created_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ authenticated: false, message: err.message });
  }
}

// Update Partner Profile Settings
export async function updatePartnerProfile(req: Request, res: Response) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const { full_name, mobile_number, profile_image, current_password, new_password } = req.body;

    if (!full_name || full_name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    if (!mobile_number || mobile_number.trim().length < 8) {
      res.status(400).json({ success: false, message: 'Valid mobile number is required.' });
      return;
    }

    let existing: any = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute('SELECT * FROM partners WHERE id = ? LIMIT 1', [partnerId]);
      if (rows && rows.length > 0) existing = rows[0];
    } else {
      existing = memoryStore.partners.find((p) => p.id === partnerId);
    }

    if (!existing) {
      res.status(404).json({ success: false, message: 'Partner record not found.' });
      return;
    }

    let newHash: string | null = null;
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
        return;
      }
      const match = await bcrypt.compare(current_password, existing.password_hash);
      if (!match) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }
      if (new_password.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      newHash = await bcrypt.hash(new_password, salt);
    }

    if (isConnectedToMySQL && mysqlPool) {
      if (newHash) {
        await mysqlPool.execute(
          'UPDATE partners SET full_name = ?, mobile_number = ?, profile_image = ?, password_hash = ? WHERE id = ?',
          [full_name.trim(), mobile_number.trim(), profile_image || existing.profile_image, newHash, partnerId]
        );
      } else {
        await mysqlPool.execute(
          'UPDATE partners SET full_name = ?, mobile_number = ?, profile_image = ? WHERE id = ?',
          [full_name.trim(), mobile_number.trim(), profile_image || existing.profile_image, partnerId]
        );
      }
    } else {
      existing.full_name = full_name.trim();
      existing.mobile_number = mobile_number.trim();
      if (profile_image) existing.profile_image = profile_image;
      if (newHash) existing.password_hash = newHash;
      saveStore();
    }

    req.session.partnerName = full_name.trim();

    res.json({
      success: true,
      message: 'Profile settings updated successfully.',
      partner: {
        id: partnerId,
        partner_id: existing.partner_id,
        full_name: full_name.trim(),
        email: existing.email,
        mobile_number: mobile_number.trim(),
        profile_image: profile_image || existing.profile_image,
        status: existing.status,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Logout Partner
export function logoutPartner(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Could not log out. Please try again.' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully.' });
  });
}

// Admin Authentication (For reviewing partners & managing products)
export async function loginAdmin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password required.' });
      return;
    }

    let admin: any = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute(
        'SELECT * FROM admins WHERE username = ? OR email = ? LIMIT 1',
        [username, username]
      );
      if (rows && rows.length > 0) admin = rows[0];
    } else {
      admin = memoryStore.admins.find((a) => a.username === username || a.email === username);
    }

    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      return;
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      return;
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.adminRole = admin.role;

    res.json({
      success: true,
      message: 'Admin authentication granted.',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        full_name: admin.full_name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export function getAdminSession(req: Request, res: Response) {
  if (req.session && req.session.adminId) {
    res.json({
      authenticated: true,
      admin: {
        id: req.session.adminId,
        username: req.session.adminUsername,
        role: req.session.adminRole,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
}

export function logoutAdmin(req: Request, res: Response) {
  req.session.adminId = undefined;
  req.session.adminUsername = undefined;
  req.session.adminRole = undefined;
  res.json({ success: true, message: 'Admin logged out.' });
}
