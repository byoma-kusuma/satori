# Azure Communication Services Email Setup Guide

## Overview

This guide covers the DNS configuration required for Azure Communication Services email delivery and how to verify the setup.

## Current Configuration

### QA Environment
- **Email Domain**: `qa.mail.byomakusuma.com`
- **From Address**: `noreply@qa.mail.byomakusuma.com`
- **Azure Service**: `qa-portal-communication.unitedstates.communication.azure.com`

### Production Environment
- **Email Domain**: `prod.mail.byomakusuma.com`
- **From Address**: `noreply@prod.mail.byomakusuma.com`
- **Azure Service**: `prod-portal-communication.unitedstates.communication.azure.com`

---

## Required DNS Records

Azure Communication Services requires specific DNS records to be configured in Cloudflare for email authentication and delivery.

### 1. Get DNS Records from Azure Portal

You need to retrieve the DNS records from Azure Portal:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Communication Service resource
3. Go to **"Email" → "Domains"**
4. Select your custom domain (e.g., `qa.mail.byomakusuma.com`)
5. Click on **"Configure"** or **"Verify"**
6. Copy the DNS records shown

### 2. Required DNS Record Types

Azure Communication Services typically requires these DNS records:

#### SPF Record (TXT)
Authorizes Azure to send emails on behalf of your domain.

```
Type: TXT
Name: qa.mail (or prod.mail)
Value: v=spf1 include:spf.protection.outlook.com -all
```

#### DKIM Records (CNAME)
Two CNAME records for email signing:

```
Type: CNAME
Name: selector1._domainkey.qa.mail
Value: selector1-<your-domain>._domainkey.<region>.azurecomm.net

Type: CNAME
Name: selector2._domainkey.qa.mail
Value: selector2-<your-domain>._domainkey.<region>.azurecomm.net
```

#### Domain Verification (TXT)
Proves you own the domain:

```
Type: TXT
Name: _azurecomm.qa.mail
Value: <verification-code-from-azure>
```

---

## Step-by-Step Setup in Cloudflare

### For QA Environment (`qa.mail.byomakusuma.com`)

1. **Log in to Cloudflare**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select the `byomakusuma.com` domain

2. **Add DNS Records**
   - Go to **DNS** → **Records**
   - Click **Add record** for each DNS record from Azure

3. **Configure Records**
   
   **SPF Record:**
   ```
   Type: TXT
   Name: qa.mail
   Content: v=spf1 include:spf.protection.outlook.com -all
   TTL: Auto
   Proxy status: DNS only (gray cloud)
   ```

   **DKIM Records (get exact values from Azure):**
   ```
   Type: CNAME
   Name: selector1._domainkey.qa.mail
   Target: <value-from-azure>
   TTL: Auto
   Proxy status: DNS only (gray cloud)
   ```
   
   ```
   Type: CNAME
   Name: selector2._domainkey.qa.mail
   Target: <value-from-azure>
   TTL: Auto
   Proxy status: DNS only (gray cloud)
   ```

   **Domain Verification:**
   ```
   Type: TXT
   Name: _azurecomm.qa.mail
   Content: <verification-code-from-azure>
   TTL: Auto
   Proxy status: DNS only (gray cloud)
   ```

4. **Wait for DNS Propagation**
   - DNS changes can take 5-60 minutes to propagate
   - Use `dig` or online tools to verify

5. **Verify in Azure Portal**
   - Return to Azure Portal
   - Click **"Verify"** on your domain
   - Azure will check the DNS records

### For Production Environment (`prod.mail.byomakusuma.com`)

Repeat the same steps above, but use:
- Domain: `prod.mail.byomakusuma.com`
- Get DNS records from the Production Azure Communication Service

---

## Verification Commands

### Check DNS Records

**Check SPF Record:**
```bash
dig TXT qa.mail.byomakusuma.com +short
dig TXT prod.mail.byomakusuma.com +short
```

**Check DKIM Records:**
```bash
dig CNAME selector1._domainkey.qa.mail.byomakusuma.com +short
dig CNAME selector2._domainkey.qa.mail.byomakusuma.com +short
```

**Check Domain Verification:**
```bash
dig TXT _azurecomm.qa.mail.byomakusuma.com +short
```

### Test Email Sending

Once DNS is configured and verified in Azure, test email sending:

