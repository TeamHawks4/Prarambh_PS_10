import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, DollarSign, PieChart, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  monthly_budget: number | null;
  created_at: string;
}

interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    monthly_budget: "",
  });
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const { toast } = useToast();

  // Fetch user profile and data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          email: profileData.email || "",
          monthly_budget: profileData.monthly_budget?.toString() || "",
        });
      }

      // Fetch user's expenses for analytics
      await fetchExpensesData(userData.user.id);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpensesData = async (userId: string) => {
    try {
      // Get all groups where user is a member
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (groupsError) throw groupsError;

      if (!userGroups || userGroups.length === 0) {
        setCategoryData([]);
        setTotalExpenses(0);
        return;
      }

      const groupIds = userGroups.map(g => g.group_id);

      // Get all expenses from user's groups
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .in('group_id', groupIds);

      if (expensesError) throw expensesError;

      // Calculate total expenses
      const total = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      setTotalExpenses(total);

      // Categorize expenses (you can modify this based on your expense structure)
      const categories = categorizeExpenses(expenses || []);
      setCategoryData(categories);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
    }
  };

  const categorizeExpenses = (expenses: any[]): CategorySpending[] => {
    // Simple categorization based on description keywords
    // You can enhance this with actual category field in expenses table
    const categories: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      const description = expense.description?.toLowerCase() || '';
      let category = "Other";

      if (description.includes('food') || description.includes('restaurant') || description.includes('dinner') || description.includes('lunch')) {
        category = "Food & Dining";
      } else if (description.includes('transport') || description.includes('taxi') || description.includes('fuel') || description.includes('uber')) {
        category = "Transportation";
      } else if (description.includes('movie') || description.includes('entertainment') || description.includes('game') || description.includes('concert')) {
        category = "Entertainment";
      } else if (description.includes('utility') || description.includes('electric') || description.includes('water') || description.includes('internet')) {
        category = "Utilities";
      } else if (description.includes('shopping') || description.includes('clothes') || description.includes('mall')) {
        category = "Shopping";
      }

      categories[category] = (categories[category] || 0) + (expense.amount || 0);
    });

    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categories).map(([name, amount]) => ({
      name,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const updates = {
        full_name: formData.full_name,
        email: formData.email,
        monthly_budget: formData.monthly_budget ? parseFloat(formData.monthly_budget) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userData.user.id);

      if (error) throw error;

      // Update auth email if changed
      if (formData.email !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) throw emailError;
      }

      // Refresh profile data
      await fetchUserData();
      setIsEditing(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      monthly_budget: profile?.monthly_budget?.toString() || "",
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">Profile not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your account and view analytics</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl text-primary-foreground">
                    {getInitials(profile.full_name || "User")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile.full_name || "User"}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Member since</span>
                </div>
                <p className="font-medium">{formatDate(profile.created_at)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Expenses</span>
                </div>
                <p className="font-medium text-xl">${totalExpenses.toFixed(2)}</p>
              </div>
              {profile.monthly_budget && (
                <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Monthly Budget</span>
                  </div>
                  <p className="font-medium text-lg">${profile.monthly_budget.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="settings">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            className="glass-input"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="glass-input"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget">Monthly Budget</Label>
                          <Input
                            id="budget"
                            type="number"
                            value={formData.monthly_budget}
                            onChange={(e) => handleInputChange('monthly_budget', e.target.value)}
                            className="glass-input"
                            disabled={!isEditing}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="flex gap-3">
                          <Button type="submit" size="lg" disabled={isSaving} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="lg" 
                            onClick={handleCancel}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      <CardTitle>Spending by Category</CardTitle>
                    </div>
                    <CardDescription>Your expense breakdown across all groups</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {categoryData.length > 0 ? (
                      categoryData.map((category) => (
                        <div key={category.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{category.name}</span>
                            <span className="text-muted-foreground">
                              ${category.amount.toFixed(2)} ({category.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                              style={{ width: `${category.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No expense data available. Start adding expenses to your groups to see analytics.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Placeholder for ML Forecast */}
                <Card className="glass-card mt-6 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-muted-foreground">ML Forecast (Coming Soon)</CardTitle>
                    <CardDescription>
                      Get AI-powered predictions for next month's expenses and personalized savings suggestions
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}