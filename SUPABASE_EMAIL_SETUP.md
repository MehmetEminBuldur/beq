# Supabase Email Configuration Guide

This guide explains how to configure email settings in Supabase to ensure activation emails are sent properly.

## Current Issues
- ✅ **Fixed**: Redirect user to login page after account creation
- ✅ **Fixed**: Improved signup flow with better error messages
- 📧 **Email Configuration**: May need setup depending on environment

## Supabase Email Settings

### 1. Development Mode
In development mode, Supabase uses a development SMTP server that may not send actual emails. Check your Supabase project settings:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Check the **SMTP Settings** section

### 2. Production Email Setup

For production, you need to configure a proper SMTP provider:

#### Option 1: Use Supabase's Built-in Email (Recommended for small projects)
- Supabase provides basic email functionality out of the box
- Limited to 30 emails per hour in the free tier
- Go to **Authentication** > **Settings** > **SMTP Settings**
- Ensure "Enable custom SMTP" is disabled to use built-in service

#### Option 2: Custom SMTP Provider (Recommended for production)
Popular providers:
- **SendGrid**: Reliable with good free tier
- **Mailgun**: Developer-friendly with good API
- **AWS SES**: Cost-effective for high volume
- **Resend**: Modern email API with good developer experience

To configure:
1. Go to **Authentication** > **Settings** > **SMTP Settings**
2. Enable "Enable custom SMTP"
3. Fill in your SMTP provider details:
   - **Host**: SMTP server (e.g., smtp.sendgrid.net)
   - **Port**: Usually 587 for TLS or 465 for SSL
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password or API key

### 3. Email Templates

Customize the email templates in **Authentication** > **Email Templates**:

- **Confirm signup**: Sent when user creates account
- **Reset password**: Sent for password reset
- **Change email**: Sent when user changes email

### 4. URL Configuration

Ensure the redirect URLs are properly configured:

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL**: Your main application URL (e.g., https://your-app.com)
3. Add **Redirect URLs**: All valid redirect URLs for your app
   - For development: `http://localhost:3000/auth?verified=true`
   - For production: `https://your-app.com/auth?verified=true`

## Code Implementation

The current implementation includes:

### 1. Enhanced Signup Process (`use-auth.ts`)
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: fullName },
    emailRedirectTo: `${window.location.origin}/auth?verified=true`,
  },
});
```

### 2. Email Verification Handling (`auth/page.tsx`)
```typescript
useEffect(() => {
  const verified = searchParams?.get('verified');
  if (verified === 'true') {
    toast.success('Email verified successfully! You can now sign in.');
    setMode('signin');
  }
}, [searchParams]);
```

### 3. User-Friendly Messages
- Clear success/error messages
- Automatic redirect to login after signup
- Email verification confirmation

## Testing Email Flow

### Development Testing
1. Create a test account
2. Check browser console for Supabase auth events
3. Check your email (including spam folder)
4. Look for confirmation link

### Production Testing
1. Test with real email addresses
2. Verify SMTP settings are working
3. Check email delivery rates in your SMTP provider dashboard
4. Test on different email providers (Gmail, Outlook, etc.)

## Troubleshooting

### Common Issues

1. **Emails not being sent**
   - Check SMTP configuration
   - Verify SMTP provider credentials
   - Check rate limits
   - Ensure site URL is configured correctly

2. **Emails going to spam**
   - Configure SPF records
   - Set up DKIM authentication
   - Use reputable SMTP provider
   - Customize email templates to look professional

3. **Redirect not working**
   - Check URL configuration in Supabase
   - Verify redirect URL is in allowed list
   - Ensure frontend handles `verified=true` parameter

4. **Users can't find email**
   - Add clear instructions in UI
   - Provide "resend email" functionality
   - Check spam folder reminder

### Environment Variables Check

Ensure these are properly set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Next Steps

1. **Immediate**: Configure SMTP settings in Supabase dashboard
2. **Short-term**: Set up production SMTP provider
3. **Long-term**: Implement email analytics and monitoring

## Support

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [SMTP Configuration Guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)