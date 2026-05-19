import express, { RequestHandler } from 'express';
import multer from 'multer';
import upload from '../middlewares/uploads';
import { verifyToken } from '../middlewares/auth';
import { requireAdmin, requireRole } from '../middlewares/requireAdmin';
// dsd 
import { adminLogin, adminMe, adminChangePassword, adminForgotPassword, adminResetPassword } from '../controllers/authController';
import { createAdminUser, getAdminUsers, getAdminUserById, updateAdminUser, deactivateAdminUser, resendInvite } from '../controllers/userController';
import { getHomePageData, updateHomePage } from '../controllers/homeController';
import { getSiteSettings, updateSiteSettings } from '../controllers/siteSettingsController';
import { createProduct, getAllProducts, getProductBySlug, updateProduct, deleteProduct, reorderProducts, searchProducts } from '../controllers/productController';
import { createPlan, getAllPlans, getPlanBySlug, updatePlan, deletePlan, reorderPlans } from '../controllers/planController';
import { getProfitabilityPage, updateProfitabilityPage } from '../controllers/profitabilityController';
import { getContactPage, updateContactPage } from '../controllers/contactPageController';
import { getServiceRequestPage, updateServiceRequestPage } from '../controllers/serviceRequestPageController';
import { getShopPage, updateShopPage } from '../controllers/shopPageController';
import { getTrackTicketPage, updateTrackTicketPage } from '../controllers/trackTicketPageController';
import { createNavLink, getNavLinks, updateNavLink, deleteNavLink, reorderNavLinks } from '../controllers/navController';
import { createLead, getLeads, getLeadById, updateLead, addLeadNote, deleteLead } from '../controllers/leadController';
import { createTeamMember, getAllTeamMembers, updateTeamMember, deleteTeamMember, reorderTeamMembers } from '../controllers/teamController';
import { createSoftwarePartner, getAllSoftwarePartners, updateSoftwarePartner, deleteSoftwarePartner, reorderSoftwarePartners } from '../controllers/softwarePartnerController';
import { createTicket, getTicketById, getTickets, getTicketByIdAdmin, updateTicket, addTicketStep, updateTicketStep, deleteTicketStep } from '../controllers/ticketController';
import { uploadMedia, getMedia, deleteMedia } from '../controllers/mediaController';
import { getAuditLogs } from '../controllers/auditController';

const router = express.Router();

/* ─────────── HOME (aggregated public payload) ─────────── */
router.get('/home-pagedata', getHomePageData);

/* ─────────── SITE SETTINGS ─────────── */
router.get('/site-settings', getSiteSettings);

/* ─────────── PAGES — public read ─────────── */
router.get('/page/profitability',    getProfitabilityPage);
router.get('/page/contact',          getContactPage);
router.get('/page/service-request',  getServiceRequestPage);
router.get('/page/shop',             getShopPage);
router.get('/page/track-ticket',     getTrackTicketPage);

/* ─────────── PRODUCTS ─────────── */
const productMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
  .fields([{ name: 'images', maxCount: 10 }, { name: 'gallery', maxCount: 10 }]);

router.post('/create-product',    verifyToken, requireAdmin, productMemory, createProduct);
router.get('/get-products',        getAllProducts);
router.get('/get-product/:slug',   getProductBySlug);
router.put('/edit-product/:id',    verifyToken, requireAdmin, productMemory, updateProduct);
router.post('/delete-product',     verifyToken, requireAdmin, deleteProduct);
router.post('/reorder-products',   verifyToken, requireAdmin, reorderProducts);
router.post('/search-products',    searchProducts as RequestHandler);

/* ─────────── PLANS ─────────── */
router.post('/create-plan',    verifyToken, requireAdmin, createPlan);
router.get('/get-plans',       getAllPlans);
router.get('/get-plan/:slug',  getPlanBySlug);
router.put('/update-plan/:id', verifyToken, requireAdmin, updatePlan);
router.post('/delete-plan',    verifyToken, requireAdmin, deletePlan);
router.post('/reorder-plans',  verifyToken, requireAdmin, reorderPlans);

/* ─────────── TEAM ─────────── */
const teamMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
  .single('avatar');

router.get('/get-team',            getAllTeamMembers);
router.post('/admin/create-team',  verifyToken, requireAdmin, teamMemory, createTeamMember);
router.put('/admin/update-team/:id', verifyToken, requireAdmin, teamMemory, updateTeamMember);
router.post('/admin/delete-team',  verifyToken, requireAdmin, deleteTeamMember);
router.post('/admin/reorder-team', verifyToken, requireAdmin, reorderTeamMembers);

