"use client";

import { useMemo } from "react";
import { type InventoryStatus } from "@prisma/client";
import { PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createProduct, updateInventory } from "@/app/shop/actions";

type ProductWithInventory = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  inventory: { status: InventoryStatus; quantity: number } | null;
};

type ShopDashboardProps = {
  shop: {
    id: string;
    name: string;
    description: string | null;
    city: string;
  };
  products: ProductWithInventory[];
};

export default function ShopDashboard({ shop, products }: ShopDashboardProps) {
  const lowStockCount = useMemo(
    () => products.filter((product) => product.inventory?.status === "LOW").length,
    [products]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{shop.name}</h1>
          <p className="text-sm text-slate-600">{shop.description}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PackagePlus className="h-4 w-4" />
              Add product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new product</DialogTitle>
            </DialogHeader>
            <form action={createProduct} className="space-y-3">
              <Input name="name" placeholder="Product name" required />
              <Input name="description" placeholder="Short description" required />
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="price" type="number" step="0.01" placeholder="Price" required />
                <Input name="unit" placeholder="Unit (kg, pack)" required />
              </div>
              <Input name="quantity" type="number" placeholder="Starting quantity" required />
              <Button type="submit" className="w-full">
                Save product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active products", value: products.length },
          { label: "Low stock", value: lowStockCount },
          { label: "Location", value: shop.city }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory</CardTitle>
          <Badge variant="secondary">{products.length} items</Badge>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-slate-600">No products yet. Add your first product.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.description}</div>
                    </TableCell>
                    <TableCell>R {Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={product.inventory?.status === "OUT_OF_STOCK" ? "outline" : "secondary"}>
                        {product.inventory?.status ?? "IN_STOCK"}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.inventory?.quantity ?? 0}</TableCell>
                    <TableCell>
                      <form action={updateInventory} className="flex items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <select
                          name="status"
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                          defaultValue={product.inventory?.status ?? "IN_STOCK"}
                        >
                          {(["IN_STOCK", "LOW", "OUT_OF_STOCK"] as InventoryStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <Input
                          name="quantity"
                          type="number"
                          className="w-20"
                          defaultValue={product.inventory?.quantity ?? 0}
                        />
                        <Button size="sm" type="submit">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
