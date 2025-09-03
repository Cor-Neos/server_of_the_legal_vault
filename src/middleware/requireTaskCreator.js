// Middleware: allow only Admin and Lawyer roles to proceed for task creation endpoints
// Usage: import and place after verifyUser in route definition
export default function requireTaskCreator(req, res, next) {
  try {
    const role = req.user?.user_role || req.user?.role; // support different token claim keys
    if (!role) return res.status(403).json({ message: 'Role not found in token' });
    const allowed = ['Admin', 'Lawyer'];
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: 'Only Admin or Lawyer can create tasks' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Role check failed' });
  }
}