import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { productsAPI } from "@/lib/api/products";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { id } = await params;
    const product = await productsAPI.getProduct(id);
    
    if (!product) {
      notFound();
    }

    return <ProductDetail product={product} />;
  } catch (error) {
    console.error('Error loading product:', error);
    notFound();
  }
}
