import { Router, Request, Response } from 'express';
import {
  getSettings,
  getCategories,
  getPlatforms,
  getBanners,
  getApprovedPartners,
  getPublicProducts,
  getProductDetails,
} from '../controllers/publicController.js';
import {
  registerPartner,
  loginPartner,
  getPartnerSession,
  updatePartnerProfile,
  logoutPartner,
  loginAdmin,
  getAdminSession,
  logoutAdmin,
} from '../controllers/authController.js';
import {
  getPartnerStats,
  getPartnerProducts,
  addPartnerProduct,
  deletePartnerProduct,
} from '../controllers/partnerController.js';
import {
  getAdminOverview,
  getAllPartners,
  updatePartnerStatus,
  getAdminProducts,
  updateProductApproval,
  updateSettings,
  manageBanner,
} from '../controllers/adminController.js';
import { requirePartnerAuth, requireAdminAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getDatabaseStatus } from '../db.js';

const router = Router();

// System / Database status check
router.get('/status', (_req: Request, res: Response) => {
  res.json({ success: true, database: getDatabaseStatus() });
});

// Secure image upload handler
router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded or file type rejected.' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Public Storefront Endpoints
router.get('/settings', getSettings);
router.get('/categories', getCategories);
router.get('/platforms', getPlatforms);
router.get('/banners', getBanners);
router.get('/partners/approved', getApprovedPartners);
router.get('/products', getPublicProducts);
router.get('/products/:id', getProductDetails);

// Partner Authentication
router.post('/auth/register', registerPartner);
router.post('/auth/login', loginPartner);
router.get('/auth/session', getPartnerSession);
router.post('/auth/logout', logoutPartner);
router.put('/auth/profile', requirePartnerAuth, updatePartnerProfile);

// Admin Authentication
router.post('/auth/admin/login', loginAdmin);
router.get('/auth/admin/session', getAdminSession);
router.post('/auth/admin/logout', logoutAdmin);

// Partner Dashboard (Ownership Enforced)
router.get('/partner/stats', requirePartnerAuth, getPartnerStats);
router.get('/partner/products', requirePartnerAuth, getPartnerProducts);
router.post('/partner/products', requirePartnerAuth, addPartnerProduct);
router.delete('/partner/products/:id', requirePartnerAuth, deletePartnerProduct);

// Admin CRM & Review (Supports quick toggle / superadmin access)
router.get('/admin/overview', getAdminOverview);
router.get('/admin/partners', getAllPartners);
router.put('/admin/partners/:id/status', updatePartnerStatus);
router.get('/admin/products', getAdminProducts);
router.put('/admin/products/:id/approval', updateProductApproval);
router.post('/admin/settings', updateSettings);
router.post('/admin/banner', manageBanner);

export default router;
