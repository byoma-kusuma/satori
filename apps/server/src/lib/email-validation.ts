export function isAllowedEmail(email: string): boolean {
  // Get allowed test users from environment
  const testUsers = process.env.TEST_USERS?.split(',').map(user => user.trim()) || [];
  
  // Get test organization domains from environment (support multiple domains)
  const testOrgs = process.env.TEST_ORG?.split(',').map(org => org.trim()) || [];
  
  // Check if email is in the test users list
  if (testUsers.includes(email)) {
    return true;
  }
  
  // Check if email ends with any of the test organization domains
  for (const org of testOrgs) {
    if (org && email.endsWith(`@${org}`)) {
      return true;
    }
  }
  
  return false;
}

export function validateEmailForSignup(email: string): void {
  console.log(`[EMAIL_VALIDATION] Checking email: ${email}`);
  
  if (!isAllowedEmail(email)) {
    console.log(`[EMAIL_VALIDATION] REJECTED: ${email}`);
    const allowedDomains = process.env.TEST_ORG?.split(',').map(org => `@${org.trim()}`).join(', ') || '';
    throw new Error(`Email ${email} is not authorized for signup. Only test users and emails from domains: ${allowedDomains} are allowed.`);
  }
  
  console.log(`[EMAIL_VALIDATION] APPROVED: ${email}`);
}