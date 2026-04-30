export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

export interface CreatedPaymentIntent {
  id: string;
  clientSecret: string | null;
}

export interface PaymentGateway {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatedPaymentIntent>;
  getPaymentIntentStatus(paymentIntentId: string): Promise<string>;
  refundPaymentIntent(paymentIntentId: string): Promise<void>;
  constructWebhookEvent(payload: unknown, signature: string, webhookSecret: string): unknown;
}
