import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
);

export interface User {
    id: string;
    email: string;
    name: string;
    role: "citizen" | "department_head" | "supervisor" | "field_worker" | "clerk_operator" | "technician";
}

export interface CustomJWTPayload {
    userId: string;
    email: string;
    name: string;
    role: "citizen" | "department_head" | "supervisor" | "field_worker" | "clerk_operator" | "technician";
    exp: number;
}

// Mock user database - replace with real database
const users: User[] = [
    {
        id: "1",
        email: "admin@city.gov",
        name: "Admin User",
        role: "department_head",
    },
    {
        id: "2",
        email: "citizen@example.com",
        name: "John Citizen",
        role: "citizen",
    },
];

// Mock password storage - replace with real database
const userPasswords: Record<string, string> = {
    "admin@city.gov":
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    "citizen@example.com":
        "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
};

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function signToken(
    payload: Omit<CustomJWTPayload, "exp">
): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .setIssuedAt()
        .sign(secret);
}

export async function verifyToken(token: string): Promise<CustomJWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as CustomJWTPayload;
    } catch (error) {
        return null;
    }
}

export async function authenticateUser(
    email: string,
    password: string
): Promise<User | null> {
    const user = users.find((u) => u.email === email);
    if (!user) return null;

    const hashedPassword = userPasswords[email];
    if (!hashedPassword) return null;

    const isValid = await verifyPassword(password, hashedPassword);
    if (!isValid) return null;

    return user;
}

export function getUserById(id: string): User | null {
    return users.find((u) => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
    return users.find((u) => u.email === email) || null;
}
