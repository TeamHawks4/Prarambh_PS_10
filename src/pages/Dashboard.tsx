import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp, DollarSign, TrendingUp, Users, Wallet } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Adjust import path as needed

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  payer_id: string;
  settled: boolean; 
  payer_name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardStats {
  totalExpenses: number;
  yourShare: number;
  settled: number;
  unsettled: number;
  monthlyBudget: number | null;
  budgetUsed: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    yourShare: 0,
    settled: 0,
    unsettled: 0,
    monthlyBudget: 0,
    budgetUsed: 0,
  });
  
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all dashboard stats using the RPC function
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;

      if (data) {
        setStats({
          totalExpenses: data.totalExpenses,
          yourShare: data.yourShare,
          settled: data.settled,
          unsettled: data.unsettled,
          monthlyBudget: data.monthlyBudget,
          budgetUsed: data.budgetUsed,
        });
        setRecentExpenses(data.recentExpenses || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const budgetPercentage = (stats.monthlyBudget ?? 0) > 0 ? (stats.budgetUsed / (stats.monthlyBudget ?? 1)) * 100 : 0;

  if (loading) {
    return (
      <Layout>
        <div className="p-8 space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

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
              <div className="text-2xl font-bold">{formatRupees(stats.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Share</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupees(stats.yourShare)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalExpenses > 0 ? `${((stats.yourShare / stats.totalExpenses) * 100).toFixed(1)}% of total` : '0% of total'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settled</CardTitle>
              <ArrowDown className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatRupees(stats.settled)}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid off</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsettled</CardTitle>
              <ArrowUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{formatRupees(stats.unsettled)}</div>
              <p className="text-xs text-muted-foreground mt-1">To be paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
            {stats.monthlyBudget && stats.monthlyBudget > 0 ? (
              <CardDescription>
                {formatRupees(stats.budgetUsed)} of {formatRupees(stats.monthlyBudget)} used
              </CardDescription>
            ) : <CardDescription>No budget set. You can set one in your profile.</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.monthlyBudget && stats.monthlyBudget > 0 && <Progress value={budgetPercentage} className="h-3" />}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{budgetPercentage.toFixed(1)}% spent</span>
              {stats.monthlyBudget && stats.monthlyBudget > 0 && (
                <span className={budgetPercentage > 80 ? "text-warning font-medium" : "text-muted-foreground"}>
                  {formatRupees(stats.monthlyBudget - stats.budgetUsed)} remaining
                </span>
              )}
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
              {recentExpenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No expenses found for this month</p>
              ) : (
                recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid by {expense.payer_name || 'Unknown'} • {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatRupees(expense.amount)}</p>
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
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}