import { sendEmail } from "@/actions/send-email";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Lazy-load Prisma so it is NEVER initialized during build
 */
async function getDb() {
  const { default: db } = await import("../prisma");
  return db;
}

/* -------------------- BUDGET ALERT -------------------- */

export const checkBudgetAlert = inngest.createFunction(
  { id: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      const db = await getDb();
      return db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: { where: { isDefault: true } },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue;

      await step.run(`check-budget-${budget.id}`, async () => {
        const db = await getDb();

        const currentDate = new Date();
        const startOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const endOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const percentageUsed = (totalExpenses / budget.amount) * 100;

        if (
          percentageUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: Number(budget.amount).toFixed(1),
                totalExpenses: totalExpenses.toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

function isNewMonth(last, current) {
  return (
    last.getMonth() !== current.getMonth() ||
    last.getFullYear() !== current.getFullYear()
  );
}

/* -------------------- RECURRING TRANSACTIONS -------------------- */

export const triggerRecurringTransactions = inngest.createFunction(
  { id: "trigger-recurring-transactions" },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const recurring = await step.run(
      "fetch-recurring-transactions",
      async () => {
        const db = await getDb();
        return db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              { nextRecurringDate: { lte: new Date() } },
            ],
          },
        });
      }
    );

    if (recurring.length > 0) {
      await inngest.send(
        recurring.map((t) => ({
          name: "transaction.recurring.process",
          data: { transactionId: t.id, userId: t.userId },
        }))
      );
    }

    return { triggered: recurring.length };
  }
);

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    throttle: { limit: 10, period: "1m", key: "event.data.userId" },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    await step.run("process-transaction", async () => {
      const db = await getDb();

      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: { account: true },
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      await db.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            ...transaction,
            id: undefined,
            date: new Date(),
            isRecurring: false,
          },
        });

        const delta =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: delta } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

function isTransactionDue(t) {
  return !t.lastProcessed || new Date(t.nextRecurringDate) <= new Date();
}

function calculateNextRecurringDate(date, interval) {
  const d = new Date(date);
  if (interval === "DAILY") d.setDate(d.getDate() + 1);
  if (interval === "WEEKLY") d.setDate(d.getDate() + 7);
  if (interval === "MONTHLY") d.setMonth(d.getMonth() + 1);
  if (interval === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  return d;
}

/* -------------------- MONTHLY REPORTS -------------------- */

export const generateMonthlyReports = inngest.createFunction(
  { id: "generate-monthly-reports" },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      const db = await getDb();
      return db.user.findMany({ include: { accounts: true } });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const insights = await generateFinancialInsights(
          stats,
          lastMonth.toLocaleString("default", { month: "long" })
        );

        await sendEmail({
          to: user.email,
          subject: "Your Monthly Financial Report",
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: { stats, insights },
          }),
        });
      });
    }
  }
);

async function getMonthlyStats(userId, month) {
  const db = await getDb();

  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const txs = await db.transaction.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });

  return txs.reduce(
    (s, t) => {
      const amt = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        s.totalExpenses += amt;
        s.byCategory[t.category] =
          (s.byCategory[t.category] || 0) + amt;
      } else s.totalIncome += amt;
      return s;
    },
    { totalIncome: 0, totalExpenses: 0, byCategory: {} }
  );
}

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const res = await model.generateContent(
    `Give 3 concise financial insights for ${month} based on: ${JSON.stringify(
      stats
    )}`
  );

  return JSON.parse(res.response.text());
}
