"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medicalRecord_controller_1 = require("../controllers/medicalRecord.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, medicalRecord_controller_1.getMedicalRecords);
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['DOCTOR', 'ADMIN']), medicalRecord_controller_1.createMedicalRecord);
exports.default = router;
