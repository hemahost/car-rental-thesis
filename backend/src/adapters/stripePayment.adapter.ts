import {
  CreatePaymentIntentInput,
  CreatedPaymentIntent,
  PaymentGateway,
} from "./paymentGateway.adapter";

const Stripe = require("stripe");

export class StripePaymentAdapter implements PaymentGateway {
  private readonly stripe: any;

  constructor(secretKey = process.env.STRIPE_SECRET_KEY as string) {
    this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatedPaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: input.amount,
      currency: input.currency,
      metadata: input.metadata,
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async getPaymentIntentStatus(paymentIntentId: string): Promise<string> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  }

  async refundPaymentIntent(paymentIntentId: string): Promise<void> {
    await this.stripe.refunds.create({ payment_intent: paymentIntentId });
  }

  constructWebhookEvent(payload: unknown, signature: string, webhookSecret: string): unknown {
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export const paymentGateway = new StripePaymentAdapter();
