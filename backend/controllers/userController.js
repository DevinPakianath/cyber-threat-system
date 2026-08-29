const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// CREATE USER (ADMIN & MANAGER)
// Admin: Can create Manager and Employee (and assign managerId)
// Manager: Can ONLY create Employee (automatically assigned to themselves)
// ============================================================================
const createUser = async (req, res) => {
  try {
    const { username, email, password, role = "employee", managerId = null, mustChangePassword = false } = req.body;
    const callerRole = req.user.role || "employee";
    const callerId = req.user.id;

    // 1. Validation
    if (!username || typeof username !== "string" || username.trim().length < 2 || username.trim().length > 50) {
      return res.status(400).json({ message: "Username must be 2–50 characters" });
    }

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    // 2. Check email uniqueness
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    let finalRole = role;
    let finalManagerId = null;

    // 3. Role-based permission enforcement
    if (callerRole === "manager") {
      // Managers can ONLY create employees
      if (role === "admin" || role === "manager") {
        return res.status(403).json({
          message: "Managers are not authorized to create Admin or Manager accounts"
        });
      }
      finalRole = "employee";
      // Force managerId to be the creating manager
      finalManagerId = callerId;
    } else if (callerRole === "admin") {
      // Admin can create Manager or Employee accounts
      if (!["manager", "employee"].includes(role)) {
        return res.status(400).json({
          message: "Admins can create 'manager' and 'employee' accounts. Invalid role specified."
        });
      }
      finalRole = role;

      // If assigning a manager to an employee, verify the manager exists and has role 'manager'
      if (finalRole === "employee" && managerId) {
        if (!mongoose.Types.ObjectId.isValid(managerId)) {
          return res.status(400).json({ message: "Invalid managerId format" });
        }
        const managerUser = await User.findById(managerId);
        if (!managerUser || managerUser.role !== "manager") {
          return res.status(400).json({ message: "Assigned manager does not exist or is not a Manager" });
        }
        finalManagerId = managerId;
      }
    } else {
      return res.status(403).json({ message: "Employees cannot create users" });
    }

    // 4. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: finalRole,
      managerId: finalManagerId,
      isActive: true,
      mustChangePassword: Boolean(mustChangePassword)
    });

    await newUser.save();

    res.status(201).json({
      message: `${finalRole.charAt(0).toUpperCase() + finalRole.slice(1)} account created successfully ✅`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        managerId: newUser.managerId,
        isActive: newUser.isActive,
        mustChangePassword: newUser.mustChangePassword,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("createUser error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ============================================================================
// GET USERS
// Admin: Can view all users (or filter by role / managerId)
// Manager: Can ONLY view employees assigned to them
// ============================================================================
const getUsers = async (req, res) => {
  try {
    const callerRole = req.user.role || "employee";
    const callerId = req.user.id;

    let query = {};

    if (callerRole === "admin") {
      // Optional filters for admin
      if (req.query.role && ["admin", "manager", "employee"].includes(req.query.role)) {
        query.role = req.query.role;
      }
      if (req.query.managerId && mongoose.Types.ObjectId.isValid(req.query.managerId)) {
        query.managerId = req.query.managerId;
      }
    } else if (callerRole === "manager") {
      // Manager can ONLY see their assigned employees
      query = {
        managerId: callerId,
        role: "employee"
      };
    } else {
      return res.status(403).json({ message: "Access denied. Employees cannot view user lists." });
    }

    const users = await User.find(query)
      .select("-password")
      .populate("managerId", "username email role")
      .sort({ createdAt: -1 });

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error("getUsers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ============================================================================
// GET SINGLE USER BY ID
// Admin: Can view any user
// Manager: Can view only themselves or their assigned employees
// ============================================================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const callerRole = req.user.role || "employee";
    const callerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const targetUser = await User.findById(id)
      .select("-password")
      .populate("managerId", "username email role");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (callerRole === "manager") {
      const managerIdStr = targetUser.managerId?._id
        ? targetUser.managerId._id.toString()
        : targetUser.managerId?.toString();
      const isAssignedEmployee = managerIdStr === callerId && targetUser.role === "employee";
      const isSelf = targetUser._id.toString() === callerId;

      if (!isAssignedEmployee && !isSelf) {
        return res.status(403).json({
          message: "Access denied. You can only view employees assigned to your management."
        });
      }
    } else if (callerRole !== "admin") {
      if (targetUser._id.toString() !== callerId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json({ user: targetUser });
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ============================================================================
// UPDATE USER (Status, Role, Manager Assignment, Password Reset)
// Admin: Can update status, role, managerId, reset password
// Manager: Can ONLY activate/deactivate their own assigned employees
// ============================================================================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role, managerId, username, email, password, mustChangePassword } = req.body;
    const callerRole = req.user.role || "employee";
    const callerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (callerRole === "manager") {
      // 1. Target must be an employee assigned to this manager
      const managerIdStr = targetUser.managerId ? targetUser.managerId.toString() : null;
      const isAssigned = managerIdStr === callerId && targetUser.role === "employee";
      if (!isAssigned) {
        return res.status(403).json({
          message: "Access denied. Managers can only manage their own assigned employees."
        });
      }

      // 2. Managers CANNOT change role or reassign manager
      if (role && role !== "employee") {
        return res.status(403).json({ message: "Managers cannot change user roles" });
      }
      if (managerId !== undefined && (managerId === null || managerId.toString() !== callerId)) {
        return res.status(403).json({ message: "Managers cannot reassign employees to another manager" });
      }

      // 3. Manager can update isActive, username, or reset password for their employee
      if (typeof isActive === "boolean") {
        targetUser.isActive = isActive;
      }
      if (username && typeof username === "string" && username.trim().length >= 2) {
        targetUser.username = username.trim();
      }
      if (password !== undefined) {
        if (typeof password !== "string" || password.length < 8) {
          return res.status(400).json({ message: "Password must be at least 8 characters" });
        }
        targetUser.password = await bcrypt.hash(password, 10);
        targetUser.mustChangePassword = true;
      }
      if (typeof mustChangePassword === "boolean") {
        targetUser.mustChangePassword = mustChangePassword;
      }
    } else if (callerRole === "admin") {
      // Admin permissions
      if (typeof isActive === "boolean") {
        // Prevent admin from deactivating their own account
        if (targetUser._id.toString() === callerId && isActive === false) {
          return res.status(400).json({ message: "Admins cannot deactivate their own account" });
        }
        targetUser.isActive = isActive;
      }

      if (role && ["admin", "manager", "employee"].includes(role)) {
        // Prevent admin from demoting themselves if they are the operating admin
        if (targetUser._id.toString() === callerId && role !== "admin") {
          return res.status(400).json({ message: "You cannot change your own admin role" });
        }
        targetUser.role = role;
        if (role !== "employee") {
          targetUser.managerId = null; // Admins and Managers don't report to managers
        }
      }

      if (targetUser.role === "employee" && managerId !== undefined) {
        if (managerId === null || managerId === "") {
          targetUser.managerId = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).json({ message: "Invalid managerId format" });
          }
          const managerObj = await User.findById(managerId);
          if (!managerObj || managerObj.role !== "manager") {
            return res.status(400).json({ message: "Assigned user is not a valid Manager" });
          }
          targetUser.managerId = managerId;
        }
      }

      if (username && typeof username === "string" && username.trim().length >= 2) {
        targetUser.username = username.trim();
      }

      if (email && typeof email === "string") {
        const normalizedEmail = email.toLowerCase().trim();
        if (!EMAIL_RE.test(normalizedEmail)) {
          return res.status(400).json({ message: "A valid email is required" });
        }
        if (normalizedEmail !== targetUser.email) {
          const emailExists = await User.findOne({ email: normalizedEmail });
          if (emailExists) {
            return res.status(400).json({ message: "A user with this email already exists" });
          }
          targetUser.email = normalizedEmail;
        }
      }

      if (password !== undefined) {
        if (typeof password !== "string" || password.length < 8) {
          return res.status(400).json({ message: "Password must be at least 8 characters" });
        }
        targetUser.password = await bcrypt.hash(password, 10);
        targetUser.mustChangePassword = typeof mustChangePassword === "boolean" ? mustChangePassword : true;
      } else if (typeof mustChangePassword === "boolean") {
        targetUser.mustChangePassword = mustChangePassword;
      }
    } else {
      return res.status(403).json({ message: "Access denied. Employees cannot update user accounts." });
    }

    await targetUser.save();

    res.json({
      message: "User updated successfully ✅",
      user: {
        id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        managerId: targetUser.managerId,
        isActive: targetUser.isActive,
        mustChangePassword: targetUser.mustChangePassword,
        updatedAt: targetUser.updatedAt
      }
    });
  } catch (error) {
    console.error("updateUser error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser
};
