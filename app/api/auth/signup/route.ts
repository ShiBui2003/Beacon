import { NextRequest, NextResponse } from "next/server";
import { hashPassword, getUserByEmail, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, role } = await request.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // In a real app, save user to DB here
        // For mock, just return success
        const user = {
            id: Math.random().toString(36).substring(2),
            name,
            email,
            role,
        };

        // Issue JWT token
        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        const response = NextResponse.json({
            user,
            token,
        });
        response.cookies.set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        return NextResponse.json(
            { error: "Signup failed" },
            { status: 500 }
        );
    }
}
