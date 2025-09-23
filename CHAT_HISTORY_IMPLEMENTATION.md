# Chat History Implementation

Bu dokümantasyon, BeQ uygulamasında chat mesajlarının session bazlı Supabase'e kaydedilmesi ve conversation history'nin GPT modeline iletilmesi özelliğinin implementasyonunu açıklamaktadır.

## Genel Bakış

Bu özellik sayesinde:
- Kullanıcıların chat mesajları Supabase veritabanına kaydedilir
- Aynı conversation (session) içinde GPT'ye gönderilen mesajlar, önceki mesajların history'si ile birlikte gönderilir
- Bu sayede GPT, konuşmanın bağlamını koruyarak daha akıllı yanıtlar verebilir

## Teknik Implementasyon

### 1. Veritabanı Yapısı

Supabase'de aşağıdaki tablolar kullanılır:

#### `conversations` Tablosu
```sql
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    title TEXT,
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### `messages` Tablosu
```sql
CREATE TABLE public.messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    response TEXT,
    model_used TEXT,
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE
);
```

### 2. Frontend Implementasyonu

#### `ChatService` (`clients/web/lib/services/chat-service.ts`)
Yeni chat service sınıfı, mesajları Supabase'e kaydetme ve yükleme işlemlerini yönetir:

- `saveUserMessage()`: Kullanıcı mesajını kaydeder
- `saveAssistantMessage()`: AI yanıtını günceller
- `loadConversationHistory()`: Conversation history'yi yükler
- `createConversation()`: Yeni conversation oluşturur

#### `useChat` Hook Güncellemeleri (`clients/web/lib/hooks/use-chat.ts`)
Hook aşağıdaki değişikliklerle güncellendi:

- Mesaj gönderme sırasında Supabase'e kaydetme
- Conversation history'yi Supabase'den yükleme
- Conversation oluşturma ve yönetme

### 3. Backend Implementasyonu

#### Supabase Client (`services/orchestrator/app/core/supabase.py`)
Supabase bağlantısı için yeni client modülü.

#### Chat API Güncellemeleri (`services/orchestrator/app/api/v1/chat.py`)
- `ChatService.ensure_conversation_exists()`: Conversation'ın varlığını kontrol eder, yoksa oluşturur
- `process_message()`: Mesajları Supabase'e kaydeder
- Conversation history API endpoint'leri Supabase'den veri çeker

#### Orchestrator Agent Güncellemeleri (`services/orchestrator/app/agent/orchestrator_agent.py`)
- `process_user_message()`: Conversation history'yi yükler ve LLM'e gönderir
- `_load_conversation_history()`: Supabase'den history'yi çeker

## Workflow

1. **Yeni Conversation**: Kullanıcı ilk mesajı gönderdiğinde:
   - Frontend'de conversation ID oluşturulur
   - Backend'de conversation Supabase'e kaydedilir
   - İlk mesaj Supabase'e kaydedilir

2. **Mevcut Conversation**: Kullanıcı mesaj gönderdiğinde:
   - Önceki mesajlar Supabase'den yüklenir
   - LLM'e history + yeni mesaj gönderilir
   - AI yanıtı Supabase'e kaydedilir

3. **History Loading**: Sayfa yenilendiğinde:
   - Conversation history Supabase'den yüklenir
   - UI'da mesajlar gösterilir

## Özellikler

### Session Bazlı Yönetim
- Her conversation ayrı bir session olarak yönetilir
- Conversation ID ile mesajlar gruplandırılır
- Kullanıcı bazlı izolasyon (RLS policies)

### History ile LLM Entegrasyonu
- Son 20 mesaj history olarak yüklenir
- LangChain mesaj formatına dönüştürülür
- LLM'e gönderilen prompt'a history dahil edilir

### Hata Toleransı
- Supabase bağlantı hatası durumunda sistem çalışmaya devam eder
- Sadece logging yapılır, kullanıcı deneyimi kesintiye uğramaz

## API Endpoints

### Chat Mesajları
- `POST /api/v1/chat/message`: Mesaj gönderir, yanıtı döndürür
- `GET /api/v1/chat/conversations/{id}`: Conversation history'sini döndürür
- `GET /api/v1/chat/conversations`: Kullanıcının tüm conversation'larını listeler
- `DELETE /api/v1/chat/conversations/{id}`: Conversation'ı siler
- `POST /api/v1/chat/conversations/{id}/clear`: Conversation mesajlarını temizler

## Güvenlik

- Row Level Security (RLS) ile veri izolasyonu
- Kullanıcılar sadece kendi mesajlarını görebilir
- Supabase Auth entegrasyonu

## Performans

- Conversation history limiti (20 mesaj)
- Efficient database queries
- Background'da mesaj kaydetme (blocking olmayan)

## Test ve Doğrulama

Implementasyon tamamlandıktan sonra aşağıdaki testler yapılmalıdır:

1. **Frontend Testleri**:
   - Mesaj gönderme ve alma
   - Conversation oluşturma
   - History yükleme

2. **Backend Testleri**:
   - Supabase bağlantısı
   - Message persistence
   - History retrieval

3. **Integration Testleri**:
   - Full chat flow
   - History continuity
   - Error handling

## Yapılandırma

Gerekli environment variables:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Gelecek Geliştirmeler

- Message pagination
- Message search
- Conversation titles (AI-generated)
- Message reactions/emojis
- Export chat history
- Message threads
