const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createUser,
  getUsers,
  getUserById,
  updateUser
} = require("../controllers/userController");

// All user management routes require valid authentication and at least Manager or Admin role
router.use(protect);
router.use(authorizeRoles("admin", "manager"));

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);

module.exports = router;
