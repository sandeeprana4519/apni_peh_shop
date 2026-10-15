import { Request, Response } from 'express';
import { isConnectedToMySQL, mysqlPool, memoryStore, saveStore } from '../db.js';

// Get admin dashboard overview stats
export async function getAdminOverview(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [partnerStats]: any = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_partners,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_partners,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_partners
        FROM partners
      `);

      const [productStats]: any = await mysqlPool.query(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_products,
          SUM(CASE WHEN approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_products,
          COALESCE(SUM(clicks_count), 0) as total_clicks
        FROM products
      `);

      res.json({
        success: true,
        stats: {
          ...partnerStats[0],
          ...productStats[0],
        },
      });
      return;
    }

    const stats = {
      total_partners: memoryStore.partners.length,
      pending_partners: memoryStore.partners.filter((p) => p.status === 'PENDING').length,
      approved_partners: memoryStore.partners.filter((p) => p.status === 'APPROVED').length,
      total_products: memoryStore.products.length,
      pending_products: memoryStore.products.filter((p) => p.approval_status === 'PENDING').length,
      approved_products: memoryStore.products.filter((p) => p.approval_status === 'APPROVED').length,
      total_clicks: memoryStore.products.reduce((acc, p) => acc + (p.clicks_count || 0), 0),
    };

    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get all partners (with optional status filter)
