"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bed_controller_1 = require("../controllers/bed.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public/authenticated bed list & stats
router.get('/', bed_controller_1.getBeds);
router.get('/stats', bed_controller_1.getBedStats);
router.get('/:id', bed_controller_1.getBedById);
// Bed status update - Allowed for Admin & Doctor
router.patch('/:id/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN', 'DOCTOR']), bed_controller_1.updateBedStatus);
// Bed CRUD - Admin only
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), bed_controller_1.createBed);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), bed_controller_1.updateBedDetails);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']), bed_controller_1.deleteBed);
exports.default = router;
