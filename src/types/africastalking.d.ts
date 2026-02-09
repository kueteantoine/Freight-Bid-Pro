--Add type declaration for africastalking module
declare module 'africastalking' {
    interface AfricasTalkingOptions {
        apiKey: string;
        username: string;
    }

    interface SMSOptions {
        to: string[];
        message: string;
        from?: string;
    }

    interface SMSRecipient {
        status: string;
        messageId: string;
        number: string;
        cost: string;
    }

    interface SMSResponse {
        SMSMessageData: {
            Message: string;
            Recipients: SMSRecipient[];
        };
    }

    interface ApplicationData {
        UserData: {
            balance: string;
        };
    }

    interface AfricasTalkingClient {
        SMS: {
            send(options: SMSOptions): Promise<SMSResponse>;
        };
        APPLICATION: {
            fetchApplicationData(): Promise<ApplicationData>;
        };
    }

    function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingClient;

    export = AfricasTalking;
}
