# Spotify Playlist AI 🎵

AI destekli Spotify çalma listesi oluşturucu. Verdiğiniz açıklamaya göre kişiselleştirilmiş çalma listeleri oluşturur.

## 🌐 Canlı Demo

**[https://bekirin50tonu.github.io/spotify-playlist-ai/](https://bekirin50tonu.github.io/spotify-playlist-ai/)**

## Özellikler

- 🎯 AI ile akıllı çalma listesi oluşturma
- 👤 Kişiselleştirilmiş öneriler (dinleme geçmişinize göre)
- 🔐 Spotify OAuth2 entegrasyonu
- 📱 Progressive Web App (PWA) desteği
- 🎨 Modern ve responsive arayüz
- 💾 Çalma listelerini Spotify hesabınıza kaydetme
- 🎧 Şarkı önizleme özelliği
- 📊 Müzik profili analizi

## Kurulum

1. Projeyi klonlayın:

```bash
git clone https://github.com/bekirin50tonu/spotify-playlist-ai.git
cd spotify-playlist-ai
```

2. Bağımlılıkları yükleyin:

```bash
pnpm install
```

3. Environment değişkenlerini ayarlayın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyip Spotify Client ID'nizi ekleyin:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

4. Uygulamayı başlatın:

```bash
pnpm dev
```

## Spotify App Kurulumu

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)'a gidin
2. Yeni bir app oluşturun
3. Redirect URI olarak şunları ekleyin:
   - `http://localhost:5173/callback` (development)
   - `https://bekirin50tonu.github.io/spotify-playlist-ai/callback` (production)
4. Client ID'yi `.env` dosyasına ekleyin

## Gemini API Kurulumu

1. [Google AI Studio](https://makersuite.google.com/app/apikey)'ya gidin
2. Yeni bir API key oluşturun
3. Uygulamada Ayarlar sayfasından API key'i ekleyin

## Teknolojiler

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Spotify Web API SDK** - Spotify entegrasyonu
- **Google Generative AI** - AI önerileri
- **Vite PWA Plugin** - Progressive Web App

## Kullanım

1. Spotify hesabınızla giriş yapın
2. Gemini API key'inizi ayarlarda ekleyin
3. Çalma listesi için bir açıklama yazın (örn: "Sabah koşusu için enerjik şarkılar")
4. Ruh hali, enerji seviyesi ve şarkı sayısını seçin
5. AI'ın oluşturduğu kişiselleştirilmiş çalma listesini inceleyin
6. Beğendiyseniz Spotify hesabınıza kaydedin

## Deployment

GitHub Pages'e otomatik deploy edilir:

```bash
git push origin main
```

## Lisans

MIT

## 📋 YAPMANIZ GEREKENLER:

### 1. 🔧 Spotify Developer Console Ayarları

- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)'a gidin
- Mevcut uygulamanızı düzenleyin
- **Redirect URIs** kısmına şunu ekleyin:
  ```
  https://bekirin50tonu.github.io/spotify-playlist-ai/callback
  ```

### 2. 📁 GitHub Repository Oluşturun

```bash
# Proje klasöründe:
git init
git add .
git commit -m "Initial commit: Spotify Playlist AI"
git branch -M main
git remote add origin https://github.com/bekirin50tonu/spotify-playlist-ai.git
git push -u origin main
```

### 3. 🔐 GitHub Secrets Ayarları

1. GitHub repository'nizde **Settings** > **Secrets and variables** > **Actions**'a gidin
2. **New repository secret** butonuna tıklayın
3. Şu secret'ı ekleyin:
   - **Name**: `VITE_SPOTIFY_CLIENT_ID`
   - **Secret**: `9da5057f3c61428099cec9e47f40d55b` (Spotify Client ID'niz)

### 4. ⚙️ GitHub Pages Ayarları

1. GitHub repository'nizde **Settings** > **Pages**'e gidin
2. **Source**: "GitHub Actions" seçin
3. Workflow otomatik çalışacak

### 5. 🚀 Deploy

```bash
git push origin main
```

## 🔒 Güvenlik Notları:

- ✅ `.env` dosyası gitignore'da (hassas bilgiler GitHub'a gitmez)
- ✅ Spotify Client ID GitHub Secrets'ta güvenli şekilde saklanır
- ✅ Build sırasında environment variables otomatik oluşturulur

## 🌐 Erişim URL'si:

**https://bekirin50tonu.github.io/spotify-playlist-ai/**
