import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // JWT was signed with { userId } but controllers expect { id }
    // Normalize here once so every controller can use req.user.id
    req.user = {
      ...decoded,
      id: decoded.id ?? decoded.userId,
    }
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' })
  }
}

export { authMiddleware as protect }
export default authMiddleware