import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Shield, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(["admin", "manager", "viewer"]).default("viewer"),
});

type User = {
  id: string;
  username: string;
  email?: string;
  role: string;
  createdAt?: string;
};

export default function Users() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | undefined>();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const users = (usersData as any) || [];

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("userId") || "" },
      });
      if (!response.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
    setDeleteDialogOpen(false);
    setUserToDelete(undefined);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-users-title">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage user accounts for your organization
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-add-user" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: User) => (
            <Card key={user.id} data-testid={`card-user-${user.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      {user.email && (
                        <CardDescription className="text-sm">{user.email}</CardDescription>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                    {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                    {user.role}
                  </Badge>
                </div>
                {user.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDelete(user)}
                  data-testid={`button-delete-user-${user.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete User
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              Delete User - Warning!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium text-foreground">
                You are about to delete user: <span className="font-bold">{userToDelete?.username}</span>
                {userToDelete?.role && <span className="ml-2 text-xs px-2 py-1 rounded bg-muted capitalize">({userToDelete.role})</span>}
              </p>
              <div className="rounded-lg bg-destructive/10 p-3 space-y-2">
                <p className="font-semibold text-destructive">⚠️ This action cannot be undone and will:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Permanently remove this user account</li>
                  <li>Revoke all access permissions</li>
                  <li>User will not be able to log in anymore</li>
                  {userToDelete?.role === "admin" && (
                    <li className="font-bold">⚠️ WARNING: This is an ADMIN account with full system access!</li>
                  )}
                </ul>
              </div>
              <p className="text-sm font-medium">Are you absolutely sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-user">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete-user"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<z.infer<typeof createUserSchema> | null>(null);

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      role: "viewer",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      onOpenChange(false);
      setShowConfirmation(false);
      setPendingData(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: z.infer<typeof createUserSchema>) => {
    setPendingData(data);
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    if (pendingData) {
      mutation.mutate(pendingData);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full access to all features including user management";
      case "manager":
        return "Can manage employees and process salaries";
      case "viewer":
        return "Read-only access to view data";
      default:
        return "";
    }
  };

  return (
    <>
    <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-create-user">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user account. They can use these credentials to log in to PayVault.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., john.doe" {...field} data-testid="input-username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      {...field}
                      data-testid="input-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="manager">Manager - Can manage employees and salary</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-create-user">
                {mutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmation} onOpenChange={(open) => {
      if (!open) {
        setShowConfirmation(false);
        setPendingData(null);
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirm User Details
          </DialogTitle>
          <DialogDescription>
            Please review the information below before creating the user account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertDescription>
              Please carefully review all information. This user will be able to log in with these credentials.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Username</p>
                  <p className="font-medium font-mono">{pendingData?.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{pendingData?.email || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Password</p>
                <p className="font-medium font-mono">{"•".repeat(pendingData?.password?.length || 0)} ({pendingData?.password?.length} characters)</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4 bg-primary/5">
            <h3 className="font-semibold text-sm text-muted-foreground">Role & Permissions</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={pendingData?.role === "admin" ? "default" : pendingData?.role === "manager" ? "secondary" : "outline"} className="capitalize">
                  {pendingData?.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                  {pendingData?.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {pendingData?.role && getRoleDescription(pendingData.role)}
              </p>
            </div>
          </div>

          {pendingData?.role === "admin" && (
            <Alert className="border-orange-500/50 bg-orange-500/10">
              <AlertDescription className="text-orange-700 dark:text-orange-400">
                ⚠️ <strong>Warning:</strong> This user will have full administrative access to all system features including user management.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowConfirmation(false);
              setPendingData(null);
            }}
            disabled={mutation.isPending}
          >
            Go Back & Edit
          </Button>
          <Button
            onClick={confirmSubmit}
            disabled={mutation.isPending}
            data-testid="button-confirm-create-user"
          >
            {mutation.isPending ? "Creating..." : "Confirm & Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
