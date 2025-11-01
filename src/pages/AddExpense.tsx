import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AddExpense() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Supabase expense creation
    toast({
      title: "Expense Added",
      description: "Your expense has been recorded successfully!",
    });
  };

  return (
    <Layout>
      <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Add Expense</h1>
          <p className="text-muted-foreground">Record a new shared expense</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Fill in the information about the expense</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Expense Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Dinner at restaurant"
                    className="glass-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="glass-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food & Dining</SelectItem>
                      <SelectItem value="transport">Transportation</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="groceries">Groceries</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    className="glass-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Group</Label>
                  <Select>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Roommates</SelectItem>
                      <SelectItem value="2">Weekend Trip</SelectItem>
                      <SelectItem value="3">Office Lunch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payer">Paid By</Label>
                  <Select>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Who paid?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="you">You</SelectItem>
                      <SelectItem value="john">John Doe</SelectItem>
                      <SelectItem value="sarah">Sarah Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Split Method</Label>
                <Tabs defaultValue="equal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="equal">Equal Split</TabsTrigger>
                    <TabsTrigger value="ratio">By Ratio</TabsTrigger>
                    <TabsTrigger value="item">Per Item</TabsTrigger>
                  </TabsList>

                  <TabsContent value="equal" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The expense will be split equally among all group members
                    </p>
                  </TabsContent>

                  <TabsContent value="ratio" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Specify custom percentages for each member
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label htmlFor="member1">Member</Label>
                          <Input id="member1" placeholder="Name" className="glass-input" />
                        </div>
                        <div className="w-24">
                          <Label htmlFor="ratio1">%</Label>
                          <Input id="ratio1" type="number" placeholder="50" className="glass-input" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="item" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Assign specific amounts to each member
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label htmlFor="item-member1">Member</Label>
                          <Input id="item-member1" placeholder="Name" className="glass-input" />
                        </div>
                        <div className="w-32">
                          <Label htmlFor="item-amount1">Amount</Label>
                          <Input id="item-amount1" type="number" step="0.01" placeholder="0.00" className="glass-input" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
