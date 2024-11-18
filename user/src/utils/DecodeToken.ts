import jwt from 'jsonwebtoken';
export async function decodeToken(req: any, res: any) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    // Remove the "Bearer " prefix using replace
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // Decode the token (this doesn't validate the signature)
    const decoded = jwt.decode(token) as any | null;

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    return decoded;
}