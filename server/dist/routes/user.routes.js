"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All user management routes are Admin only
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['ADMIN']));
router.get('/', user_controller_1.getUsers);
router.post('/', user_controller_1.createStaffUser);
router.patch('/:id/status', user_controller_1.updateUserStatus);
router.delete('/:id', user_controller_1.deleteUser);
exports.default = router;
