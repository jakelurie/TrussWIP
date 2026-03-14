import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum deposit is $100" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Truss Account Deposit",
              description: `Add $${amount.toLocaleString()} to your Truss account balance`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/billing?deposit=success&amount=${amount}&userId=${userId}`,
      cancel_url: `${req.nextUrl.origin}/billing?deposit=cancelled`,
      metadata: {
        type: "deposit",
        userId,
        amount: String(amount),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: "Deposit failed" }, { status: 500 });
  }
}