"use client";

import * as React from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getGorevler,
  createGorev,
  updateGorev,
  deleteGorev,
  Gorev
} from "@/lib/services/task-service";

export function TodoList() {
  const [todos, setTodos] = React.useState<Gorev[]>([]);
  const [newTodoText, setNewTodoText] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  // Görevleri API'dan yükle
  React.useEffect(() => {
    const fetchTodos = async () => {
      setLoading(true);
      try {
        const response = await getGorevler();
        setTodos(response.data);
      } catch (error) {
        console.error("Görevler yüklenirken hata:", error);
        toast.error("Görevler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  // Yeni görev ekle
  const addTodo = async () => {
    if (newTodoText.trim()) {
      try {
        const response = await createGorev({
          metin: newTodoText.trim()
        });
        
        setTodos([response.data, ...todos]);
        setNewTodoText("");
        toast.success("Görev eklendi");
      } catch (error) {
        console.error("Görev eklenirken hata:", error);
        toast.error("Görev eklenemedi");
      }
    }
  };

  // Görev durumunu değiştir (tamamlandı/tamamlanmadı)
  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;
      
      const response = await updateGorev({
        id,
        tamamlandi: !todo.tamamlandi
      });
      
      setTodos(
        todos.map(todo =>
          todo.id === id ? response.data : todo
        )
      );
    } catch (error) {
      console.error("Görev durumu güncellenirken hata:", error);
      toast.error("Görev durumu güncellenemedi");
    }
  };
  
  // Görevi sil
  const deleteTodo = async (id: string) => {
    try {
      await deleteGorev(id);
      setTodos(todos.filter(todo => todo.id !== id));
      toast.success("Görev silindi");
    } catch (error) {
      console.error("Görev silinirken hata:", error);
      toast.error("Görev silinemedi");
    }
  };

  // Enter tuşuna basıldığında görev ekle
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Yeni görev ekle..."
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button size="sm" variant="outline" onClick={addTodo}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {loading ? (
        // Yükleme durumunda skeleton göster
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : todos.length > 0 ? (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between space-x-2 rounded-md border px-3 py-2"
            >
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="focus:outline-none"
                >
                  {todo.tamamlandi ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                <span className={cn(
                  "text-sm",
                  todo.tamamlandi && "line-through text-muted-foreground"
                )}>
                  {todo.metin}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
          <p>Henüz görev eklenmemiş</p>
        </div>
      )}
    </div>
  );
} 