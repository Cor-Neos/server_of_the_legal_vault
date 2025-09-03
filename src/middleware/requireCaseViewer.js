// Allow only Admin and Lawyer to access full case list endpoints.
export default function requireCaseViewer(req, res, next) {
  const role = req.user?.user_role;
  if (!role) return res.status(401).json({ message: 'Unauthorized: missing role' });
  if (!['Admin','Lawyer'].includes(role)) {
    return res.status(403).json({ message: 'Access denied. Only Admin or Lawyer can view all cases.' });
  }
  next();
}