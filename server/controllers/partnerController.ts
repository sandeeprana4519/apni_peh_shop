import { Request, Response } from 'express';
import { isConnectedToMySQL, mysqlPool, memoryStore, saveStore } from '../db.js';

// Get partner dashboard statistics
export async function getPartnerStats(req: Request, res: Response) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute(
        `SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN approval_status = 'PENDING' THEN 1 ELSE 0 END) as pending_products,
          SUM(CASE WHEN approval_status = 'APPROVED' AND publication_status = 'PUBLISHED' THEN 1 ELSE 0 END) as approved_products,
          SUM(CASE WHEN approval_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_products,
          COALESCE(SUM(clicks_count), 0) as total_clicks
         FROM products
         WHERE partner_id = ?`,
        [partnerId]
      );

      const stats = rows[0] || {
        total_products: 0,
        pending_products: 0,
        approved_products: 0,
        rejected_products: 0,
        total_clicks: 0,
      };

      res.json({ success: true, stats });
      return;
    }

    const partnerProducts = memoryStore.products.filter((p) => p.partner_id === partnerId);
    const stats = {
      total_products: partnerProducts.length,
      pending_products: partnerProducts.filter((p) => p.approval_status === 'PENDING').length,
      approved_products: partnerProducts.filter(
        (p) => p.approval_status === 'APPROVED' && p.publication_status === 'PUBLISHED'
      ).length,
      rejected_products: partnerProducts.filter((p) => p.approval_status === 'REJECTED').length,
      total_clicks: partnerProducts.reduce((sum, p) => sum + (p.clicks_count || 0), 0),
    };

    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Get logged in partner's own products
export async function getPartnerProducts(req: Request, res: Response) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        SELECT 
          p.id, p.product_name, p.slug, p.image_url, p.description,
          p.price, p.original_mrp, p.currency, p.affiliate_url,
          p.approval_status, p.publication_status, p.rejection_reason,
          p.clicks_count, p.created_at, p.published_at,
          c.id AS category_id, c.name AS category_name,
          ap.id AS platform_id, ap.name AS platform_name, ap.badge_color AS platform_badge_color
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        WHERE p.partner_id = ?
        ORDER BY p.created_at DESC
      `;
      const [rows]: any = await mysqlPool.execute(sql, [partnerId]);
      res.json({ success: true, products: rows });
      return;
    }

    const ownProducts = memoryStore.products
      .filter((p) => p.partner_id === partnerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((p) => {
        const category = memoryStore.categories.find((c) => c.id === p.category_id);
        const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
        return {
          ...p,
          category_name: category ? category.name : 'General',
          platform_name: platform ? platform.name : 'Store',
          platform_badge_color: platform ? platform.badge_color : '#2563EB',
        };
      });

    res.json({ success: true, products: ownProducts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Add New Product by Authenticated Partner
export async function addPartnerProduct(req: Request, res: Response) {
  try {
    const partnerId = req.session.partnerId;
    if (!partnerId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      product_name,
      image_url,
      category_id,
      platform_id,
      price,
      original_mrp,
      affiliate_url,
      description,
    } = req.body;

    // Strict validations
    if (!product_name || typeof product_name !== 'string' || product_name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Product name is required.' });
      return;
    }

    if (!image_url || typeof image_url !== 'string') {
      res.status(400).json({ success: false, message: 'Product image is required.' });
      return;
    }

    if (!category_id) {
      res.status(400).json({ success: false, message: 'Please select a product category.' });
      return;
    }

    if (!platform_id) {
      res.status(400).json({ success: false, message: 'Please select an affiliate platform.' });
      return;
    }

    if (!affiliate_url || typeof affiliate_url !== 'string' || (!affiliate_url.startsWith('http://') && !affiliate_url.startsWith('https://'))) {
      res.status(400).json({ success: false, message: 'A valid affiliate URL starting with http:// or https:// is required.' });
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
          price, original_mrp, currency, affiliate_url, added_by_role, partner_id,
          approval_status, publication_status, is_featured, is_trending, clicks_count, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 'INR', ?, 'PARTNER', ?,
          'PENDING', 'DRAFT', 0, 0, 0, NOW()
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
        partnerId,
      ]);

      res.status(201).json({
        success: true,
        message: 'Product submitted successfully! It is now pending admin review before public listing.',
        productId: result.insertId,
      });
      return;
    }

    // Local engine insertion
    const newProduct = {
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
      rating: 5.0,
      reviews_count: 0,
      affiliate_url: affiliate_url.trim(),
      added_by_role: 'PARTNER',
      partner_id: partnerId,
      approval_status: 'PENDING',
      publication_status: 'DRAFT',
      rejection_reason: null,
      is_featured: 0,
      is_trending: 0,
      display_priority: 0,
      views_count: 0,
      clicks_count: 0,
      created_at: new Date().toISOString(),
      published_at: null,
    };

    memoryStore.products.push(newProduct);
    saveStore();

    res.status(201).json({
      success: true,
      message: 'Product submitted successfully! It is currently pending admin review before going live.',
      product: newProduct,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Delete Own Product
export async function deletePartnerProduct(req: Request, res: Response) {
  try {
    const partnerId = req.session.partnerId;
    const productId = parseInt(req.params.id, 10);

    if (!partnerId || !productId) {
      res.status(400).json({ success: false, message: 'Invalid request' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      // Must enforce partner_id ownership in query
      const [result]: any = await mysqlPool.execute('DELETE FROM products WHERE id = ? AND partner_id = ?', [
        productId,
        partnerId,
      ]);
      if (result.affectedRows === 0) {
        res.status(403).json({ success: false, message: 'Product not found or not owned by you.' });
        return;
      }
      res.json({ success: true, message: 'Product deleted.' });
      return;
    }

    const idx = memoryStore.products.findIndex((p) => p.id === productId && p.partner_id === partnerId);
    if (idx === -1) {
      res.status(403).json({ success: false, message: 'Product not found or not owned by you.' });
      return;
    }

    memoryStore.products.splice(idx, 1);
    saveStore();

    res.json({ success: true, message: 'Product deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
