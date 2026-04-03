import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { APITester } from './APITester';
import './index.css';

export function App() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10 max-w-4xl">
      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-3xl font-bold">
            Bun + Cloudflare Playground
          </CardTitle>
          <CardDescription>
            Test your D1, R2, and KV bindings locally with Bun's file-based
            emulators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <APITester />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
