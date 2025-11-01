import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Group {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_by: string;
  created_at: string;
  members: number;
  total_expenses: number;
}

export default function Groups() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch groups and set up real-time subscription
  useEffect(() => {
    fetchGroups();
    
    // Set up real-time subscription for groups
    const subscription = supabase
      .channel('groups_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    // Set up real-time subscription for group members
    const membersSubscription = supabase
      .channel('group_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members'
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      membersSubscription.unsubscribe();
    };
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get user's group memberships first
      const { data: memberships, error: membersError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userData.user.id);

      if (membersError) throw membersError;

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Get basic group info
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // For each group, fetch member count and total expenses
      const groupsWithDetails = await Promise.all(
        groupsData.map(async (group) => {
          // Get member count
          const { count: memberCount, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          if (countError) console.error('Error fetching member count:', countError);

          // Get total expenses
          const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('group_id', group.id);

          if (expensesError) console.error('Error fetching expenses:', expensesError);

          const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            code: group.code,
            created_by: group.created_by,
            created_at: group.created_at,
            members: memberCount || 1,
            total_expenses: totalExpenses
          };
        })
      );

      setGroups(groupsWithDetails);
    } catch (error: any) {
      toast({
        title: "Error fetching groups",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateGroupCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("group-name") as string;
    const description = formData.get("group-description") as string;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      // Create group with unique code
      const groupCode = generateGroupCode();
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            name,
            description,
            code: groupCode,
            created_by: userData.user.id,
          }
        ])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as a member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: group.id,
            user_id: userData.user.id,
            role: 'admin'
          }
        ]);

      if (memberError) throw memberError;

      toast({
        title: "Group Created",
        description: "Your new group has been created successfully!",
      });
      setIsCreateOpen(false);
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('code', joinCode.toUpperCase())
        .single();

      if (groupError) throw groupError;
      if (!group) {
        throw new Error("Group not found");
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', userData.user.id)
        .single();

      if (existingMember) {
        throw new Error("You are already a member of this group");
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: group.id,
            user_id: userData.user.id,
            role: 'member'
          }
        ]);

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: `You've joined ${group.name}!`,
      });
      
      setJoinCode("");
    } catch (error: any) {
      toast({
        title: "Error joining group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: "Group code copied to clipboard!",
    });
  };

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <Layout>
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Groups</h1>
            <p className="text-muted-foreground">Manage your expense groups</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <form onSubmit={handleCreateGroup}>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>
                    Start a new group to track shared expenses with friends or family
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 my-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      name="group-name"
                      placeholder="e.g., Roommates, Trip to Paris"
                      className="glass-input"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-description">Description (Optional)</Label>
                    <Input
                      id="group-description"
                      name="group-description"
                      placeholder="Brief description of the group"
                      className="glass-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card 
              key={group.id} 
              className="glass-card hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => handleGroupClick(group.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {group.name}
                      </CardTitle>
                      <CardDescription>{group.members} members</CardDescription>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold">${group.total_expenses.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Group Code</p>
                    <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                      {group.code}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode(group.code);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {groups.length === 0 && (
          <Card className="glass-card text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first group or join an existing one to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Join Group Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Join a Group</CardTitle>
            <CardDescription>Enter a group code to join an existing group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter group code"
                className="glass-input max-w-xs"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={isLoading}
              />
              <Button onClick={handleJoinGroup} disabled={isLoading}>
                {isLoading ? "Joining..." : "Join Group"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}