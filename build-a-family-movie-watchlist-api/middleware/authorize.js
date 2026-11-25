
export function authorizeModification(req, res, next) {
  const user = req.user;
  const targetUserId = Number(req.params.userId);

  if (user.role === "parent") {
    return next();
  }

  if (
    user.role === "child" &&
    Number(user.id) === targetUserId
  ) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied"
  });
}
