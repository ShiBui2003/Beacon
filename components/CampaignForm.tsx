"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CampaignForm({
    role,
}: {
    role: "citizen" | "government";
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetAmount, setTargetAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Only insert campaign, no Razorpay
            const { error } = await (supabase as any).from("campaigns").insert([
                {
                    title,
                    description,
                    target_amount: targetAmount,
                    raised_amount: 0,
                    role,
                },
            ]);

            if (error) throw error;

            alert(`✅ Campaign added successfully!`);
            setTitle("");
            setDescription("");
            setTargetAmount(0);
        } catch (err: any) {
            console.error(err);
            alert("❌ Failed to add campaign: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 border p-4 rounded-lg shadow"
        >
            <h2 className="text-xl font-bold">
                {role === "government"
                    ? "Government Project"
                    : "Citizen Request"}
            </h2>

            <input
                type="text"
                placeholder="Campaign Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded"
                required
            />

            <textarea
                placeholder="Campaign Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded"
                required
            />

            <input
                type="number"
                placeholder="Target Amount (₹)"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full border p-2 rounded"
                required
            />

            <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
                {loading ? "Adding..." : "Submit Campaign"}
            </button>
        </form>
    );
}
