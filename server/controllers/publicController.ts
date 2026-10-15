import { Request, Response } from 'express';
import { isConnectedToMySQL, mysqlPool, memoryStore, saveStore } from '../db.js';

export async function getSettings(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT setting_key, setting_value FROM website_settings');
      const settingsMap: Record<string, string> = {};
      for (const r of rows) {
        settingsMap[r.setting_key] = r.setting_value;
      }
      res.json({ success: true, settings: settingsMap });
      return;
    }

    res.json({ success: true, settings: memoryStore.website_settings });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCategories(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC');
      res.json({ success: true, categories: rows });
      return;
    }

    const categories = memoryStore.categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPlatforms(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM affiliate_platforms WHERE is_active = 1 ORDER BY display_order ASC');
      res.json({ success: true, platforms: rows });
      return;
    }

    const platforms = memoryStore.affiliate_platforms
      .filter((p) => p.is_active)
      .sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, platforms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getBanners(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC');
      res.json({ success: true, banners: rows });
      return;
    }

    const banners = memoryStore.banners
      .filter((b) => b.is_active)
      .sort((a, b) => a.display_order - b.display_order);
    res.json({ success: true, banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getApprovedPartners(_req: Request, res: Response) {
  try {
    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.query(
        'SELECT id, partner_id, full_name, profile_image, created_at FROM partners WHERE status = "APPROVED" ORDER BY id ASC'
      );
      res.json({ success: true, partners: rows });
      return;
    }

    const partners = memoryStore.partners
      .filter((p) => p.status === 'APPROVED')
      .map(({ id, partner_id, full_name, profile_image, created_at }) => ({
        id,
        partner_id,
        full_name,
        profile_image,
        created_at,
      }));
    res.json({ success: true, partners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPublicProducts(req: Request, res: Response) {
  try {
    const {
      search = '',
      category_id,
      platform_id,
      partner_id,
      collection, // 'featured', 'trending', 'latest'
      sort = 'newest', // 'newest', 'price_asc', 'price_desc', 'rating_desc', 'popular'
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    if (isConnectedToMySQL && mysqlPool) {
      let conditions = ['p.approval_status = "APPROVED"', 'p.publication_status = "PUBLISHED"'];
      const params: any[] = [];

      if (search) {
        conditions.push('(p.product_name LIKE ? OR c.name LIKE ? OR ap.name LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      if (category_id) {
        conditions.push('p.category_id = ?');
        params.push(category_id);
      }

      if (platform_id) {
        conditions.push('p.platform_id = ?');
        params.push(platform_id);
      }

      if (partner_id) {
        conditions.push('p.partner_id = ?');
        params.push(partner_id);
      }

      if (collection === 'featured') {
        conditions.push('p.is_featured = 1');
      } else if (collection === 'trending') {
        conditions.push('p.is_trending = 1');
      }

      let orderBy = 'p.created_at DESC';
      if (sort === 'price_asc') orderBy = 'p.price ASC';
      else if (sort === 'price_desc') orderBy = 'p.price DESC';
      else if (sort === 'rating_desc') orderBy = 'p.rating DESC';
      else if (sort === 'popular') orderBy = 'p.clicks_count DESC';

      const whereClause = conditions.join(' AND ');

      const countSql = `
        SELECT COUNT(*) as total 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id 
        WHERE ${whereClause}
      `;
      const [countRows]: any = await mysqlPool.execute(countSql, params);
      const total = countRows[0]?.total || 0;

      const dataSql = `
        SELECT 
          p.id, p.product_name, p.slug, p.image_url, p.description, 
          p.price, p.original_mrp, p.currency, p.rating, p.reviews_count, 
          p.affiliate_url, p.clicks_count, p.created_at,
          c.id AS category_id, c.name AS category_name,
          ap.id AS platform_id, ap.name AS platform_name, ap.badge_color AS platform_badge_color,
          pt.id AS partner_id, pt.partner_id AS partner_code, pt.full_name AS partner_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      const [rows]: any = await mysqlPool.execute(dataSql, [...params, limitNum, offset]);

      res.json({
        success: true,
        products: rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
      return;
    }

    // Local engine query
    let filtered = memoryStore.products.filter(
      (p) => p.approval_status === 'APPROVED' && p.publication_status === 'PUBLISHED'
    );

    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter((p) => {
        const cat = memoryStore.categories.find((c) => c.id === p.category_id);
        const plat = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
        return (
          p.product_name.toLowerCase().includes(q) ||
          (cat && cat.name.toLowerCase().includes(q)) ||
          (plat && plat.name.toLowerCase().includes(q))
        );
      });
    }

    if (category_id) {
      filtered = filtered.filter((p) => p.category_id === Number(category_id));
    }

    if (platform_id) {
      filtered = filtered.filter((p) => p.platform_id === Number(platform_id));
    }

    if (partner_id) {
      filtered = filtered.filter((p) => p.partner_id === Number(partner_id));
    }

    if (collection === 'featured') {
      filtered = filtered.filter((p) => p.is_featured);
    } else if (collection === 'trending') {
      filtered = filtered.filter((p) => p.is_trending);
    }

    if (sort === 'price_asc') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price_desc') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === 'rating_desc') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'popular') {
      filtered.sort((a, b) => (b.clicks_count || 0) - (a.clicks_count || 0));
    } else {
      // newest
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limitNum).map((p) => {
      const category = memoryStore.categories.find((c) => c.id === p.category_id);
      const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === p.platform_id);
      const partner = memoryStore.partners.find((pt) => pt.id === p.partner_id);
      return {
        ...p,
        category_name: category ? category.name : 'General',
        platform_name: platform ? platform.name : 'Store',
        platform_badge_color: platform ? platform.badge_color : '#2563EB',
        partner_name: partner ? partner.full_name : null,
        partner_code: partner ? partner.partner_id : null,
      };
    });

    res.json({
      success: true,
      products: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProductDetails(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    if (isConnectedToMySQL && mysqlPool) {
      const sql = `
        SELECT 
          p.*,
          c.name AS category_name,
          ap.name AS platform_name, ap.badge_color AS platform_badge_color,
          pt.partner_id AS partner_code, pt.full_name AS partner_name, pt.profile_image AS partner_avatar
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN affiliate_platforms ap ON p.platform_id = ap.id
        LEFT JOIN partners pt ON p.partner_id = pt.id
        WHERE p.id = ? AND p.approval_status = 'APPROVED' AND p.publication_status = 'PUBLISHED'
        LIMIT 1
      `;
      const [rows]: any = await mysqlPool.execute(sql, [productId]);
      if (!rows || rows.length === 0) {
        res.status(404).json({ success: false, message: 'Product not found or not published' });
        return;
      }
      res.json({ success: true, product: rows[0] });
      return;
    }

    const product = memoryStore.products.find(
      (p) => p.id === productId && p.approval_status === 'APPROVED' && p.publication_status === 'PUBLISHED'
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found or not published' });
      return;
    }

    const category = memoryStore.categories.find((c) => c.id === product.category_id);
    const platform = memoryStore.affiliate_platforms.find((pl) => pl.id === product.platform_id);
    const partner = memoryStore.partners.find((pt) => pt.id === product.partner_id);

    res.json({
      success: true,
      product: {
        ...product,
        category_name: category ? category.name : 'General',
        platform_name: platform ? platform.name : 'Store',
        platform_badge_color: platform ? platform.badge_color : '#2563EB',
        partner_code: partner ? partner.partner_id : null,
        partner_name: partner ? partner.full_name : null,
        partner_avatar: partner ? partner.profile_image : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function trackAndRedirectClick(req: Request, res: Response) {
  try {
    const productId = parseInt(req.params.id, 10);
    if (!productId) {
      res.status(400).send('Invalid product identifier.');
      return;
    }

    let targetUrl = '';
    let partnerId: number | null = null;
    let platformId: number = 1;

    if (isConnectedToMySQL && mysqlPool) {
      const [rows]: any = await mysqlPool.execute(
        'SELECT affiliate_url, partner_id, platform_id FROM products WHERE id = ? AND approval_status = "APPROVED" LIMIT 1',
        [productId]
      );
      if (!rows || rows.length === 0) {
        res.status(404).send('Product link not available or product is inactive.');
        return;
      }
      targetUrl = rows[0].affiliate_url;
      partnerId = rows[0].partner_id;
      platformId = rows[0].platform_id;

      // Increment click counter
      await mysqlPool.execute('UPDATE products SET clicks_count = clicks_count + 1 WHERE id = ?', [productId]);

      // Record detailed analytics log
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const ua = req.headers['user-agent'] || '';
      const referrer = req.headers['referer'] || '';
      await mysqlPool.execute(
        'INSERT INTO product_clicks (product_id, partner_id, platform_id, affiliate_url, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [productId, partnerId, platformId, targetUrl, String(ip).slice(0, 45), String(ua).slice(0, 255), String(referrer).slice(0, 255)]
      );
    } else {
      const prod = memoryStore.products.find((p) => p.id === productId && p.approval_status === 'APPROVED');
      if (!prod) {
        res.status(404).send('Product link not available or product is inactive.');
        return;
      }
      targetUrl = prod.affiliate_url;
      partnerId = prod.partner_id;
      platformId = prod.platform_id;

      prod.clicks_count = (prod.clicks_count || 0) + 1;
      memoryStore.product_clicks.push({
        id: memoryStore.product_clicks.length + 1,
        product_id: productId,
        partner_id: partnerId,
        platform_id: platformId,
        affiliate_url: targetUrl,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        referrer: req.headers['referer'],
        clicked_at: new Date().toISOString(),
      });
      saveStore();
    }

    // Safety check on redirect URL
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      res.status(400).send('Unsafe or invalid affiliate destination URL.');
      return;
    }

    // Safe 302 temporary redirection to merchant platform
    res.redirect(302, targetUrl);
  } catch (err: any) {
    res.status(500).send(`Redirection error: ${err.message}`);
  }
}
