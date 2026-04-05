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
import {
  Database,
  UserPlus,
  Trash2,
  RefreshCw,
  Loader2,
  Table,
} from 'lucide-react';
import { Badge } from '../ui/badge';

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
      const data = (await res.json()) as {
        users: { id: number; name: string }[];
      };
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">
            D1 Relational Database
          </h2>
          <p className="text-slate-500 font-medium max-w-xl">
            Low-latency SQLite storage for structured data. Bunflare provides
            automated connection pooling and native D1 binding support.
          </p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          className="gap-2 border-slate-200 font-bold hover:bg-slate-50"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <RefreshCw className="w-4 h-4 text-blue-500" />
          )}
          Sync State
        </Button>
      </div>

      <Card className="glass-card border-blue-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-blue-50/30">
          <CardTitle className="text-sm font-black flex items-center gap-2 text-blue-900 uppercase tracking-widest">
            <UserPlus className="w-4 h-4 text-blue-600" />
            Provision Record
          </CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold text-blue-400/80">
            Insert a new metadata cluster into the D1 users table.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={insertUser} className="flex gap-4 max-w-md">
            <Input
              name="name"
              placeholder="Identity Name"
              required
              className="bg-white border-slate-200 focus:ring-blue-500 rounded-xl"
            />
            <Button
              type="submit"
              disabled={isInserting}
              className="min-w-[120px] bg-slate-950 rounded-xl font-bold"
            >
              {isInserting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Commit'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card border-slate-100 overflow-hidden shadow-lg">
        <CardHeader className="bg-slate-50/50 pb-6">
          <CardTitle className="text-sm font-black flex items-center gap-3 text-slate-900 uppercase tracking-widest">
            <Table className="w-4 h-4 text-slate-400" />
            Registry Explorer
            <Badge className="ml-auto bg-blue-600 text-white border-0 shadow-lg shadow-blue-600/20 text-[9px] uppercase tracking-widest">
              Binding: DB
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white text-slate-400 border-y border-slate-100 uppercase text-[9px] font-black tracking-[0.2em]">
                    <th className="px-8 py-4 text-left w-24">Identifier</th>
                    <th className="px-8 py-4 text-left">Property: Name</th>
                    <th className="px-8 py-4 text-right w-32">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-4 font-mono text-[10px] font-bold text-blue-600">
                        # {user.id}
                      </td>
                      <td className="px-8 py-4 font-bold text-slate-700 tracking-tight">
                        {user.name}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <Button
                          onClick={() => deleteUser(user.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
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
            <div className="p-20 text-center space-y-6 opacity-30">
              <Database className="w-16 h-16 text-slate-200 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-slate-950">
                  Table Registry Empty
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Persistent storage awaiting your first input.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
