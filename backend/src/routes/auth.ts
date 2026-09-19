import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Artificial delay to simulate realistic database processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const admin = await prisma.adminUser.findUnique({
      where: { username }
    });

    if (admin && admin.password === password) {
      // In a real app, use JWT. For mock, just return success
      return res.json({ success: true, token: "mock-jwt-token" });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
