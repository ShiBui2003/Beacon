import { createClient } from "@/lib/supabase/client";

// Types
export interface Department {
    id: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    head_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    head?: {
        full_name: string;
        email: string;
    };
}

// Cache for departments (client-side only)
let departmentsCache: Department[] | null = null;

/**
 * Fetch all departments from Supabase (client-side)
 */
export async function getDepartments(): Promise<Department[]> {

    const supabase = createClient();

    const { data: departments, error } = await (supabase as any)
        .from("departments")
        .select(
            `
      *,
      head:head_id(full_name, email)
    `
        )
        .eq("is_active", true)
        .order("name");

    if (error) {
        console.error("Error fetching departments:", error);
        return [];
    }

    departmentsCache = departments || [];
    
    if (departmentsCache) {
        return departmentsCache;
    } else {
        return [];
    }
}

/**
 * Get all available categories (department names from database)
 */
export async function getAllCategories(): Promise<string[]> {
    try {
        const departments = await getDepartments();
        return departments.map((dept) => dept.name).sort();
    } catch (error) {
        console.error("Error fetching categories from departments:", error);
        // Fallback to a minimal set if database fails
        return [
            "Public Works",
            "Transportation",
            "Environment",
            "Health & Safety",
            "Utilities",
            "General",
        ].sort();
    }
}

/**
 * Get department name by ID or key
 */
export async function getDepartmentName(
    departmentIdOrKey: string
): Promise<string> {
    const departments = await getDepartments();

    // Try to find by ID first
    let department = departments.find((d) => d.id === departmentIdOrKey);

    // If not found by ID, try to find by name (for backward compatibility with old keys)
    if (!department) {
        const keyToNameMap: Record<string, string> = {
            "public-works": "Public Works",
            transportation: "Transportation",
            environment: "Environmental Services",
            health: "Public Safety",
            utilities: "Utilities",
            general: "General Services",
        };

        const expectedName = keyToNameMap[departmentIdOrKey];
        if (expectedName) {
            department = departments.find((d) => d.name === expectedName);
        }
    }

    return department?.name || "Unknown Department";
}

/**
 * Get categories that a department handles
 * Since categories are now department names, each department handles its own name as a category
 */
export async function getDepartmentCategories(
    departmentIdOrKey: string
): Promise<string[]> {
    const departments = await getDepartments();

    // Try to find by ID first
    let department = departments.find((d) => d.id === departmentIdOrKey);

    // If not found by ID, try to find by name (for backward compatibility)
    if (!department) {
        const keyToNameMap: Record<string, string> = {
            "public-works": "Public Works",
            transportation: "Transportation",
            environment: "Environmental Services",
            health: "Public Safety",
            utilities: "Utilities",
            general: "General Services",
        };

        const expectedName = keyToNameMap[departmentIdOrKey];
        if (expectedName) {
            department = departments.find((d) => d.name === expectedName);
        }
    }

    if (!department) return [];

    // Each department handles its own name as a category
    return [department.name];
}

/**
 * Check if an issue belongs to a specific department
 * Since categories are now department names, simply check if the issue's category matches the department name
 */
export async function isIssueForDepartment(
    issue: any,
    departmentIdOrKey: string
): Promise<boolean> {
    if (!issue) return false;

    const departments = await getDepartments();

    // Find the department
    let department = departments.find((d) => d.id === departmentIdOrKey);

    // If not found by ID, try to find by name (for backward compatibility)
    if (!department) {
        const keyToNameMap: Record<string, string> = {
            "public-works": "Public Works",
            transportation: "Transportation",
            environment: "Environmental Services",
            health: "Public Safety",
            utilities: "Utilities",
            general: "General Services",
        };

        const expectedName = keyToNameMap[departmentIdOrKey];
        if (expectedName) {
            department = departments.find((d) => d.name === expectedName);
        }
    }

    if (!department) return false;

    // Since categories are now department names, simply check if the issue's category matches the department name
    return (
        issue.category &&
        issue.category.toLowerCase() === department.name.toLowerCase()
    );
}

/**
 * Get suggested departments for a category
 * Since categories are now department names, find the department that matches the category name
 */
export async function getSuggestedDepartments(
    category: string
): Promise<Department[]> {
    const departments = await getDepartments();

    // Find department that matches the category name
    const matchingDept = departments.find(
        (d) => d.name.toLowerCase() === category.toLowerCase()
    );

    if (matchingDept) {
        return [matchingDept];
    }

    // If no specific match, suggest General Services
    const generalDept = departments.find((d) => d.name === "General Services");
    if (generalDept) {
        return [generalDept];
    }

    return [];
}

/**
 * Clear the cache (useful for testing or when departments are updated)
 */
export function clearDepartmentsCache() {
    departmentsCache = null;
}
