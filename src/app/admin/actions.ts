"use server";

export async function verifyAdminPassword(password: string) {
  // If ADMIN_PASSWORD is not set in env, we default to something secure or reject
  const correctPassword = process.env.ADMIN_PASSWORD;
  
  if (!correctPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set!");
    return false;
  }
  
  return password === correctPassword;
}
