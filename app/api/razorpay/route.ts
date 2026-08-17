import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, campaignId } = await req.json();

    if (!amount || !campaignId) {
      return NextResponse.json({ error: "Missing amount or campaignId" }, { status: 400 });
    }

    // Razorpay expects amount in paise
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: campaignId,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: err.message || "Razorpay order creation failed" }, { status: 500 });
  }
}
