# Environment Variables for SMS & Email Integration

Add these environment variables to your `.env.local` file:

```env
# =====================================================
# SMS Configuration (Africa's Talking)
# =====================================================
# Get your credentials from: https://account.africastalking.com/
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_USERNAME=your_username_here
AFRICAS_TALKING_SENDER_ID=FreightBidPro

# =====================================================
# Email Configuration (Resend)
# =====================================================
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@freightbidpro.com
RESEND_FROM_NAME=Freight Bid Pro

# =====================================================
# Application URL (for webhooks)
# =====================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Get API Credentials

### Africa's Talking (SMS)
1. Sign up at https://africastalking.com/
2. Go to your dashboard
3. Navigate to "Settings" → "API Key"
4. Copy your API Key and Username
5. Set up a Sender ID in "SMS" → "Sender IDs"

### Resend (Email)
1. Sign up at https://resend.com/
2. Go to "API Keys" in the dashboard
3. Click "Create API Key"
4. Copy the key (starts with `re_`)
5. Verify your sending domain in "Domains" section

## Testing

Once you've added the credentials:

1. **Test SMS**: Use the `/api/test-sms` endpoint (create this for testing)
2. **Test Email**: Use the `/api/test-email` endpoint (create this for testing)
3. **Check Logs**: View delivery logs in the admin panel

## Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Use different API keys for development and production
- Rotate API keys periodically
- Monitor usage to detect unauthorized access
