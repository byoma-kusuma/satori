export function isAllowedEmail(email: string): boolean {
  // Get allowed test users from environment
  const testUsers = process.env.TEST_USERS?.split(',').map(user => user.trim()) || [];
  
  // Get test organization domain from environment
  const testOrg = process.env.TEST_ORG?.trim();
  
  // Check if email is in the test users list
  if (testUsers.includes(email)) {
    return true;
  }
  
  // Check if email ends with the test organization domain
  if (testOrg && email.endsWith(`@${testOrg}`)) {
    return true;
  }
  
  return false;
}

export function validateEmailForSignup(email: string): void {
  console.log(`[EMAIL_VALIDATION] Checking email: ${email}`);
  
  if (!isAllowedEmail(email)) {
    console.log(`[EMAIL_VALIDATION] REJECTED: ${email}`);
    throw new Error(`Email ${email} is not authorized for signup. Only test users and ${process.env.TEST_ORG} domain emails are allowed.`);
  }
  
  console.log(`[EMAIL_VALIDATION] APPROVED: ${email}`);
}