**Test QA Email:**
```bash
# SSH into QA VM and check application logs
ssh <QA_SSH_ALIAS> 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml logs -f app | grep -i email'
```

**Test Production Email:**
```bash
# SSH into Production VM and check application logs
ssh <PROD_SSH_ALIAS> 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml logs -f app | grep -i email'
```

---

## Common Issues and Solutions

### Issue 1: Domain Not Verified in Azure

**Symptoms:**
- Azure Portal shows domain as "Not Verified"
- Emails fail to send

**Solution:**
1. Verify DNS records are correctly configured in Cloudflare
2. Wait for DNS propagation (up to 60 minutes)
3. Click "Verify" again in Azure Portal
4. Check DNS records using `dig` commands above

### Issue 2: Emails Not Sending

**Symptoms:**
- Application logs show email errors
- No emails received

**Solution:**
1. Check Azure Communication Service connection string is correct
2. Verify domain is verified in Azure Portal
3. Check application logs for specific error messages
4. Verify SPF and DKIM records are configured

### Issue 3: Emails Going to Spam

**Symptoms:**
- Emails are delivered but go to spam folder

**Solution:**
1. Ensure SPF record is configured correctly
2. Verify both DKIM records are set up
3. Consider adding DMARC record (optional but recommended)
4. Check email content for spam triggers

---

## Optional: DMARC Record

For better email deliverability, add a DMARC record:

```
Type: TXT
Name: _dmarc.qa.mail
Content: v=DMARC1; p=none; rua=mailto:dmarc@byomakusuma.com
TTL: Auto
Proxy status: DNS only
```

This tells receiving servers how to handle emails that fail SPF/DKIM checks.

---

## Monitoring Email Delivery

### Check Azure Communication Service Logs

1. Go to Azure Portal
2. Navigate to your Communication Service
3. Go to **"Monitoring" → "Logs"**
4. Query for email delivery status

### Check Application Logs

**QA:**
```bash
ssh <QA_SSH_ALIAS> 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml logs --tail=100 app | grep -i email'
```

**Production:**
```bash
ssh <PROD_SSH_ALIAS> 'cd /apps/satori/deployment/server && sudo docker compose -f docker-compose.traefik.yml logs --tail=100 app | grep -i email'
```

---

## Testing Email Functionality

### Test User Registration Email

1. Go to your application (QA or Production)
2. Try to register a new user
3. Check if verification email is received
4. Check application logs for email sending status

### Test Password Reset Email

1. Go to forgot password page
2. Enter email address
3. Check if reset email is received
4. Check application logs

---

## Checklist

Use this checklist to ensure email is properly configured:

### Azure Portal
- [ ] Communication Service created
- [ ] Custom email domain added (`qa.mail.byomakusuma.com` and `prod.mail.byomakusuma.com`)
- [ ] DNS records retrieved from Azure
- [ ] Domain verification status: **Verified** ✅

### Cloudflare DNS
- [ ] SPF TXT record added
- [ ] DKIM CNAME record 1 added
- [ ] DKIM CNAME record 2 added
- [ ] Domain verification TXT record added
- [ ] All records set to "DNS only" (gray cloud)
- [ ] DNS propagation complete (verified with `dig`)

### Application Configuration
- [ ] `AZURE_COMMUNICATION_CONNECTION_STRING` configured in `.env`
- [ ] `AZURE_COMMUNICATION_FROM_EMAIL` configured in `.env`
- [ ] `EMAIL_SERVICE_PROVIDER=azure` set in `.env`
- [ ] Application restarted after configuration changes

### Testing
- [ ] Test email sent successfully
- [ ] Email received (check inbox and spam)
- [ ] Application logs show no email errors
- [ ] Azure Portal shows successful email delivery

---

## Getting Help

If you encounter issues:

1. **Check Azure Portal** for domain verification status
2. **Check DNS records** using `dig` commands
3. **Check application logs** for specific error messages
4. **Review Azure Communication Service documentation**: https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/add-custom-verified-domains

---

## Next Steps

After DNS is configured and verified:

1. Test email sending in QA environment first
2. Verify emails are delivered and not marked as spam
3. Once QA is working, verify Production configuration
4. Set up monitoring/alerts for email delivery failures
5. Consider implementing email templates for better user experience
