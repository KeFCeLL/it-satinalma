"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProducts, getProductCategories, Product } from "@/lib/services/product-service";
import { cn } from "@/lib/utils";

export interface ProductSelectorProps {
  onProductSelect: (product: Product | null) => void;
  selectedProductId?: string;
  className?: string;
}

export function ProductSelector({ onProductSelect, selectedProductId, className }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("_all");
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});

  // Ürünleri yükle
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts();
        setProducts(response.data);
      } catch (error) {
        console.error("Ürünler yüklenirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await getProductCategories();
        if (response && 'kategoriler' in response && Array.isArray(response.kategoriler)) {
          setCategories(response.kategoriler);
        } else if (response && 'data' in response && Array.isArray((response as any).data)) {
          setCategories((response as any).data);
        } else if (response && 'success' in response && response.success && 'data' in response && Array.isArray((response as any).data)) {
          setCategories((response as any).data);
        } else {
          setCategories([]);
          console.error("Kategoriler yüklenirken veri formatı beklenenden farklı:", response);
        }
      } catch (error) {
        console.error("Kategoriler yüklenirken hata oluştu:", error);
        setCategories([]);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  // Seçili ürünü yükle
  useEffect(() => {
    const findSelectedProduct = async () => {
      if (selectedProductId && products.length > 0) {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
          setSelectedProduct(product);
        }
      }
    };
    
    findSelectedProduct();
  }, [selectedProductId, products]);

  // Filtreleme ve gruplama
  useEffect(() => {
    // Filtreleme
    const filtered = products.filter(product => {
      const matchesSearchTerm = product.ad.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               (product.aciklama && product.aciklama.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "_all" ? true : product.kategori === selectedCategory;
      
      return matchesSearchTerm && matchesCategory;
    });

    // Kategoriye göre gruplama (Eğer bir kategori seçilmemişse)
    const grouped: Record<string, Product[]> = {};
    if (selectedCategory === "_all") {
      filtered.forEach(product => {
        const category = product.kategori || "Diğer";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(product);
      });
    } else {
      // Sadece seçili kategori varsa
      grouped[selectedCategory] = filtered;
    }

    setGroupedProducts(grouped);
  }, [products, searchTerm, selectedCategory]);

  // Ürün seçildiğinde
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    onProductSelect(product);
    setOpen(false);
  };

  // Ürün temizlendiğinde
  const handleClearProduct = () => {
    setSelectedProduct(null);
    onProductSelect(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedProduct ? (
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{selectedProduct.ad}</span>
                <Badge variant="secondary">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedProduct.birimFiyat)}
                </Badge>
              </div>
            ) : (
              <span className="text-muted-foreground">Ürün seçin</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <div className="flex flex-col p-2 gap-2">
            <div className="flex items-center p-2 border-b pb-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-70" />
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tüm kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tüm kategoriler</SelectItem>
                {Array.isArray(categories) && categories.length > 0 ? categories.map((category) => (
                  <SelectItem key={category} value={category || "_empty"}>
                    {category || "Kategori Girilmemiş"}
                  </SelectItem>
                )) : (
                  <SelectItem value="_loading" disabled>Kategori bulunamadı</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-muted-foreground">Ürünler yükleniyor...</p>
              </div>
            ) : Object.keys(groupedProducts).length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-muted-foreground">Ürün bulunamadı</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <div key={category} className="flex flex-col gap-1">
                    {selectedCategory === "_all" && (
                      <div className="sticky top-0 bg-background pt-2 pb-1 z-10">
                        <h4 className="font-semibold text-sm px-2">{category}</h4>
                        <div className="h-px bg-border w-full my-1"></div>
                      </div>
                    )}
                    
                    {categoryProducts.map((product) => (
                      <Button
                        key={product.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start font-normal py-2",
                          selectedProduct?.id === product.id && "bg-accent"
                        )}
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex justify-between w-full mb-1">
                            <span className="font-semibold">{product.ad}</span>
                            <Badge variant="secondary">
                              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.birimFiyat)}
                            </Badge>
                          </div>
                          {product.aciklama && (
                            <span className="text-xs text-muted-foreground truncate w-full mb-1">
                              {product.aciklama}
                            </span>
                          )}
                          <div className="flex justify-between w-full">
                            <span className="text-xs text-muted-foreground">
                              Stok: {product.stokDurumu}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedProduct && (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-muted-foreground"
            onClick={handleClearProduct}
          >
            <X className="h-4 w-4 mr-1" />
            <span className="text-xs">Temizle</span>
          </Button>
          <p className="text-xs text-muted-foreground ml-2">
            Seçili ürün: {selectedProduct.ad} - {selectedProduct.kategori}
          </p>
        </div>
      )}
    </div>
  );
} 