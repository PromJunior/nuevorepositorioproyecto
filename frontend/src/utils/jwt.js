import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
    if (!token) return null;

    try {
        return jwtDecode(token);
    } catch {
        return null;
    }
};

export const isTokenExpired = (token) => {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return true;

    return decoded.exp <= Date.now() / 1000;
};

export const getUserFromToken = (token) => {
    const decoded = decodeToken(token);
    if (!decoded) return null;

    return {
        username: decoded.sub || decoded.username || null,
        email: decoded.email || null,
        role: decoded.role || null,
        raw: decoded,
    };
};
