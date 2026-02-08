// Interface for payment provider


export interface InitiationResult {
    success: boolean;
    aggregatorTransactionId?: string;
    redirectUrl?: string; // For payment pages
    instructions?: string; // For USSD or manual steps
    error?: string;
}

export interface SplitRecipient {
    accountId: string; // Recipient ID in the aggregator's system
    percentage: number;
}

export interface PaymentInitiationParams {
    amount: number;
    currency: string;
    description: string;
    customerEmail: string;
    customerPhone?: string;
    metadata: Record<string, any>;
    splits?: SplitRecipient[];
    successUrl: string;
    cancelUrl: string;
    reference?: string; // Internal transaction reference (tx_ref)
}

export interface PaymentProvider {
    initiatePayment(params: PaymentInitiationParams): Promise<InitiationResult>;
    verifyWebhook(payload: any, signature: string): Promise<boolean>;
    // Future expansion:
    // processRefund(transactionId: string, amount: number): Promise<boolean>;
    // getSettlementReport(startDate: Date, endDate: Date): Promise<any>;
}
