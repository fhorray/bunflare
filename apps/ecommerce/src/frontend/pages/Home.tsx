import { useStore } from '@nanostores/react';
import { $products, addToCart } from '../stores';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HomePage() {
  const { data: products, error, loading } = useStore($products);

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Featured Products</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products?.map((product: any) => (
          <Card key={product.id} className="overflow-hidden flex flex-col">
            <div className="aspect-square bg-muted relative">
              {product.image && (
                 <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
              )}
            </div>
            <CardHeader className="p-4 flex-none space-y-1">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base">{product.name}</CardTitle>
                <Badge variant="secondary">${product.price}</Badge>
              </div>
              <CardDescription className="text-sm line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 mt-auto">
              <Button onClick={() => addToCart(product.id.toString())} className="w-full">
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}