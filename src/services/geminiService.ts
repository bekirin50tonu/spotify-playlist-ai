import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generatePlaylistSuggestions(prompt: string, mood?: string, energy?: string, count = 20): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini API key bulunamadı. Ayarlardan API key ekleyin.');
    }

    // Gemini 2.0 Flash modelini kullan
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const systemPrompt = `Sen bir müzik uzmanısın. Kullanıcının verdiği açıklamaya göre şarkı önerileri yapacaksın.

KURALLAR:
1. Sadece şarkı adı ve sanatçı adı ver
2. Her satırda bir şarkı olsun
3. Format: "Şarkı Adı - Sanatçı Adı"
4. Tam olarak ${count} şarkı öner
5. Türkçe ve İngilizce şarkılar karışık olabilir
6. Popüler ve tanınmış şarkıları tercih et

Kullanıcı isteği: ${prompt}
${mood ? `Ruh hali: ${mood}` : ''}
${energy ? `Enerji seviyesi: ${energy}` : ''}

${count} adet şarkı önerisi listele:`;

    try {
      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();

      // Metni satırlara böl ve temizle
      const songs = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('-'))
        .map(line => line.replace(/^\d+\.\s*/, '')) // Numaraları kaldır
        .slice(0, count); // Kullanıcının istediği sayı kadar

      return songs;
    } catch (error) {
      console.error('Gemini API hatası:', error);
      throw new Error('AI şarkı önerileri alınırken hata oluştu');
    }
  }

  async generatePersonalizedPlaylist(
    prompt: string,
    mood?: string,
    energy?: string,
    userProfile?: {
      topArtists: Array<{ name: string; genres: string[] }>;
      topTracks: Array<{ name: string; artist: string; genres: string[] }>;
      recentTracks: Array<{ name: string; artist: string; playedAt: string }>;
      musicAnalysis: {
        favoriteGenres: string[];
        listeningHabits: string;
        energyPreference: string;
        diversityScore: number;
      };
    },
    count: number = 20
  ): Promise<string[]> {
    if (!this.genAI) {
      throw new Error('Gemini API key bulunamadı. Ayarlardan API key ekleyin.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Kullanıcı profili analizi
    let profileContext = '';
    if (userProfile && userProfile.topArtists.length > 0) {
      const topArtistNames = userProfile.topArtists.slice(0, 10).map(a => a.name).join(', ');
      const topTrackInfo = userProfile.topTracks.slice(0, 10).map(t => `${t.name} - ${t.artist}`).join(', ');
      const recentArtists = [...new Set(userProfile.recentTracks.slice(0, 10).map(t => t.artist))].join(', ');

      profileContext = `
KULLANICI MÜZİK PROFİLİ:
- En çok dinlediği sanatçılar: ${topArtistNames}
- En çok dinlediği şarkılar: ${topTrackInfo}
- Son dinlediği sanatçılar: ${recentArtists}
- Favori müzik türleri: ${userProfile.musicAnalysis.favoriteGenres.join(', ')}
- Dinleme alışkanlıkları: ${userProfile.musicAnalysis.listeningHabits}
- Enerji tercihi: ${userProfile.musicAnalysis.energyPreference}
- Müzik çeşitliliği: ${userProfile.musicAnalysis.diversityScore > 0.7 ? 'Yüksek' : userProfile.musicAnalysis.diversityScore > 0.4 ? 'Orta' : 'Düşük'}

Bu profil bilgilerini kullanarak kullanıcının zevkine uygun öneriler yap.`;
    }

    const systemPrompt = `Sen bir müzik uzmanısın. Kullanıcının müzik geçmişini analiz ederek kişiselleştirilmiş şarkı önerileri yapacaksın.

${profileContext}

KURALLAR:
1. Kullanıcının müzik zevkini ve geçmişini dikkate al
2. Sadece şarkı adı ve sanatçı adı ver
3. Her satırda bir şarkı olsun
4. Format: "Şarkı Adı - Sanatçı Adı"
5. Tam olarak ${count} şarkı öner
6. Kullanıcının dinlediği sanatçılara benzer sanatçılar öner
7. Kullanıcının favori türlerinden şarkılar seç
8. Popüler ve tanınmış şarkıları tercih et
9. Kullanıcının enerji tercihini göz önünde bulundur

Kullanıcı isteği: ${prompt}
${mood ? `İstenen ruh hali: ${mood}` : ''}
${energy ? `İstenen enerji seviyesi: ${energy}` : ''}

Kullanıcının müzik zevkine uygun ${count} adet kişiselleştirilmiş şarkı önerisi listele:`;

    try {
      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();

      // Metni satırlara böl ve temizle
      const songs = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('-'))
        .map(line => line.replace(/^\d+\.\s*/, '')) // Numaraları kaldır
        .slice(0, count); // Kullanıcının istediği sayı kadar

      return songs;
    } catch (error) {
      console.error('Gemini API hatası:', error);
      throw new Error('AI şarkı önerileri alınırken hata oluştu');
    }
  }
}

export const geminiService = new GeminiService();