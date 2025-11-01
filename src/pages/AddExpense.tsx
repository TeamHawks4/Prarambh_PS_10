import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Group {
  id: string;
  name: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface ExpenseSplit {
  user_id: string;
  amount: number;
  percentage?: number;
}

export default function AddExpense() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [splitMethod, setSplitMethod] = useState("equal");
  const [customSplits, setCustomSplits] = useState<ExpenseSplit[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user's groups
  useEffect(() => {
    fetchUserGroups();
  }, []);

  // Fetch group members when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup);
    } else {
      setGroupMembers([]);
    }
  }, [selectedGroup]);

  const fetchUserGroups = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add expenses",
          variant: "destructive",
        });
        return;
      }

      const { data: memberships, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      setGroups(groupsData || []);
    } catch (error: any) {
      console.error("Error fetching groups:", error);
      toast({
        title: "Error loading groups",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        setGroupMembers([]);
        return;
      }

      const userIds = membersData.map(member => member.user_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const members: GroupMember[] = (profilesData || []).map(profile => ({
        id: profile.id,
        user_id: profile.id,
        full_name: profile.full_name || "Unknown User",
        email: profile.email || ""
      }));

      setGroupMembers(members);

      if (members.length > 0) {
        initializeEqualSplits(members);
      }
    } catch (error: any) {
      console.error("Error fetching group members:", error);
      toast({
        title: "Error loading group members",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const initializeEqualSplits = (members: GroupMember[]) => {
    const equalAmount = totalAmount > 0 ? totalAmount / members.length : 0;
    const equalPercentage = 100 / members.length;
    
    const equalSplits = members.map(member => ({
      user_id: member.user_id,
      amount: parseFloat(equalAmount.toFixed(2)),
      percentage: parseFloat(equalPercentage.toFixed(2))
    }));
    setCustomSplits(equalSplits);
  };

  const handleAmountChange = (amount: number) => {
    setTotalAmount(amount);
    
    if (groupMembers.length > 0) {
      if (splitMethod === "equal") {
        const equalAmount = amount / groupMembers.length;
        const equalPercentage = 100 / groupMembers.length;
        
        const updatedSplits = groupMembers.map(member => ({
          user_id: member.user_id,
          amount: parseFloat(equalAmount.toFixed(2)),
          percentage: parseFloat(equalPercentage.toFixed(2))
        }));
        setCustomSplits(updatedSplits);
      } else if (splitMethod === "ratio") {
        // Update amounts based on existing percentages
        const updatedSplits = customSplits.map(split => ({
          ...split,
          amount: parseFloat((amount * (split.percentage || 0) / 100).toFixed(2))
        }));
        setCustomSplits(updatedSplits);
      }
      // For "amount" method, let users input amounts manually
    }
  };

  const handleCustomSplitChange = (index: number, field: string, value: string) => {
    const updatedSplits = [...customSplits];
    
    if (!updatedSplits[index]) return;
    
    if (field === "percentage") {
      const percentage = parseFloat(value) || 0;
      updatedSplits[index] = {
        ...updatedSplits[index],
        percentage: percentage,
        amount: parseFloat((totalAmount * percentage / 100).toFixed(2))
      };
    } else if (field === "amount") {
      const amount = parseFloat(value) || 0;
      updatedSplits[index] = {
        ...updatedSplits[index],
        amount: amount,
        percentage: parseFloat(((amount / totalAmount) * 100).toFixed(2))
      };
    }
    
    setCustomSplits(updatedSplits);
  };

  const validateSplits = (): boolean => {
    if (splitMethod === "equal") {
      return true; // Equal split is always valid
    }
    
    if (splitMethod === "ratio") {
      const totalPercentage = customSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
      return Math.abs(totalPercentage - 100) < 0.01;
    }
    
    if (splitMethod === "amount") {
      const totalSplitAmount = customSplits.reduce((sum, split) => sum + split.amount, 0);
      return Math.abs(totalSplitAmount - totalAmount) < 0.01;
    }
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const category = formData.get("category") as string;
    const date = formData.get("date") as string;
    const payerId = formData.get("payer") as string;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      if (!selectedGroup) {
        throw new Error("Please select a group");
      }

      if (!payerId) {
        throw new Error("Please select who paid for this expense");
      }

      // Validate splits based on the current split method
      if (!validateSplits()) {
        if (splitMethod === "ratio") {
          const totalPercentage = customSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
          throw new Error(`Percentages must total 100% (current total: ${totalPercentage.toFixed(1)}%)`);
        } else if (splitMethod === "amount") {
          const totalSplitAmount = customSplits.reduce((sum, split) => sum + split.amount, 0);
          throw new Error(`Split amounts (₹${totalSplitAmount.toFixed(2)}) don't match total amount (₹${amount.toFixed(2)})`);
        }
      }

      // Final validation - ensure split amounts match total
      const totalSplitAmount = customSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplitAmount - amount) > 0.01) {
        // Auto-adjust the last split to make totals match
        const adjustedSplits = [...customSplits];
        const difference = amount - totalSplitAmount;
        if (adjustedSplits.length > 0) {
          adjustedSplits[adjustedSplits.length - 1] = {
            ...adjustedSplits[adjustedSplits.length - 1],
            amount: parseFloat((adjustedSplits[adjustedSplits.length - 1].amount + difference).toFixed(2))
          };
        }
        setCustomSplits(adjustedSplits);
      }

      // 1. Create the expense record
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([
          {
            group_id: selectedGroup,
            description: title,
            amount: amount,
            paid_by: payerId,
            created_by: user.id,
            category: category,
            created_at: date ? new Date(date + 'T00:00:00').toISOString() : new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (expenseError) {
        console.error("Expense creation error:", expenseError);
        throw new Error(`Failed to create expense: ${expenseError.message}`);
      }

      // 2. Create the expense splits
      const splitsToInsert = customSplits.map(split => ({
        expense_id: expense.id,
        user_id: split.user_id,
        amount: split.amount,
        percentage: split.percentage,
      }));

      const { error: splitsError } = await supabase.from('expense_splits').insert(splitsToInsert);

      if (splitsError) {
        throw new Error(`Failed to create expense splits: ${splitsError.message}`);
      }

      toast({
        title: "Expense Added Successfully!",
        description: `"${title}" has been recorded for ₹${amount.toFixed(2)}`,
      });

      // Reset form
      (e.target as HTMLFormElement).reset();
      setSelectedGroup("");
      setGroupMembers([]);
      setCustomSplits([]);
      setTotalAmount(0);
      
      setTimeout(() => {
        navigate("/groups");
      }, 1500);

    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast({
        title: "Error adding expense",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update splits when split method changes
  useEffect(() => {
    if (groupMembers.length > 0 && totalAmount > 0) {
      handleAmountChange(totalAmount);
    }
  }, [splitMethod]);

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
                  <Label htmlFor="title">Expense Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Dinner at restaurant"
                    className="glass-input"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="glass-input"
                    required
                    disabled={isLoading}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required disabled={isLoading}>
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
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    className="glass-input"
                    required
                    disabled={isLoading}
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">Group *</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup} required disabled={isLoading}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payer">Paid By *</Label>
                  <Select name="payer" required disabled={isLoading || !selectedGroup || groupMembers.length === 0}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder={groupMembers.length === 0 ? "No members found" : "Who paid?"} />
                    </SelectTrigger>
                    <SelectContent>
                      {groupMembers.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedGroup && groupMembers.length > 0 && (
                <div className="space-y-4">
                  <Label>Split Method</Label>
                  <Tabs value={splitMethod} onValueChange={setSplitMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="equal">Equal Split</TabsTrigger>
                      <TabsTrigger value="ratio">By Ratio</TabsTrigger>
                      <TabsTrigger value="amount">By Amount</TabsTrigger>
                    </TabsList>

                    <TabsContent value="equal" className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        The expense will be split equally among all {groupMembers.length} group members
                      </p>
                      {customSplits.length > 0 && (
                        <div className="space-y-2">
                          {customSplits.map((split, index) => {
                            const member = groupMembers.find(m => m.user_id === split.user_id);
                            return (
                              <div key={split.user_id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <span className="font-medium">{member?.full_name}</span>
                                <span className="text-primary font-bold">₹{split.amount.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="ratio" className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Specify custom percentages for each member (must total 100%)
                      </p>
                      <div className="space-y-3">
                        {groupMembers.map((member, index) => (
                          <div key={member.user_id} className="flex gap-4 items-center p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <Label className="font-medium">{member.full_name}</Label>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                            <div className="w-24">
                              <Label htmlFor={`percentage-${index}`}>Percentage %</Label>
                              <Input
                                id={`percentage-${index}`}
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                placeholder="0"
                                className="glass-input"
                                value={customSplits[index]?.percentage || 0}
                                onChange={(e) => handleCustomSplitChange(index, "percentage", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="w-32 text-right">
                              <div className="text-sm text-muted-foreground">Amount</div>
                              <div className="font-bold text-primary">
                                ₹{customSplits[index]?.amount.toFixed(2) || "0.00"}
                              </div>
                            </div>
                          </div>
                        ))}
                        {totalAmount > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-medium">Total</span>
                            <div className="text-right">
                              <div className="font-bold text-primary">₹{totalAmount.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">
                                {customSplits.reduce((sum, split) => sum + (split.percentage || 0), 0).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="amount" className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Assign specific amounts to each member
                      </p>
                      <div className="space-y-3">
                        {groupMembers.map((member, index) => (
                          <div key={member.user_id} className="flex gap-4 items-center p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <Label className="font-medium">{member.full_name}</Label>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                            <div className="w-32">
                              <Label htmlFor={`amount-${index}`}>Amount ₹</Label>
                              <Input
                                id={`amount-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="glass-input"
                                value={customSplits[index]?.amount || 0}
                                onChange={(e) => handleCustomSplitChange(index, "amount", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        ))}
                        {totalAmount > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-medium">Total</span>
                            <div className="text-right">
                              <div className="font-bold text-primary">₹{totalAmount.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">
                                ₹{customSplits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)} assigned
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Expense...
                  </>
                ) : (
                  "Add Expense"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}