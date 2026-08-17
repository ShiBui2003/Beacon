"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import CampaignForm from "@/components/CampaignForm";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Campaign {
    id: string;
    title: string;
    description: string;
    target_amount: number;
    raised_amount: number;
    role: string;
}

export default function CitizenCrowdfundingPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        const { data, error } = await (supabase as any)
            .from("campaigns")
            .select("*");
        if (error) console.error(error);
        else setCampaigns(data || []);
        setLoading(false);
    };

    const handleDonate = async (amount: number, campaign: Campaign) => {
        const res = await fetch("/api/razorpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, campaignId: campaign.id }),
        });

        const dataJson = await res.json();
        if (!dataJson.order) return alert("❌ " + dataJson.error);

        const order = dataJson.order;

        const rzp = new (window as any).Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            amount: order.amount,
            currency: order.currency,
            name: "Citizen Crowdfunding",
            description: campaign.title,
            order_id: order.id,
            handler: async function (response: any) {
                alert(
                    "✅ Payment Successful! Payment ID: " +
                        response.razorpay_payment_id
                );
                await (supabase as any)
                    .from("campaigns")
                    .update({ raised_amount: campaign.raised_amount + amount })
                    .eq("id", campaign.id);
                fetchCampaigns();
            },
            prefill: { name: "", email: "" },
            theme: { color: "#3399cc" },
        });

        rzp.open();
    };

    return (
        <main className="p-6">
            <h1 className="text-3xl font-bold mb-6">Citizen Crowdfunding</h1>
            <CampaignForm role="citizen" />
            <h2 className="text-2xl font-semibold mt-10 mb-4">All Campaigns</h2>
            {loading ? (
                <p>Loading campaigns...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((c) => (
                        <div
                            key={c.id}
                            className="border rounded-xl shadow p-4"
                        >
                            <h2 className="text-xl font-semibold">{c.title}</h2>
                            <p className="mt-2 text-sm text-gray-700">
                                {c.description}
                            </p>
                            <p className="mt-3 font-medium">
                                Raised: ₹{c.raised_amount} / ₹{c.target_amount}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Posted by: {c.role}
                            </p>
                            <button
                                onClick={() => handleDonate(500, c)}
                                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
                            >
                                Donate ₹500
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
