import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, DollarSign, TrendingUp, Users, Wallet } from "lucide-react";
import { Layout } from "@/components/Layout";

export default function Dashboard() {
  // Mock data - will be replaced with Supabase queries
  const stats = {
    totalExpenses: 2450.50,
    yourShare: 980.25,
    settled: 450.00,
    unsettled: 530.25,
    monthlyBudget: 5000,
    budgetUsed: 2450.50,
  };

  const budgetPercentage = (stats.budgetUsed / stats.monthlyBudget) * 100;

  const recentExpenses = [
    { id: 1, title: "Dinner at Restaurant", amount: 120.50, date: "2024-01-15", payer: "John", settled: false },
    { id: 2, title: "Grocery Shopping", amount: 85.20, date: "2024-01-14", payer: "You", settled: true },
    { id: 3, title: "Movie Tickets", amount: 45.00, date: "2024-01-13", payer: "Sarah", settled: false },
  ];

  return (
    <Layout>
      <div className="p-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your shared expenses</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Share</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.yourShare.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">40% of total</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settled</CardTitle>
              <ArrowDown className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${stats.settled.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid off</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsettled</CardTitle>
              <ArrowUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">${stats.unsettled.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">To be paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
            <CardDescription>
              ${stats.budgetUsed.toFixed(2)} of ${stats.monthlyBudget.toFixed(2)} used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={budgetPercentage} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{budgetPercentage.toFixed(1)}% spent</span>
              <span className={budgetPercentage > 80 ? "text-warning font-medium" : "text-muted-foreground"}>
                ${(stats.monthlyBudget - stats.budgetUsed).toFixed(2)} remaining
              </span>
            </div>
            {budgetPercentage > 80 && (
              <p className="text-sm text-warning">⚠️ You're approaching your monthly budget limit!</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Your latest shared transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid by {expense.payer} • {expense.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${expense.amount.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        expense.settled
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {expense.settled ? "Settled" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