/* ─────────── SOFTWARE PARTNERS ─────────── */
const partnerMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
  .single('logo');

router.get('/get-software-partners',             getAllSoftwarePartners);
router.post('/admin/create-software-partner',    verifyToken, requireAdmin, partnerMemory, createSoftwarePartner);
router.put('/admin/update-software-partner/:id', verifyToken, requireAdmin, partnerMemory, updateSoftwarePartner);
router.post('/admin/delete-software-partner',    verifyToken, requireAdmin, deleteSoftwarePartner);
router.post('/admin/reorder-software-partners',  verifyToken, requireAdmin, reorderSoftwarePartners);

/* ─────────── NAV ─────────── */
router.get('/get-nav',          getNavLinks);
router.post('/create-nav',      verifyToken, requireAdmin, createNavLink);
router.put('/update-nav/:id',   verifyToken, requireAdmin, updateNavLink);
router.post('/delete-nav',      verifyToken, requireAdmin, deleteNavLink);
router.post('/reorder-nav',     verifyToken, requireAdmin, reorderNavLinks);

/* ─────────── LEADS ─────────── */
router.post('/create-lead',              createLead);
router.get('/admin/get-leads',           verifyToken, requireAdmin, getLeads);
router.get('/admin/get-lead/:id',        verifyToken, requireAdmin, getLeadById);
router.put('/admin/update-lead/:id',     verifyToken, requireAdmin, updateLead);
router.post('/admin/lead-note',          verifyToken, requireAdmin, addLeadNote);
router.post('/admin/delete-lead',        verifyToken, requireRole('super-admin'), deleteLead);

/* ─────────── TICKETS ─────────── */
router.post('/create-ticket',                  createTicket);
router.get('/get-ticket/:ticketId',            getTicketById);
router.get('/admin/get-tickets',               verifyToken, requireAdmin, getTickets);
router.get('/admin/get-ticket/:id',            verifyToken, requireAdmin, getTicketByIdAdmin);
router.put('/admin/update-ticket/:id',         verifyToken, requireAdmin, updateTicket);
router.post('/admin/ticket-step/add',          verifyToken, requireAdmin, addTicketStep);
router.post('/admin/ticket-step/update',       verifyToken, requireAdmin, updateTicketStep);
router.post('/admin/ticket-step/delete',       verifyToken, requireAdmin, deleteTicketStep);

/* ─────────── MEDIA ─────────── */
router.post('/admin/upload-media',   verifyToken, requireAdmin, upload.single('file'), uploadMedia);
router.get('/admin/get-media',       verifyToken, requireAdmin, getMedia);
router.post('/admin/delete-media',   verifyToken, requireAdmin, deleteMedia);

/* ─────────── ADMIN — page singletons (write) ─────────── */
router.put('/admin/update-home-page',              verifyToken, requireAdmin, updateHomePage);
router.put('/admin/update-site-settings',          verifyToken, requireAdmin, updateSiteSettings);
router.put('/admin/update-page/profitability',     verifyToken, requireAdmin, updateProfitabilityPage);
router.put('/admin/update-page/contact',           verifyToken, requireAdmin, updateContactPage);
router.put('/admin/update-page/service-request',   verifyToken, requireAdmin, updateServiceRequestPage);
router.put('/admin/update-page/shop',              verifyToken, requireAdmin, updateShopPage);
router.put('/admin/update-page/track-ticket',      verifyToken, requireAdmin, updateTrackTicketPage);

/* ─────────── ADMIN — auth ─────────── */
router.post('/admin/login',           adminLogin);
router.get('/admin/me',               verifyToken, adminMe);
router.post('/admin/change-password', verifyToken, adminChangePassword);
router.post('/admin/forgot-password', adminForgotPassword);
router.post('/admin/reset-password',  adminResetPassword);

/* ─────────── ADMIN — team users (super-admin only) ─────────── */
router.post('/admin/create-user',      verifyToken, requireRole('super-admin'), createAdminUser);
router.get('/admin/get-users',         verifyToken, requireRole('super-admin'), getAdminUsers);
router.get('/admin/get-user/:id',      verifyToken, requireRole('super-admin'), getAdminUserById);
router.put('/admin/update-user/:id',   verifyToken, requireRole('super-admin'), updateAdminUser);
router.post('/admin/deactivate-user',  verifyToken, requireRole('super-admin'), deactivateAdminUser);
router.post('/admin/resend-invite',    verifyToken, requireRole('super-admin'), resendInvite);

/* ─────────── ADMIN — audit log ─────────── */
router.get('/admin/audit-log', verifyToken, requireRole('super-admin'), getAuditLogs);

export default router;
