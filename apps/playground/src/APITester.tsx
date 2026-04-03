import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, type FormEvent, useEffect } from 'react';

export function APITester() {
  const [dbUsers, setDbUsers] = useState<{ id: number; name: string }[]>([]);
  const [r2Content, setR2Content] = useState<string>('');
  const [kvCount, setKvCount] = useState<number | null>(null);

  useEffect(() => {
    fetchDb();
    readR2();
    readKV();
  }, []);

  // D1 Operations
  const fetchDb = async () => {
    const res = await fetch('/api/db');
    const data = await res.json();
    if (data.users) setDbUsers(data.users);
  };

  const insertDb = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    await fetch('/api/db', {
      method: 'POST',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    });
    fetchDb();
    (e.target as HTMLFormElement).reset();
  };

  const deleteDb = async (id: number) => {
    await fetch('/api/db/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    });
    fetchDb();
  };

  // R2 Operations
  const readR2 = async () => {
    const res = await fetch('/api/file');
    const text = await res.text();
    setR2Content(text);
  };

  const writeR2 = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    await fetch('/api/write', {
      method: 'POST',
      body: JSON.stringify({ content }),
      headers: { 'Content-Type': 'application/json' },
    });
    readR2();
    (e.target as HTMLFormElement).reset();
  };

  const deleteR2 = async () => {
    await fetch('/api/file/delete', { method: 'POST' });
    readR2();
  };

  // KV Operations
  const readKV = async () => {
    const res = await fetch('/api/redis');
    const data = await res.json();
    if (data.count !== undefined) setKvCount(data.count);
  };

  const incrementKV = async () => {
    const res = await fetch('/api/redis', { method: 'POST' });
    const data = await res.json();
    if (data.count !== undefined) setKvCount(data.count);
  };

  const deleteKV = async () => {
    await fetch('/api/redis/delete', { method: 'POST' });
    readKV();
  };

  return (
    <div className="flex flex-col gap-10 text-left">
      {/* D1/SQLite Section */}
      <section className="space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm bg-blue-50/10">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            D1 Database (SQLite)
          </h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
            Relational
          </span>
        </div>
        <div className="flex gap-4">
          <Button onClick={fetchDb} variant="outline" className="shrink-0">
            Reload Users
          </Button>
          <form onSubmit={insertDb} className="flex gap-2 w-full">
            <Input
              name="name"
              placeholder="New user name"
              required
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Insert
            </Button>
          </form>
        </div>

        {dbUsers.length > 0 ? (
          <div className="border rounded-md bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left w-16 font-medium">ID</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-right font-medium w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {dbUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-3">{user.id}</td>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3 text-right">
                      <Button
                        onClick={() => deleteDb(user.id)}
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-md">
            No users found in database.
          </p>
        )}
      </section>

      {/* R2 Section */}
      <section className="space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm bg-orange-50/10">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-semibold text-orange-600 dark:text-orange-400">
            R2 Storage (File I/O)
          </h2>
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full dark:bg-orange-900 dark:text-orange-200">
            Object Store
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={readR2} variant="outline" className="flex-1">
                Read File
              </Button>
              <Button
                onClick={deleteR2}
                variant="destructive"
                className="flex-1"
              >
                Delete File
              </Button>
            </div>
            <Textarea
              readOnly
              value={r2Content}
              placeholder="File content will appear here..."
              className="h-32 resize-none bg-muted/30 font-mono text-sm"
            />
          </div>
          <form onSubmit={writeR2} className="space-y-3 flex flex-col">
            <Textarea
              name="content"
              placeholder="Content to write"
              required
              className="flex-1 resize-none"
            />
            <Button type="submit" variant="secondary" className="w-full">
              Write to File
            </Button>
          </form>
        </div>
      </section>

      {/* KV Section */}
      <section className="space-y-4 p-6 rounded-lg border bg-card text-card-foreground shadow-sm bg-green-50/10">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
            KV Store (Redis)
          </h2>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-200">
            Key-Value
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 items-center bg-background p-6 rounded-md border">
          <div className="text-3xl font-mono tracking-wider bg-muted px-6 py-4 rounded-lg flex-1 text-center shadow-inner">
            <span className="text-muted-foreground text-sm uppercase block mb-1 tracking-widest">
              Count
            </span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {kvCount !== null ? kvCount : '?'}
            </span>
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <Button
              onClick={incrementKV}
              className="w-full sm:w-40"
              variant="default"
            >
              Increment
            </Button>
            <Button
              onClick={readKV}
              variant="outline"
              className="w-full sm:w-40"
            >
              Refresh
            </Button>
            <Button
              onClick={deleteKV}
              variant="destructive"
              className="w-full sm:w-40"
            >
              Reset (Delete)
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
