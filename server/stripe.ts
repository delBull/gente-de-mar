import Stripe from 'stripe';
import { log } from './vite.js';

if (!process.env.STRIPE_SECRET_KEY && process.env.PAYMENT_MODE === 'production') {
    log("WARNING: STRIPE_SECRET_KEY is not set but PAYMENT_MODE is production");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2025-01-27' as any,
});

export const PAYMENT_MODE = process.env.PAYMENT_MODE || 'sandbox';

export async function createCheckoutSession(params: {
    amount: number;
    currency?: string;
    customerEmail?: string;
    tourName: string;
    bookingId: number;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
}) {
    if (PAYMENT_MODE === 'sandbox') {
        log(`[Stripe Sandbox] Creating mock session for booking ${params.bookingId}`);
        return {
            id: `cs_test_${Math.random().toString(36).substring(7)}`,
            url: `${params.successUrl}?session_id=mock_session_${params.bookingId}`,
            mode: 'sandbox'
        };
    }

    log(`[Stripe Live] Creating session for booking ${params.bookingId}`);
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: params.currency || 'mxn',
                    product_data: {
                        name: params.tourName,
                    },
                    unit_amount: Math.round(params.amount * 100), // Stripe expects cents/centavos
                },
                quantity: 1,
            },
        ],
        customer_email: params.customerEmail,
        mode: 'payment',
        success_url: params.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: params.cancelUrl,
        metadata: {
            bookingId: params.bookingId.toString(),
            ...params.metadata,
        },
    });

    return {
        id: session.id,
        url: session.url,
        mode: 'production'
    };
}

export async function verifyPayment(sessionId: string) {
    if (PAYMENT_MODE === 'sandbox' || sessionId.startsWith('mock_session_')) {
        log(`[Stripe Sandbox] Verifying mock session ${sessionId}`);
        return {
            status: 'paid',
            amount: 0,
            currency: 'mxn',
            paymentIntentId: 'pi_mock_' + sessionId
        };
    }

    log(`[Stripe Live] Verifying session ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
        status: session.payment_status === 'paid' ? 'paid' : 'unpaid',
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'mxn',
        paymentIntentId: session.payment_intent as string,
        customerId: session.customer as string
    };
}

export async function processRefund(paymentIntentId: string, amount?: number) {
    if (PAYMENT_MODE === 'sandbox' || paymentIntentId.startsWith('pi_mock_')) {
        log(`[Stripe Sandbox] Processing mock refund for ${paymentIntentId}`);
        return { status: 'succeeded', amount_refunded: amount || 0 };
    }

    log(`[Stripe Live] Processing refund for ${paymentIntentId}`);
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
        status: refund.status,
        amount_refunded: (refund.amount || 0) / 100
    };
}

export async function createConnectedAccount(email: string) {
    if (PAYMENT_MODE === 'sandbox') {
        log(`[Stripe Sandbox] Creating connected account for ${email}`);
        return {
            id: `acct_mock_${Math.random().toString(36).substring(7)}`,
            type: 'express'
        };
    }

    const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
    });

    return account;
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    if (PAYMENT_MODE === 'sandbox' || accountId.startsWith('acct_mock_')) {
        log(`[Stripe Sandbox] Creating account link for ${accountId}`);
        return {
            url: `${returnUrl}?mock_onboarding=true`
        };
    }

    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    });

    return accountLink;
}
