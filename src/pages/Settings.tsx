import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Shield, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated!",
    });
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your app preferences</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="new-expense">New Expense Added</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone adds a new expense to your groups
                  </p>
                </div>
                <Switch id="new-expense" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="payment-request">Payment Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications when someone requests payment
                  </p>
                </div>
                <Switch id="payment-request" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="budget-alert">Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerts when approaching your monthly budget limit
                  </p>
                </div>
                <Switch id="budget-alert" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="weekly-summary">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your expenses
                  </p>
                </div>
                <Switch id="weekly-summary" />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Privacy & Security</CardTitle>
              </div>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to other group members
                  </p>
                </div>
                <Switch id="profile-visibility" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="expense-visibility">Show My Expenses</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow group members to see expenses you've paid
                  </p>
                </div>
                <Switch id="expense-visibility" defaultChecked />
              </div>

              <div className="pt-4 space-y-3">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize the look and feel of the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Currently using Dark Mode
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Dark Mode
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleSave}>
            Save All Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
}
