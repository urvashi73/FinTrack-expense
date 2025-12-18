"use server";

import db from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createAccount(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const balanceFloat = parseFloat(data.balance);
  if (isNaN(balanceFloat)) throw new Error("Invalid balance");

  const existingAccounts = await db.account.findMany({
    where: { userId: user.id },
  });

  const shouldBeDefault =
    existingAccounts.length === 0 ? true : data.isDefault;

  if (shouldBeDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  await db.account.create({
    data: {
      ...data,
      balance: balanceFloat,
      userId: user.id,
      isDefault: shouldBeDefault,
    },
  });

  revalidatePath("/dashboard");
}