export async function getAllPartners(req: Request, res: Response) {
  try {
    const { status } = req.query;

    if (isConnectedToMySQL && mysqlPool) {
      let sql = 'SELECT id, partner_id, full_name, email, mobile_number, profile_image, status, rejection_reason, created_at FROM partners';
      const params: any[] = [];
      if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
      }
      sql += ' ORDER BY id DESC';

      const [rows]: any = await mysqlPool.execute(sql, params);
      res.json({ success: true, partners: rows });
      return;
    }

    let partners = [...memoryStore.partners];
    if (status) {
      partners = partners.filter((p) => p.status === status);
    }
    partners.sort((a, b) => b.id - a.id);

    res.json({
      success: true,
      partners: partners.map(({ password_hash, ...rest }) => rest),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Approve or Reject Partner
export async function updatePartnerStatus(req: Request, res: Response) {
  try {
    const partnerId = parseInt(req.params.id, 10);
    const { status, rejection_reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING', 'SUSPENDED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status code.' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        'UPDATE partners SET status = ?, rejection_reason = ?, approved_at = IF(? = "APPROVED", NOW(), approved_at) WHERE id = ?',
        [status, rejection_reason || null, status, partnerId]
      );
      res.json({ success: true, message: `Partner status updated to ${status}.` });
      return;
    }

    const partner = memoryStore.partners.find((p) => p.id === partnerId);
    if (!partner) {
      res.status(404).json({ success: false, message: 'Partner not found.' });
      return;
    }

    partner.status = status;
    partner.rejection_reason = rejection_reason || null;
    saveStore();

    res.json({ success: true, message: `Partner status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get all products for admin review
export async function getAdminProducts(req: Request, res: Response) {
  try {
    const { approval_status } = req.query;

    if (isConnectedToMySQL && mysqlPool) {
      let sql = `
        SELECT 
          p.*,
          c.name AS category_name,
          ap.name AS platform_name,
          pt.partner_id AS partner_code, pt.full_name AS partner_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
      `;
      const params: any[] = [];
      if (approval_status) {
        sql += ' WHERE p.approval_status = ?';
        params.push(approval_status);
      }
      sql += ' ORDER BY p.id DESC';

      const [rows]: any = await mysqlPool.execute(sql, params);
      res.json({ success: true, products: rows });
      return;
    }

    let prods = [...memoryStore.products];
    if (approval_status) {
      prods = prods.filter((p) => p.approval_status === approval_status);
    }
    prods.sort((a, b) => b.id - a.id);

    const enriched = prods.map((p) => {
      const category = memoryStore.categories.find((c) => c.id === p.category_id);
      const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
      const partner = memoryStore.partners.find((pt) => pt.id === p.partner_id);
      return {
        ...p,
        category_name: category ? category.name : 'General',
        platform_name: platform ? platform.name : 'Store',
        partner_name: partner ? partner.full_name : 'Admin',
        partner_code: partner ? partner.partner_id : 'STAFF',
      };
    });

    res.json({ success: true, products: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Approve or Reject Product
export async function updateProductApproval(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id, 10);
    const { approval_status, rejection_reason, is_featured, is_trending } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(approval_status)) {
      res.status(400).json({ success: false, message: 'Invalid approval status.' });
      return;
    }

    const pubStatus = approval_status === 'APPROVED' ? 'PUBLISHED' : 'DRAFT';

    if (isConnectedToMySQL && mysqlPool) {
      await mysqlPool.execute(
        `UPDATE products 
         SET approval_status = ?, publication_status = ?, rejection_reason = ?,
             is_featured = COALESCE(?, is_featured),
             is_trending = COALESCE(?, is_trending),
             published_at = IF(? = 'APPROVED', NOW(), published_at)
         WHERE id = ?`,
        [approval_status, pubStatus, rejection_reason || null, is_featured ?? null, is_trending ?? null, approval_status, productId]
      );
      res.json({ success: true, message: `Product ${approval_status.toLowerCase()} successfully.` });
      return;
    }

    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    prod.approval_status = approval_status;
    prod.publication_status = pubStatus;
    prod.rejection_reason = rejection_reason || null;
    if (typeof is_featured === 'boolean' || typeof is_featured === 'number') prod.is_featured = Number(is_featured);
    if (typeof is_trending === 'boolean' || typeof is_trending === 'number') prod.is_trending = Number(is_trending);
    if (approval_status === 'APPROVED') prod.published_at = new Date().toISOString();
    saveStore();

    res.json({ success: true, message: `Product ${approval_status.toLowerCase()} successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update Website Settings
export async function updateSettings(req: Request, res: Response) {
  try {
    const settings: Record<string, string> = req.body;

    if (isConnectedToMySQL && mysqlPool) {
      for (const [key, val] of Object.entries(settings)) {
        await mysqlPool.execute(
          `INSERT INTO website_settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, String(val), String(val)]
        );
      }
      res.json({ success: true, message: 'Website settings saved to MySQL successfully.' });
      return;
    }

    for (const [key, val] of Object.entries(settings)) {
      memoryStore.website_settings[key] = String(val);
    }
    saveStore();

    res.json({ success: true, message: 'Website settings updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Add/Update Banner
export async function manageBanner(req: Request, res: Response) {
  try {
    const { id, title, subtitle, image_url, cta_text, cta_link, badge_text, banner_type, display_order, is_active } = req.body;

    if (!title || !image_url) {
      res.status(400).json({ success: false, message: 'Title and image URL are required.' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      if (id) {
        await mysqlPool.execute(
          `UPDATE banners SET title = ?, subtitle = ?, image_url = ?, cta_text = ?, cta_link = ?, badge_text = ?, banner_type = ?, display_order = ?, is_active = ? WHERE id = ?`,
          [title, subtitle || '', image_url, cta_text || 'Shop Now', cta_link || '#', badge_text || '', banner_type || 'HERO', display_order || 0, is_active ?? 1, id]
        );
      } else {
        await mysqlPool.execute(
          `INSERT INTO banners (title, subtitle, image_url, cta_text, cta_link, badge_text, banner_type, display_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, subtitle || '', image_url, cta_text || 'Shop Now', cta_link || '#', badge_text || '', banner_type || 'HERO', display_order || 0, is_active ?? 1]
        );
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
        title,
        subtitle: subtitle || '',
        image_url,
        cta_text: cta_text || 'Shop Now',
        cta_link: cta_link || '#',
        badge_text: badge_text || '',
        banner_type: banner_type || 'HERO',
        display_order: display_order || 0,
        is_active: is_active ?? 1,
      };
      memoryStore.banners.push(newBanner);
    }
    saveStore();

    res.json({ success: true, message: 'Banner saved.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
