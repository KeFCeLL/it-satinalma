# IT Satınalma - Geliştirme Komutları
# Bu script, geliştirme sırasında sık kullanılan komutları sırayla çalıştırır

param (
    [string]$command = "dev"
)

# Proje dizini
$projectDir = $PSScriptRoot

function RunDev {
    Write-Host "🚀 Geliştirme sunucusu başlatılıyor..." -ForegroundColor Green
    npm run dev
}

function RunBuild {
    Write-Host "🏗️ Proje build ediliyor..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "✅ Build tamamlandı!" -ForegroundColor Green
}

function RunTest {
    Write-Host "🧪 Testler çalıştırılıyor..." -ForegroundColor Cyan
    npm run test
}

function InstallPackage {
    param (
        [Parameter(Mandatory=$true)]
        [string]$packageName
    )
    
    Write-Host "📦 $packageName paketi yükleniyor..." -ForegroundColor Magenta
    npm install $packageName --save
}

function CleanInstall {
    Write-Host "🧹 Eski node_modules ve package-lock.json temizleniyor..." -ForegroundColor Yellow
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
    
    Write-Host "📦 Paketler yeniden yükleniyor..." -ForegroundColor Green
    npm install
}

function RunPrismaSeed {
    Write-Host "🌱 Veritabanı seed işlemi başlatılıyor..." -ForegroundColor Cyan
    npm run prisma:seed
}

# Komut seçimi
switch ($command) {
    "dev" { RunDev }
    "build" { RunBuild }
    "test" { RunTest }
    "clean" { CleanInstall }
    "seed" { RunPrismaSeed }
    default {
        if ($command.StartsWith("install:")) {
            $packageName = $command.Substring(8)
            InstallPackage -packageName $packageName
        }
        else {
            Write-Host "❌ Geçersiz komut: $command" -ForegroundColor Red
            Write-Host "Kullanılabilir komutlar: dev, build, test, clean, seed, install:paket-adı" -ForegroundColor Yellow
        }
    }
} 