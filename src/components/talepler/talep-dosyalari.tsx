"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Download, 
  Trash2, 
  Upload, 
  FileIcon, 
  FileText, 
  Image, 
  File, 
  Edit, 
  Save, 
  X,
  Loader2,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Dosya tipine göre simge belirleme fonksiyonu
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  } else if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4" />;
  } else if (
    mimeType === "text/plain" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return <FileText className="h-4 w-4" />;
  }
  return <FileIcon className="h-4 w-4" />;
}

// Byte formatını insanların okuyabileceği hale getirme
function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface Dosya {
  id: string;
  ad: string;
  mimeTipi: string;
  boyut: number;
  yuklemeTarihi: string;
  aciklama?: string;
  yol: string;
}

interface TalepDosyalariProps {
  talepId: string;
  className?: string;
}

export function TalepDosyalari({ talepId, className }: TalepDosyalariProps) {
  const router = useRouter();
  const [dosyalar, setDosyalar] = useState<Dosya[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yuklemeBeklemede, setYuklemeBeklemede] = useState(false);
  const [seciliDosyalar, setSeciliDosyalar] = useState<File[]>([]);
  const [duzenlemeModu, setDuzenlemeModu] = useState<string | null>(null);
  const [aciklama, setAciklama] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  // Dosyaları yükle
  const fetchDosyalar = async () => {
    try {
      setYukleniyor(true);
      setHata(null);
      const response = await axios.get(`/api/talepler/${talepId}/dosyalar`);
      setDosyalar(response.data.dosyalar || []);
    } catch (error) {
      console.error("Dosyalar getirilirken hata oluştu:", error);
      setHata("Dosyalar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  // Bileşen yüklendiğinde dosyaları getir
  useEffect(() => {
    if (talepId) {
      fetchDosyalar();
    }
  }, [talepId]);

  // Dosya seçimi işle
  const handleFileSelect = (files: File[]) => {
    setSeciliDosyalar(files);
  };

  // Dosya yükleme
  const handleUpload = async () => {
    if (seciliDosyalar.length === 0) {
      toast.error("Lütfen yüklemek için dosya seçin");
      return;
    }

    try {
      setYuklemeBeklemede(true);
      const formData = new FormData();
      seciliDosyalar.forEach((file) => {
        formData.append("dosyalar", file);
      });

      await axios.post(`/api/talepler/${talepId}/dosyalar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 saniye
      });

      toast.success("Dosya(lar) başarıyla yüklendi");
      setSeciliDosyalar([]);
      fetchDosyalar(); // Listeyi yenile
    } catch (error) {
      console.error("Dosya yükleme hatası:", error);
      toast.error("Dosya yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setYuklemeBeklemede(false);
    }
  };

  // Dosya indirme
  const handleDownload = async (dosyaId: string, dosyaAdi: string) => {
    try {
      const response = await axios.get(`/api/talepler/${talepId}/dosyalar/${dosyaId}/indir`, {
        responseType: "blob",
      });

      // Blob URL oluştur
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", dosyaAdi);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Dosya indirme hatası:", error);
      toast.error("Dosya indirilirken bir hata oluştu");
    }
  };

  // Dosya silme
  const handleDelete = async (dosyaId: string) => {
    try {
      await axios.delete(`/api/talepler/${talepId}/dosyalar/${dosyaId}`);
      toast.success("Dosya başarıyla silindi");
      fetchDosyalar(); // Listeyi yenile
    } catch (error) {
      console.error("Dosya silme hatası:", error);
      toast.error("Dosya silinirken bir hata oluştu");
    }
  };

  // Açıklama düzenleme modunu aç
  const handleEditDescription = (dosyaId: string, mevcutAciklama?: string) => {
    setDuzenlemeModu(dosyaId);
    setAciklama(mevcutAciklama || "");
  };

  // Açıklama kaydet
  const handleSaveDescription = async (dosyaId: string) => {
    try {
      await axios.put(`/api/talepler/${talepId}/dosyalar/${dosyaId}`, {
        aciklama: aciklama,
      });
      setDuzenlemeModu(null);
      toast.success("Açıklama başarıyla güncellendi");
      fetchDosyalar(); // Listeyi yenile
    } catch (error) {
      console.error("Açıklama güncelleme hatası:", error);
      toast.error("Açıklama güncellenirken bir hata oluştu");
    }
  };

  // Açıklama düzenlemeyi iptal et
  const handleCancelEdit = () => {
    setDuzenlemeModu(null);
    setAciklama("");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Talep Dosyaları</div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchDosyalar} 
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>Talep ile ilgili yüklenmiş dosyalar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hata && (
          <div className="flex items-center p-3 text-sm border rounded-md bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{hata}</span>
          </div>
        )}

        {/* Dosya listesi tablosu */}
        {dosyalar.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Dosya Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Boyut</TableHead>
                  <TableHead>Yükleme Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dosyalar.map((dosya) => (
                  <TableRow key={dosya.id}>
                    <TableCell>{getFileIcon(dosya.mimeTipi)}</TableCell>
                    <TableCell className="font-medium">{dosya.ad}</TableCell>
                    <TableCell>
                      {duzenlemeModu === dosya.id ? (
                        <div className="flex gap-2">
                          <Input 
                            value={aciklama} 
                            onChange={(e) => setAciklama(e.target.value)}
                            placeholder="Dosya açıklaması giriniz"
                            className="h-8"
                          />
                          <div className="flex">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleSaveDescription(dosya.id)}
                              className="h-8 w-8"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={handleCancelEdit}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {dosya.aciklama || "Açıklama yok"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditDescription(dosya.id, dosya.aciklama)}
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatFileSize(dosya.boyut)}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(dosya.yuklemeTarihi), { 
                                addSuffix: true,
                                locale: tr 
                              })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(dosya.yuklemeTarihi).toLocaleString('tr-TR')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(dosya.id, dosya.ad)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Dosyayı silmek istediğinize emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu işlem geri alınamaz. Dosya kalıcı olarak silinecektir.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(dosya.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md bg-muted/40">
            <FileIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {yukleniyor ? "Dosyalar yükleniyor..." : "Bu talep için henüz yüklenmiş dosya bulunmuyor"}
            </p>
          </div>
        )}

        {/* Dosya yükleme alanı */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Yeni dosya ekle</h3>
          <div className="space-y-4">
            <FileUpload 
              onFilesSelected={handleFileSelect}
              maxFiles={5}
              maxSize={50 * 1024 * 1024} // 50MB
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {seciliDosyalar.length > 0 
                  ? `${seciliDosyalar.length} dosya seçildi` 
                  : "Henüz dosya seçilmedi"}
              </div>
              <Button
                onClick={handleUpload}
                disabled={seciliDosyalar.length === 0 || yuklemeBeklemede}
              >
                {yuklemeBeklemede ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Dosyaları Yükle
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 