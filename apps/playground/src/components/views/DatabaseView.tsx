import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Database, UserPlus, Trash2, RefreshCw, Loader2 } from 'lucide-react';

export function DatabaseView() {
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  const insertUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsInserting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    try {
      await fetch('/api/db', {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
      });
      fetchUsers();
      (e.target as HTMLFormElement).reset();
    } finally {
      setIsInserting(false);
    }
  };

  const deleteUser = async (id: number) => {
    await fetch('/api/db/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    });
    fetchUsers();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">D1 Database</h2>
          <p className="text-muted-foreground">
            Relational data management with SQLite emulation.
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Refresh
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            Add User
          </CardTitle>
          <CardDescription>
            Insert a new record into the users table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={insertUser} className="flex gap-4">
            <Input
              name="name"
              placeholder="Full name"
              required
              className="bg-muted/30 border-muted-foreground/10"
            />
            <Button
              type="submit"
              disabled={isInserting}
              className="min-w-[100px]"
            >
              {isInserting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Insert'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            Users Table
            <span className="ml-auto text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full uppercase tracking-widest">
              sqlite_schema: users
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="p-4 text-left font-semibold w-24">ID</th>
                    <th className="p-4 text-left font-semibold">Name</th>
                    <th className="p-4 text-right font-semibold w-32">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        # {user.id}
                      </td>
                      <td className="p-4 font-medium tracking-tight">
                        {user.name}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          onClick={() => deleteUser(user.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <Database className="w-12 h-12 text-muted-foreground/20 mx-auto" />
              <p className="text-sm text-muted-foreground italic">
                No users found in database.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
