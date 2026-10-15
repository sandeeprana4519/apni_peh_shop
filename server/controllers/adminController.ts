import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  isConnectedToMySQL,
  mysqlPool,
  memoryStore,
  saveStore,
  hasAdminAccount,
  logAdminActivity,
  logProductStatusChange,
} from '../db.js';
import { isValidAffiliateUrl } from '../middleware/security.js';

// ---------------------------------------------------------------------
// 1. Initial One-Time Admin Setup
// ---------------------------------------------------------------------
export async function setupInitialAdmin(req: Request, res: Response) {
  try {
    const adminExists = await hasAdminAccount();
    if (adminExists) {
      res.status(403).json({
        success: false,
        message: 'Admin setup has already been completed. This route is permanently disabled for security.',
      });
      return;
    }

    const { username, email, full_name, password } = req.body;

    if (!username || !email || !password || password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Username, valid email, and secure password (minimum 8 characters) are required.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (isConnectedToMySQL && mysqlPool) {
      const [result]: any = await mysqlPool.execute(
        `INSERT INTO admins (username, email, password, password_hash, full_name, role, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, 'superadmin', 1, NOW())`,
        [username.trim(), email.trim().toLowerCase(), password, passwordHash, full_name?.trim() || 'Super Admin']
      );

      await logAdminActivity(
        result.insertId,
        'INITIAL_ADMIN_SETUP',
        'ADMIN',
        result.insertId,
        `Initial superadmin account ${username} created`,
        req.ip || ''
      );

      res.status(201).json({
        success: true,
        message: 'Initial administrator created successfully. Please log in through the Admin Login portal.',
      });
      return;
    }

    // Local engine
    const newAdmin = {
      id: 1,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      password_hash: passwordHash,
      full_name: full_name?.trim() || 'Super Admin',
      role: 'superadmin',
      is_active: 1,
      created_at: new Date().toISOString(),
    };
    memoryStore.admins = [newAdmin];
    saveStore();

    await logAdminActivity(
      1,
      'INITIAL_ADMIN_SETUP',
      'ADMIN',
      1,
      `Initial superadmin account ${username} created`,
      req.ip || ''
    );

    res.status(201).json({
      success: true,
      message: 'Initial administrator created successfully. Setup is now locked.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function checkSetupStatus(_req: Request, res: Response) {
  try {
    const exists = await hasAdminAccount();
    res.json({ setupNeeded: !exists });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 2. Admin Overview Dashboard Statistics
// ---------------------------------------------------------------------
export async function getAdminOverview(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [partnerStats]: any = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_partners,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_partners,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_partners,
          SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended_partners
        FROM partners
      `);

      const [productStats]: any = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_products,
          SUM(CASE WHEN approval_status = 'APPROVED' AND publication_status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_products,
          SUM(CASE WHEN approval_status = 'REJECTED' OR publication_status = 'ARCHIVED' THEN 1 ELSE 0 END) as rejected_hidden_products,
          COALESCE(SUM(clicks_count), 0) as total_clicks
        FROM products
      `);

      const [counts]: any = await mysqlPool.query(`
        SELECT 
          (SELECT COUNT(*) FROM categories WHERE is_active = 1) as total_categories,
          (SELECT COUNT(*) FROM affiliate_platforms WHERE is_active = 1) as total_platforms
      `);

      res.json({
        success: true,
        stats: {
          total_partners: partnerStats[0]?.total_partners || 0,
          pending_partners: partnerStats[0]?.pending_partners || 0,
          approved_partners: partnerStats[0]?.approved_partners || 0,
          suspended_partners: partnerStats[0]?.suspended_partners || 0,
          total_products: productStats[0]?.total_products || 0,
          pending_products: productStats[0]?.pending_products || 0,
          published_products: productStats[0]?.published_products || 0,
          rejected_hidden_products: productStats[0]?.rejected_hidden_products || 0,
          total_categories: counts[0]?.total_categories || 0,
          total_platforms: counts[0]?.total_platforms || 0,
          total_clicks: productStats[0]?.total_clicks || 0,
        },
      });
      return;
    }

    const partners = memoryStore.partners;
    const products = memoryStore.products;

    res.json({
      success: true,
      stats: {
        total_partners: partners.length,
        pending_partners: partners.filter((p) => p.status === 'PENDING').length,
        approved_partners: partners.filter((p) => p.status === 'APPROVED').length,
        suspended_partners: partners.filter((p) => p.status === 'SUSPENDED').length,
        total_products: products.length,
        pending_products: products.filter((p) => p.approval_status === 'PENDING').length,
        published_products: products.filter(
          (p) => p.approval_status === 'APPROVED' && p.publication_status === 'PUBLISHED'
        ).length,
        rejected_hidden_products: products.filter(
          (p) => p.approval_status === 'REJECTED' || p.publication_status === 'ARCHIVED'
        ).length,
        total_categories: memoryStore.categories.filter((c) => c.is_active).length,
        total_platforms: memoryStore.affiliate_platforms.filter((pl) => pl.is_active).length,
        total_clicks: products.reduce((acc, p) => acc + (p.clicks_count || 0), 0),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 3. Admin Product Management & Moderation
// ---------------------------------------------------------------------
export async function getAdminProducts(req: Request, res: Response) {
  try {
    const { approval_status, publication_status, category_id, platform_id, search } = req.query;

    if (isConnectedToMySQL && mysqlPool) {
      let conditions = ['1=1'];
      const params: any[] = [];

      if (approval_status) {
        conditions.push('p.approval_status = ?');
        params.push(approval_status);
      }
      if (publication_status) {
        conditions.push('p.publication_status = ?');
        params.push(publication_status);
      }
      if (category_id) {
        conditions.push('p.category_id = ?');
        params.push(category_id);
      }
      if (platform_id) {
        conditions.push('p.platform_id = ?');
        params.push(platform_id);
      }
      if (search) {
        conditions.push('(p.product_name LIKE ? OR pt.partner_id LIKE ? OR pt.full_name LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      const sql = `
        SELECT 
          p.*,
          c.name AS category_name,
          ap.name AS platform_name, ap.badge_color AS platform_badge_color,
          pt.partner_id AS partner_code, pt.full_name AS partner_name, pt.email AS partner_email,
          adm.full_name AS admin_creator_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
        LEFT JOIN admins adm ON p.admin_id = adm.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.display_priority DESC, p.id DESC
      `;

      const [rows]: any = await mysqlPool.execute(sql, params);
      res.json({ success: true, products: rows });
      return;
    }

    let prods = [...memoryStore.products];
    if (approval_status) prods = prods.filter((p) => p.approval_status === approval_status);
    if (publication_status) prods = prods.filter((p) => p.publication_status === publication_status);
    if (category_id) prods = prods.filter((p) => p.category_id === Number(category_id));
    if (platform_id) prods = prods.filter((p) => p.platform_id === Number(platform_id));
    if (search) {
      const q = String(search).toLowerCase();
      prods = prods.filter((p) => {
        const pt = memoryStore.partners.find((part) => part.id === p.partner_id);
        return (
          p.product_name.toLowerCase().includes(q) ||
          (pt && (pt.partner_id.toLowerCase().includes(q) || pt.full_name.toLowerCase().includes(q)))
        );
      });
    }

    prods.sort((a, b) => (b.display_priority || 0) - (a.display_priority || 0) || b.id - a.id);

    const enriched = prods.map((p) => {
      const cat = memoryStore.categories.find((c) => c.id === p.category_id);
      const plat = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
      const pt = memoryStore.partners.find((partner) => partner.id === p.partner_id);
      return {
        ...p,
        category_name: cat ? cat.name : 'General',
        platform_name: plat ? plat.name : 'Store',
        platform_badge_color: plat ? plat.badge_color : '#2563EB',
        partner_name: pt ? pt.full_name : 'Staff Administrator',
        partner_code: pt ? pt.partner_id : 'STAFF',
      };
    });

    res.json({ success: true, products: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Admin creates product -> PUBLISHED immediately
export async function createAdminProduct(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const {
      product_name,
      image_url,
      category_id,
      platform_id,
      price,
      original_mrp,
      affiliate_url,
      description,
      display_priority = 10,
      is_featured = 0,
      is_trending = 0,
    } = req.body;

    if (!product_name || !image_url || !category_id || !platform_id || !affiliate_url) {
      res.status(400).json({ success: false, message: 'Missing required product fields.' });
      return;
    }

    if (!isValidAffiliateUrl(affiliate_url)) {
      res.status(400).json({ success: false, message: 'Invalid affiliate URL format. Must start with http:// or https://' });
      return;
    }

    const slug = product_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const parsedPrice = price ? parseFloat(price) : null;
    const parsedMrp = original_mrp ? parseFloat(original_mrp) : null;

    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        INSERT INTO products (
          product_name, slug, image_url, description, category_id, platform_id,
          price, original_mrp, currency, affiliate_url, added_by_role, admin_id,
          approval_status, publication_status, is_featured, is_trending, display_priority,
          views_count, clicks_count, created_at, published_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 'INR', ?, 'ADMIN', ?,
          'APPROVED', 'PUBLISHED', ?, ?, ?,
          0, 0, NOW(), NOW()
        )
      `;

      const [result]: any = await mysqlPool.execute(sql, [
        product_name.trim(),
        slug,
        image_url.trim(),
        description ? description.trim() : null,
        Number(category_id),
        Number(platform_id),
        parsedPrice,
        parsedMrp,
        affiliate_url.trim(),
        adminId || null,
        is_featured ? 1 : 0,
        is_trending ? 1 : 0,
        Number(display_priority) || 10,
      ]);

      await logAdminActivity(
        adminId || null,
        'CREATE_PRODUCT',
        'PRODUCT',
        result.insertId,
        `Created and published admin product: ${product_name}`,
        req.ip || ''
      );

      res.status(201).json({
        success: true,
        message: 'Product created and published to storefront successfully.',
        productId: result.insertId,
      });
      return;
    }

    const newProd = {
      id: memoryStore.products.length > 0 ? Math.max(...memoryStore.products.map((p) => p.id)) + 1 : 1,
      product_name: product_name.trim(),
      slug,
      image_url: image_url.trim(),
      description: description ? description.trim() : '',
      category_id: Number(category_id),
      platform_id: Number(platform_id),
      price: parsedPrice,
      original_mrp: parsedMrp,
      currency: 'INR',
      rating: 4.8,
      reviews_count: 50,
      affiliate_url: affiliate_url.trim(),
      added_by_role: 'ADMIN',
      admin_id: adminId || 1,
      partner_id: null,
      approval_status: 'APPROVED',
      publication_status: 'PUBLISHED',
      is_featured: is_featured ? 1 : 0,
      is_trending: is_trending ? 1 : 0,
      display_priority: Number(display_priority) || 10,
      views_count: 0,
      clicks_count: 0,
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };

    memoryStore.products.unshift(newProd);
    saveStore();

    await logAdminActivity(
      adminId || 1,
      'CREATE_PRODUCT',
      'PRODUCT',
      newProd.id,
      `Created and published admin product: ${product_name}`,
      req.ip || ''
    );

    res.status(201).json({
      success: true,
      message: 'Product created and published to storefront successfully.',
      productId: newProd.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update existing product
export async function updateAdminProduct(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    const {
      product_name,
      image_url,
      category_id,
      platform_id,
      price,
      original_mrp,
      affiliate_url,
      description,
      display_priority,
      is_featured,
      is_trending,
    } = req.body;

    if (!product_name || !image_url || !category_id || !platform_id || !affiliate_url) {
      res.status(400).json({ success: false, message: 'Missing required product fields.' });
      return;
    }

    if (!isValidAffiliateUrl(affiliate_url)) {
      res.status(400).json({ success: false, message: 'Invalid affiliate destination URL.' });
      return;
    }

    const parsedPrice = price ? parseFloat(price) : null;
    const parsedMrp = original_mrp ? parseFloat(original_mrp) : null;

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE products SET
          product_name = ?, image_url = ?, description = ?,
          category_id = ?, platform_id = ?, price = ?, original_mrp = ?,
          affiliate_url = ?, display_priority = ?, is_featured = ?, is_trending = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [
          product_name.trim(),
          image_url.trim(),
          description ? description.trim() : null,
          Number(category_id),
          Number(platform_id),
          parsedPrice,
          parsedMrp,
          affiliate_url.trim(),
          Number(display_priority) || 0,
          is_featured ? 1 : 0,
          is_trending ? 1 : 0,
          productId,
        ]
      );

      await logAdminActivity(adminId || null, 'UPDATE_PRODUCT', 'PRODUCT', productId, `Updated product #${productId}`, req.ip || '');
      res.json({ success: true, message: 'Product updated successfully.' });
      return;
    }

    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    prod.product_name = product_name.trim();
    prod.image_url = image_url.trim();
    prod.description = description || '';
    prod.category_id = Number(category_id);
    prod.platform_id = Number(platform_id);
    prod.price = parsedPrice;
    prod.original_mrp = parsedMrp;
    prod.affiliate_url = affiliate_url.trim();
    prod.display_priority = Number(display_priority) || 0;
    prod.is_featured = is_featured ? 1 : 0;
    prod.is_trending = is_trending ? 1 : 0;
    saveStore();

    await logAdminActivity(adminId || 1, 'UPDATE_PRODUCT', 'PRODUCT', productId, `Updated product #${productId}`, req.ip || '');
    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Approve or Reject Partner Product with Reason
export async function moderateProduct(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    const { approval_status, rejection_reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(approval_status)) {
      res.status(400).json({ success: false, message: 'Invalid status code.' });
      return;
    }

    const pubStatus = approval_status === 'APPROVED' ? 'PUBLISHED' : 'DRAFT';

    if (isConnectedToMySQL && mysqlPool) {
      const [curr]: any = await mysqlPool.execute('SELECT approval_status FROM products WHERE id = ?', [productId]);
      const prev = curr[0]?.approval_status || 'PENDING';

      await mysqlPool.execute(
        `UPDATE products SET
          approval_status = ?,
          publication_status = ?,
          rejection_reason = ?,
          published_at = IF(? = 'APPROVED', NOW(), published_at),
          updated_at = NOW()
         WHERE id = ?`,
        [approval_status, pubStatus, rejection_reason || null, approval_status, productId]
      );

      await logProductStatusChange(
        productId,
        prev,
        approval_status,
        adminId || null,
        rejection_reason || `Product marked as ${approval_status}`
      );

      await logAdminActivity(
        adminId || null,
        'MODERATE_PRODUCT',
        'PRODUCT',
        productId,
        `Status set to ${approval_status}`,
        req.ip || ''
      );

      res.json({ success: true, message: `Product ${approval_status.toLowerCase()} successfully.` });
      return;
    }

    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const prev = prod.approval_status;
    prod.approval_status = approval_status;
    prod.publication_status = pubStatus;
    prod.rejection_reason = rejection_reason || null;
    if (approval_status === 'APPROVED') prod.published_at = new Date().toISOString();
    saveStore();

    await logProductStatusChange(
      productId,
      prev,
      approval_status,
      adminId || 1,
      rejection_reason || `Product marked as ${approval_status}`
    );

    res.json({ success: true, message: `Product ${approval_status.toLowerCase()} successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Toggle Publish / Unpublish or Hide / Restore
export async function toggleProductPublication(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);
    const { publication_status } = req.body; // 'PUBLISHED', 'DRAFT', 'ARCHIVED'

    if (!['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(publication_status)) {
      res.status(400).json({ success: false, message: 'Invalid publication status' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute('UPDATE products SET publication_status = ? WHERE id = ?', [publication_status, productId]);
      await logAdminActivity(adminId || null, 'CHANGE_PUBLICATION', 'PRODUCT', productId, `Set to ${publication_status}`, req.ip || '');
      res.json({ success: true, message: `Product is now ${publication_status}.` });
      return;
    }

    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    prod.publication_status = publication_status;
    saveStore();
    res.json({ success: true, message: `Product is now ${publication_status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete Product
export async function deleteProductAdmin(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const productId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute('DELETE FROM products WHERE id = ?', [productId]);
      await logAdminActivity(adminId || null, 'DELETE_PRODUCT', 'PRODUCT', productId, `Deleted product #${productId}`, req.ip || '');
      res.json({ success: true, message: 'Product deleted permanently.' });
      return;
    }

    const idx = memoryStore.products.findIndex((p) => p.id === productId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    memoryStore.products.splice(idx, 1);
    saveStore();
    await logAdminActivity(adminId || 1, 'DELETE_PRODUCT', 'PRODUCT', productId, `Deleted product #${productId}`, req.ip || '');
    res.json({ success: true, message: 'Product deleted permanently.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 4. Complete Partner Management & Password Reset
// ---------------------------------------------------------------------
export async function getAllPartners(req: Request, res: Response) {
  try {
    const { status, search } = req.query;

    if (isConnectedToMySQL && mysqlPool) {
      let conditions = ['1=1'];
      const params: any[] = [];

      if (status) {
        conditions.push('p.status = ?');
        params.push(status);
      }

      if (search) {
        conditions.push('(p.full_name LIKE ? OR p.partner_id LIKE ? OR p.email LIKE ? OR p.mobile_number LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      const sql = `
        SELECT 
          p.id, p.partner_id, p.full_name, p.email, p.mobile_number, p.profile_image,
          p.password,
          p.status, p.rejection_reason, p.created_at, p.approved_at,
          COUNT(pr.id) as total_products,
          COALESCE(SUM(pr.clicks_count), 0) as total_clicks
        FROM partners p
        LEFT JOIN products pr ON p.id = pr.partner_id
        WHERE ${conditions.join(' AND ')}
        GROUP BY p.id
        ORDER BY p.id DESC
      `;

      const [rows]: any = await mysqlPool.execute(sql, params);
      res.json({ success: true, partners: rows });
      return;
    }

    let list = [...memoryStore.partners];
    if (status) list = list.filter((p) => p.status === status);
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.partner_id.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.mobile_number.includes(q)
      );
    }
    list.sort((a, b) => b.id - a.id);

    const enriched = list.map(({ password_hash, ...rest }) => {
      const prods = memoryStore.products.filter((pr) => pr.partner_id === rest.id);
      return {
        ...rest,
        total_products: prods.length,
        total_clicks: prods.reduce((acc, pr) => acc + (pr.clicks_count || 0), 0),
      };
    });

    res.json({ success: true, partners: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get partner detail with their products
export async function getPartnerDetails(req: Request, res: Response) {
  try {
    const partnerId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL && mysqlPool) {
      const [partnerRows]: any = await mysqlPool.execute(
        'SELECT id, partner_id, full_name, email, mobile_number, profile_image, status, rejection_reason, created_at, approved_at FROM partners WHERE id = ? LIMIT 1',
        [partnerId]
      );
      if (!partnerRows || partnerRows.length === 0) {
        res.status(404).json({ success: false, message: 'Partner not found' });
        return;
      }

      const [products]: any = await mysqlPool.execute(
        `SELECT p.*, c.name as category_name, ap.name as platform_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
         WHERE p.partner_id = ? ORDER BY p.id DESC`,
        [partnerId]
      );

      res.json({ success: true, partner: partnerRows[0], products });
      return;
    }

    const partner = memoryStore.partners.find((p) => p.id === partnerId);
    if (!partner) {
      res.status(404).json({ success: false, message: 'Partner not found' });
      return;
    }

    const { password_hash, ...clean } = partner;
    const prods = memoryStore.products.filter((p) => p.partner_id === partnerId);

    res.json({ success: true, partner: clean, products: prods });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update partner status (Approve, Reject, Suspend, Activate)
export async function updatePartnerStatus(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const partnerId = parseInt(req.params.id, 10);
    const { status, rejection_reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid partner status' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE partners SET 
          status = ?, 
          rejection_reason = ?,
          approved_by_admin_id = IF(? = 'APPROVED', ?, approved_by_admin_id),
          approved_at = IF(? = 'APPROVED', NOW(), approved_at),
          updated_at = NOW()
         WHERE id = ?`,
        [status, rejection_reason || null, status, adminId || null, status, partnerId]
      );

      await logAdminActivity(
        adminId || null,
        'UPDATE_PARTNER_STATUS',
        'PARTNER',
        partnerId,
        `Status set to ${status}${rejection_reason ? ' (' + rejection_reason + ')' : ''}`,
        req.ip || ''
      );

      res.json({ success: true, message: `Partner status updated to ${status}.` });
      return;
    }

    const pt = memoryStore.partners.find((p) => p.id === partnerId);
    if (!pt) {
      res.status(404).json({ success: false, message: 'Partner not found.' });
      return;
    }

    pt.status = status;
    pt.rejection_reason = rejection_reason || null;
    saveStore();

    await logAdminActivity(
      adminId || 1,
      'UPDATE_PARTNER_STATUS',
      'PARTNER',
      partnerId,
      `Status set to ${status}`,
      req.ip || ''
    );

    res.json({ success: true, message: `Partner status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Secure partner password reset by Admin (never exposes plaintext)
export async function resetPartnerPassword(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const partnerId = parseInt(req.params.id, 10);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      res.status(400).json({ success: false, message: 'New temporary password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute('UPDATE partners SET password = ?, password_hash = ?, updated_at = NOW() WHERE id = ?', [new_password, hash, partnerId]);
      await logAdminActivity(adminId || null, 'RESET_PARTNER_PASSWORD', 'PARTNER', partnerId, 'Password reset by admin', req.ip || '');
      res.json({ success: true, message: 'Partner password has been reset securely.' });
      return;
    }

    const pt = memoryStore.partners.find((p) => p.id === partnerId);
    if (!pt) {
      res.status(404).json({ success: false, message: 'Partner not found' });
      return;
    }

    pt.password = new_password;
    pt.password_hash = hash;
    saveStore();

    await logAdminActivity(adminId || 1, 'RESET_PARTNER_PASSWORD', 'PARTNER', partnerId, 'Password reset by admin', req.ip || '');
    res.json({ success: true, message: 'Partner password has been reset securely.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete partner account
export async function deletePartnerAdmin(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const partnerId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL && mysqlPool) {
      // Reassign partner products to null before delete (or CASCADE via FK)
      await mysqlPool.execute('UPDATE products SET partner_id = NULL WHERE partner_id = ?', [partnerId]);
      await mysqlPool.execute('DELETE FROM partners WHERE id = ?', [partnerId]);
      await logAdminActivity(adminId || null, 'DELETE_PARTNER', 'PARTNER', partnerId, `Partner #${partnerId} deleted`, req.ip || '');
      res.json({ success: true, message: 'Partner account deleted successfully.' });
      return;
    }

    const idx = memoryStore.partners.findIndex((p) => p.id === partnerId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Partner not found' });
      return;
    }

    memoryStore.partners.splice(idx, 1);
    // update products
    memoryStore.products.forEach((pr) => {
      if (pr.partner_id === partnerId) pr.partner_id = null;
    });
    saveStore();

    await logAdminActivity(adminId || 1, 'DELETE_PARTNER', 'PARTNER', partnerId, `Partner #${partnerId} deleted`, req.ip || '');
    res.json({ success: true, message: 'Partner account deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 5. Category Management (with Safe Deletion Check)
// ---------------------------------------------------------------------
export async function getCategoriesAdmin(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query(`
        SELECT c.*, COUNT(p.id) as products_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
        GROUP BY c.id 
        ORDER BY c.display_order ASC, c.id ASC
      `);
      res.json({ success: true, categories: rows });
      return;
    }

    const categories = memoryStore.categories.map((c) => ({
      ...c,
      products_count: memoryStore.products.filter((p) => p.category_id === c.id).length,
    }));
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createCategory(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const { name, icon_name, image_url, display_order = 0, is_active = 1 } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isConnectedToMySQL && mysqlPool) {
      const [result]: any = await mysqlPool.execute(
        `INSERT INTO categories (name, slug, icon_name, image_url, display_order, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [name.trim(), slug, icon_name || 'Tag', image_url || null, Number(display_order) || 0, is_active ? 1 : 0]
      );
      await logAdminActivity(adminId || null, 'CREATE_CATEGORY', 'CATEGORY', result.insertId, `Created category ${name}`, req.ip || '');
      res.status(201).json({ success: true, message: 'Category created.', categoryId: result.insertId });
      return;
    }

    const newCat = {
      id: memoryStore.categories.length > 0 ? Math.max(...memoryStore.categories.map((c) => c.id)) + 1 : 1,
      name: name.trim(),
      slug,
      icon_name: icon_name || 'Tag',
      image_url: image_url || null,
      display_order: Number(display_order) || 0,
      is_active: is_active ? 1 : 0,
      created_at: new Date().toISOString(),
    };
    memoryStore.categories.push(newCat);
    saveStore();

    await logAdminActivity(adminId || 1, 'CREATE_CATEGORY', 'CATEGORY', newCat.id, `Created category ${name}`, req.ip || '');
    res.status(201).json({ success: true, message: 'Category created.', categoryId: newCat.id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateCategory(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const categoryId = parseInt(req.params.id, 10);
    const { name, icon_name, image_url, display_order, is_active } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required.' });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE categories SET name = ?, slug = ?, icon_name = ?, image_url = ?, display_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
        [name.trim(), slug, icon_name || 'Tag', image_url || null, Number(display_order) || 0, is_active ? 1 : 0, categoryId]
      );
      await logAdminActivity(adminId || null, 'UPDATE_CATEGORY', 'CATEGORY', categoryId, `Updated category ${name}`, req.ip || '');
      res.json({ success: true, message: 'Category updated.' });
      return;
    }

    const cat = memoryStore.categories.find((c) => c.id === categoryId);
    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    cat.name = name.trim();
    cat.slug = slug;
    cat.icon_name = icon_name || cat.icon_name;
    cat.image_url = image_url !== undefined ? image_url : cat.image_url;
    cat.display_order = Number(display_order) || 0;
    cat.is_active = is_active ? 1 : 0;
    saveStore();

    await logAdminActivity(adminId || 1, 'UPDATE_CATEGORY', 'CATEGORY', categoryId, `Updated category ${name}`, req.ip || '');
    res.json({ success: true, message: 'Category updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Safe Category Deletion: Prevent deleting category referenced by products
export async function deleteCategory(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const categoryId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL && mysqlPool) {
      const [countRows]: any = await mysqlPool.execute('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [categoryId]);
      const productCount = countRows[0]?.count || 0;
      if (productCount > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot delete category: it is referenced by ${productCount} products. Please reassign the products or hide the category instead.`,
        });
        return;
      }

      await mysqlPool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);
      await logAdminActivity(adminId || null, 'DELETE_CATEGORY', 'CATEGORY', categoryId, `Deleted category #${categoryId}`, req.ip || '');
      res.json({ success: true, message: 'Category deleted safely.' });
      return;
    }

    const productCount = memoryStore.products.filter((p) => p.category_id === categoryId).length;
    if (productCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete category: it is referenced by ${productCount} products. Please reassign or hide the category instead.`,
      });
      return;
    }

    const idx = memoryStore.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    memoryStore.categories.splice(idx, 1);
    saveStore();
    await logAdminActivity(adminId || 1, 'DELETE_CATEGORY', 'CATEGORY', categoryId, `Deleted category #${categoryId}`, req.ip || '');
    res.json({ success: true, message: 'Category deleted safely.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 6. Affiliate Platform Management
// ---------------------------------------------------------------------
export async function getPlatformsAdmin(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query(`
        SELECT ap.*, COUNT(p.id) as products_count 
        FROM affiliate_platforms ap 
        LEFT JOIN products p ON ap.id = p.platform_id 
        GROUP BY ap.id 
        ORDER BY ap.display_order ASC
      `);
      res.json({ success: true, platforms: rows });
      return;
    }

    const platforms = memoryStore.affiliate_platforms.map((pl) => ({
      ...pl,
      products_count: memoryStore.products.filter((p) => p.platform_id === pl.id).length,
    }));
    res.json({ success: true, platforms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createPlatform(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const { name, badge_color = '#2563EB', logo_url, base_url, display_order = 0, is_active = 1 } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Platform name is required.' });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isConnectedToMySQL && mysqlPool) {
      const [result]: any = await mysqlPool.execute(
        `INSERT INTO affiliate_platforms (name, slug, badge_color, logo_url, base_url, display_order, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [name.trim(), slug, badge_color, logo_url || null, base_url || null, Number(display_order) || 0, is_active ? 1 : 0]
      );
      await logAdminActivity(adminId || null, 'CREATE_PLATFORM', 'PLATFORM', result.insertId, `Created platform ${name}`, req.ip || '');
      res.status(201).json({ success: true, message: 'Platform created.', platformId: result.insertId });
      return;
    }

    const newPlat = {
      id: memoryStore.affiliate_platforms.length > 0 ? Math.max(...memoryStore.affiliate_platforms.map((p) => p.id)) + 1 : 1,
      name: name.trim(),
      slug,
      badge_color,
      logo_url: logo_url || null,
      base_url: base_url || null,
      display_order: Number(display_order) || 0,
      is_active: is_active ? 1 : 0,
      created_at: new Date().toISOString(),
    };
    memoryStore.affiliate_platforms.push(newPlat);
    saveStore();

    await logAdminActivity(adminId || 1, 'CREATE_PLATFORM', 'PLATFORM', newPlat.id, `Created platform ${name}`, req.ip || '');
    res.status(201).json({ success: true, message: 'Platform created.', platformId: newPlat.id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updatePlatform(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const platformId = parseInt(req.params.id, 10);
    const { name, badge_color, logo_url, base_url, display_order, is_active } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Platform name is required.' });
      return;
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE affiliate_platforms SET name = ?, slug = ?, badge_color = ?, logo_url = ?, base_url = ?, display_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
        [name.trim(), slug, badge_color || '#2563EB', logo_url || null, base_url || null, Number(display_order) || 0, is_active ? 1 : 0, platformId]
      );
      await logAdminActivity(adminId || null, 'UPDATE_PLATFORM', 'PLATFORM', platformId, `Updated platform ${name}`, req.ip || '');
      res.json({ success: true, message: 'Platform updated.' });
      return;
    }

    const plat = memoryStore.affiliate_platforms.find((p) => p.id === platformId);
    if (!plat) {
      res.status(404).json({ success: false, message: 'Platform not found.' });
      return;
    }

    plat.name = name.trim();
    plat.slug = slug;
    plat.badge_color = badge_color || plat.badge_color;
    plat.logo_url = logo_url !== undefined ? logo_url : plat.logo_url;
    plat.base_url = base_url !== undefined ? base_url : plat.base_url;
    plat.display_order = Number(display_order) || 0;
    plat.is_active = is_active ? 1 : 0;
    saveStore();

    await logAdminActivity(adminId || 1, 'UPDATE_PLATFORM', 'PLATFORM', platformId, `Updated platform ${name}`, req.ip || '');
    res.json({ success: true, message: 'Platform updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deletePlatform(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const platformId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL && mysqlPool) {
      const [countRows]: any = await mysqlPool.execute('SELECT COUNT(*) as count FROM products WHERE platform_id = ?', [platformId]);
      const productCount = countRows[0]?.count || 0;
      if (productCount > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot delete platform: it is associated with ${productCount} products. Please reassign products or hide the platform.`,
        });
        return;
      }

      await mysqlPool.execute('DELETE FROM affiliate_platforms WHERE id = ?', [platformId]);
      await logAdminActivity(adminId || null, 'DELETE_PLATFORM', 'PLATFORM', platformId, `Deleted platform #${platformId}`, req.ip || '');
      res.json({ success: true, message: 'Platform deleted safely.' });
      return;
    }

    const productCount = memoryStore.products.filter((p) => p.platform_id === platformId).length;
    if (productCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete platform: it is associated with ${productCount} products. Please reassign or hide the platform.`,
      });
      return;
    }

    const idx = memoryStore.affiliate_platforms.findIndex((p) => p.id === platformId);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Platform not found.' });
      return;
    }

    memoryStore.affiliate_platforms.splice(idx, 1);
    saveStore();
    await logAdminActivity(adminId || 1, 'DELETE_PLATFORM', 'PLATFORM', platformId, `Deleted platform #${platformId}`, req.ip || '');
    res.json({ success: true, message: 'Platform deleted safely.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 7. Banner Management
// ---------------------------------------------------------------------
export async function getBannersAdmin(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM banners ORDER BY display_order ASC, id ASC');
      res.json({ success: true, banners: rows });
      return;
    }
    const banners = [...memoryStore.banners].sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function manageBanner(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const { id, title, subtitle, image_url, cta_text, cta_link, badge_text, banner_type = 'HERO', display_order = 0, is_active = 1 } = req.body;

    if (!title || !image_url) {
      res.status(400).json({ success: false, message: 'Title and image URL are required.' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      if (id) {
        await mysqlPool.execute(
          `UPDATE banners SET title = ?, subtitle = ?, image_url = ?, cta_text = ?, cta_link = ?, badge_text = ?, banner_type = ?, display_order = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
          [title.trim(), subtitle || '', image_url.trim(), cta_text || 'Shop Now', cta_link || '#', badge_text || '', banner_type, Number(display_order) || 0, is_active ? 1 : 0, id]
        );
        await logAdminActivity(adminId || null, 'UPDATE_BANNER', 'BANNER', id, `Updated banner: ${title}`, req.ip || '');
      } else {
        const [result]: any = await mysqlPool.execute(
          `INSERT INTO banners (title, subtitle, image_url, cta_text, cta_link, badge_text, banner_type, display_order, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [title.trim(), subtitle || '', image_url.trim(), cta_text || 'Shop Now', cta_link || '#', badge_text || '', banner_type, Number(display_order) || 0, is_active ? 1 : 0]
        );
        await logAdminActivity(adminId || null, 'CREATE_BANNER', 'BANNER', result.insertId, `Created banner: ${title}`, req.ip || '');
      }
      res.json({ success: true, message: 'Banner saved.' });
      return;
    }

    if (id) {
      const idx = memoryStore.banners.findIndex((b) => b.id === Number(id));
      if (idx !== -1) {
        memoryStore.banners[idx] = { ...memoryStore.banners[idx], ...req.body };
      }
    } else {
      const newBanner = {
        id: memoryStore.banners.length > 0 ? Math.max(...memoryStore.banners.map((b) => b.id)) + 1 : 1,
        title: title.trim(),
        subtitle: subtitle || '',
        image_url: image_url.trim(),
        cta_text: cta_text || 'Shop Now',
        cta_link: cta_link || '#',
        badge_text: badge_text || '',
        banner_type,
        display_order: Number(display_order) || 0,
        is_active: is_active ? 1 : 0,
      };
      memoryStore.banners.push(newBanner);
    }
    saveStore();

    await logAdminActivity(adminId || 1, 'MANAGE_BANNER', 'BANNER', id || 'NEW', `Saved banner: ${title}`, req.ip || '');
    res.json({ success: true, message: 'Banner saved.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteBanner(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const bannerId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute('DELETE FROM banners WHERE id = ?', [bannerId]);
      await logAdminActivity(adminId || null, 'DELETE_BANNER', 'BANNER', bannerId, `Deleted banner #${bannerId}`, req.ip || '');
      res.json({ success: true, message: 'Banner deleted.' });
      return;
    }

    const idx = memoryStore.banners.findIndex((b) => b.id === bannerId);
    if (idx !== -1) {
      memoryStore.banners.splice(idx, 1);
      saveStore();
    }
    await logAdminActivity(adminId || 1, 'DELETE_BANNER', 'BANNER', bannerId, `Deleted banner #${bannerId}`, req.ip || '');
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 8. Website Settings Management
// ---------------------------------------------------------------------
export async function getSettingsAdmin(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT setting_key, setting_value FROM website_settings');
      const settingsMap: Record<string, string> = {};
      for (const r of rows) settingsMap[r.setting_key] = r.setting_value;
      res.json({ success: true, settings: settingsMap });
      return;
    }
    res.json({ success: true, settings: memoryStore.website_settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const settings: Record<string, string> = req.body;

    if (isConnectedToMySQL && mysqlPool) {
      for (const [key, val] of Object.entries(settings)) {
        await mysqlPool.execute(
          `INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, String(val), String(val)]
        );
      }
      await logAdminActivity(adminId || null, 'UPDATE_SETTINGS', 'SETTINGS', null, 'Website configuration updated', req.ip || '');
      res.json({ success: true, message: 'Website settings saved to MySQL successfully.' });
      return;
    }

    for (const [key, val] of Object.entries(settings)) {
      memoryStore.website_settings[key] = String(val);
    }
    saveStore();

    await logAdminActivity(adminId || 1, 'UPDATE_SETTINGS', 'SETTINGS', null, 'Website configuration updated', req.ip || '');
    res.json({ success: true, message: 'Website settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 9. Admin Profile & Password Settings
// ---------------------------------------------------------------------
export async function getAdminProfile(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute('SELECT id, username, email, full_name, role, is_active FROM admins WHERE id = ?', [adminId]);
      if (rows && rows.length > 0) {
        res.json({ success: true, admin: rows[0] });
        return;
      }
    }

    const admin = memoryStore.admins.find((a) => a.id === adminId);
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }
    const { password_hash, ...rest } = admin;
    res.json({ success: true, admin: rest });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateAdminProfile(req: Request, res: Response) {
  try {
    const adminId = req.session.adminId;
    const { full_name, email, current_password, new_password } = req.body;

    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let admin: any = null;
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute('SELECT * FROM admins WHERE id = ?', [adminId]);
      if (rows && rows.length > 0) admin = rows[0];
    } else {
      admin = memoryStore.admins.find((a) => a.id === adminId);
    }

    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    let newHash: string | null = null;
    if (new_password) {
      if (!current_password) {
        res.status(400).json({ success: false, message: 'Current password is required to change password.' });
        return;
      }
      const isMatch = await bcrypt.compare(current_password, admin.password_hash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }
      if (new_password.length < 8) {
        res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      newHash = await bcrypt.hash(new_password, salt);
    }

    if (isConnectedToMySQL && mysqlPool) {
      if (newHash) {
        await mysqlPool.execute(
          'UPDATE admins SET full_name = ?, email = ?, password = ?, password_hash = ?, updated_at = NOW() WHERE id = ?',
          [full_name || admin.full_name, email || admin.email, new_password, newHash, adminId]
        );
      } else {
        await mysqlPool.execute(
          'UPDATE admins SET full_name = ?, email = ?, updated_at = NOW() WHERE id = ?',
          [full_name || admin.full_name, email || admin.email, adminId]
        );
      }
      await logAdminActivity(adminId, 'UPDATE_PROFILE', 'ADMIN', adminId, 'Profile credentials updated', req.ip || '');
      res.json({ success: true, message: 'Admin profile updated successfully.' });
      return;
    }

    admin.full_name = full_name || admin.full_name;
    admin.email = email || admin.email;
    if (newHash) {
      admin.password = new_password;
      admin.password_hash = newHash;
    }
    saveStore();

    await logAdminActivity(adminId, 'UPDATE_PROFILE', 'ADMIN', adminId, 'Profile credentials updated', req.ip || '');
    res.json({ success: true, message: 'Admin profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------------------------------------------------------------------
// 10. Audit Activity Logs & Product History
// ---------------------------------------------------------------------
export async function getAdminLogs(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query(
        `SELECT l.*, a.username as admin_username, a.full_name as admin_name 
         FROM admin_activity_logs l 
         LEFT JOIN admins a ON l.admin_id = a.id 
         ORDER BY l.id DESC LIMIT 50`
      );
      res.json({ success: true, logs: rows });
      return;
    }

    res.json({ success: true, logs: memoryStore.admin_activity_logs.slice(0, 50) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProductStatusHistory(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute(
        `SELECT h.*, a.full_name as admin_name 
         FROM product_status_history h 
         LEFT JOIN admins a ON h.changed_by_admin_id = a.id 
         WHERE h.product_id = ? ORDER BY h.id DESC`,
        [productId]
      );
      res.json({ success: true, history: rows });
      return;
    }

    const history = memoryStore.product_status_history.filter((h) => h.product_id === productId);
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
