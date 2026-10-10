/**
 * Role-based authorization middleware.
 * Must be used AFTER requireAuth so that req.user is populated.
 */

/**
 * checkRole(...roles) — returns 403 if the authenticated user's role
 * is not in the allowed list.
 *
 * Usage: router.get("/admin/stats", requireAuth, checkRole("admin"), handler)
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
};

/**
 * checkActive — returns 403 if the user's account has been deactivated.
 */
const checkActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.isActive === false) {
    return res.status(403).json({
      message: "Your account has been deactivated. Please contact an administrator.",
    });
  }

  next();
};

/**
 * checkDepartment — returns 403 if the officer has no department assigned.
 * Used for officer routes that require department scoping.
 */
const checkDepartment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!req.user.department) {
    return res.status(403).json({
      message: "No department assigned. Please contact an administrator.",
    });
  }

  next();
};

module.exports = {
  checkRole,
  checkActive,
  checkDepartment,
};
