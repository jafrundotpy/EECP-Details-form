"use server";

export async function verifyAdminPassword(password: string) {
  // Temporary hardcoded password for quick access
  if (password === "merlin2026") {
    return true;
  }
  
  const correctPassword = process.env.ADMIN_PASSWORD;
  if (!correctPassword) {
    return false;
  }
  
  return password === correctPassword;
}
