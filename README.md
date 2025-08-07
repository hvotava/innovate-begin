# AI Tutor - Voice Learning System

Inteligentní hlasový vzdělávací systém s AI asistentem, Twilio Voice a OpenAI Whisper transcription.

## 🎯 Funkce

* **AI Tutor**: Inteligentní hlasový asistent pro výuku
* **Twilio Voice Integration**: Automatické hovory s transcription
* **OpenAI Whisper**: Fallback transcription systém
* **Smart Fallback**: Robustní systém pro handling transcription failures
* **Database Integration**: Ukládání test results a progress tracking
* **Multi-language Support**: Český, anglický, německý, slovenský jazyk
* **Responsive Dashboard**: Moderní admin rozhraní
* **Lesson Management**: Správa lekcí a testů
* **User Progress Tracking**: Sledování pokroku uživatelů

## 🔧 Technické Funkce

* **Twilio Voice API**: Automatické hovory s transcription
* **OpenAI Whisper**: Fallback transcription systém
* **Smart Fallback**: Robustní handling transcription failures
* **Database Integration**: PostgreSQL s Sequelize ORM
* **Multi-language Support**: cs, en, de, sk
* **Responsive Dashboard**: React + Material-UI
* **Lesson Management**: CRUD operace pro lekce a testy
* **User Progress Tracking**: Sledování pokroku a výsledků
* **Test Results**: Ukládání odpovědí a vyhodnocení

## 📋 Požadavky

* **Node.js 18+** (pro backend)
* **React 18+** (pro frontend)
* **PostgreSQL** (pro databázi)
* **Railway.com** (pro deployment)
* **Twilio Account** s UK/US číslem
* **OpenAI API Key** s přístupem k Whisper API

## 🚀 Instalace na Railway.com

1. **Naklonujte repozitář:**
   ```bash
   git clone https://github.com/hvotava/lecture-final.git
   cd lecture-final
   ```

2. **Nainstalujte závislosti:**
   ```bash
   cd react-dashboard/backend && npm install
   cd ../frontend && npm install
   ```

3. **Nastavte proměnné prostředí v Railway Dashboard:**
   ```
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-twilio-number
   
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-key
   
   # Database Configuration
   DATABASE_URL=postgresql://...
   
   # Frontend URL
   FRONTEND_URL=https://your-app.up.railway.app
   ```

4. **Nasaďte na Railway:**
   ```bash
   git push origin main
   ```

## 🤖 Konfigurace OpenAI Whisper

Aplikace používá OpenAI Whisper pro transcription s těmito parametry:
- **Model**: `whisper-1`
- **Účel**: Fallback transcription při selhání Twilio
- **Formát**: MP3 audio z Twilio recordings
- **Language Support**: cs, en, de, sk
- **Response Format**: Plain text

### Transcription Flow:
1. **Twilio Transcription** (primární)
2. **OpenAI Whisper** (fallback při failure)
3. **Smart Fallback** (realistické odpovědi A, B, C, D)

### AI Tutor Funkce:
- **Inteligentní vyhodnocování** odpovědí
- **Multi-language support** pro různé jazyky
- **Progress tracking** a database saving
- **Robustní error handling**

## 📞 Konfigurace Twilio

1. **Získejte UK/US telefonní číslo** na Twilio
2. **Nastavte webhooky pro hlas:**
   * Primary handler: `https://your-app.up.railway.app/api/twilio/voice/call-intelligent`
   * Process handler: `https://your-app.up.railway.app/api/twilio/voice/process-smart`
   * Transcribe handler: `https://your-app.up.railway.app/api/twilio/voice/transcribe-smart`
   * Recording status: `https://your-app.up.railway.app/api/twilio/voice/recording-status`
3. **Povolte outbound hovory** pro UK/US čísla v GeoPermissions
4. **Transcription Settings:**
   * Language: `cs-CZ` (čeština)
   * Timeout: 20s
   * Max Length: 90s
   * Trim Silence: enabled

## 📚 Přidání lekce

1. **Přihlaste se do admin rozhraní** na `/admin`
2. **Klikněte na "Nová lekce"**
3. **Vyplňte formulář:**
   * Název lekce
   * Kategorie (např. "Lidské tělo")
   * Jazyk (cs, en, de, sk)
   * Obsah lekce (text)
   * Test otázky (JSON format)
4. **Přiřaďte lekci uživateli** v sekci "Správa uživatelů"

## 🧪 Spuštění testů

```bash
cd react-dashboard/backend && npm test
```

## 📞 Spuštění manuálního hovoru

Přes admin rozhraní:
1. **Jděte na `/admin/users`**
2. **Klikněte "Zavolat"** u konkrétního uživatele
3. **Sledujte progress** v real-time

## 🔍 Debugging

### Logy k sledování:
```bash
# Twilio Transcription
🤖 WHISPER: Starting OpenAI Whisper transcription
✅ WHISPER: Transcription successful: [text]

# Fallback System
🔄 FALLBACK: Using default response: B
✅ Fallback TwiML response sent

# Database Saving
💾 Saving test results to database...
✅ Test results saved: X/Y (Z%)
```

## Architektura

* **FastAPI** pro webové rozhraní a Twilio webhooky
* **SQLAlchemy** pro práci s databází (PostgreSQL)
* **Twilio Media Streams** pro real-time audio komunikaci
* **OpenAI Realtime API** s modelem `gpt-4o-realtime-preview-2024-10-01` pro speech-to-speech
* **WebSocket** komunikace pro real-time audio streaming mezi Twilio a OpenAI

## Technické detaily

### Real-time Audio Pipeline
```
Twilio Media Stream → WebSocket (/audio) → OpenAI Realtime API → WebSocket → Twilio
```

### Audio zpracování
- **Vstup**: Twilio Media Stream (G.711 μ-law, 8kHz, mono)
- **Zpracování**: Přímé předání do OpenAI Realtime API (bez konverze)
- **Výstup**: OpenAI Realtime API → G.711 μ-law → Twilio Media Stream
- **Chunking**: Audio chunky předávány v real-time bez buffering

### AI Pipeline (Real-time)
1. **Příjem audio** z Twilio Media Stream
2. **Přímé předání** do OpenAI Realtime API (`input_audio_buffer.append`)
3. **Real-time zpracování** pomocí `gpt-4o-realtime-preview-2024-10-01`
4. **Automatická detekce řeči** (Server VAD)
5. **Streaming audio odpověď** (`response.audio.delta`)
6. **Přímé předání** zpět do Twilio Media Stream

### WebSocket zprávy

#### Twilio → OpenAI:
```json
{
  "type": "input_audio_buffer.append",
  "audio": "base64_encoded_mulaw_audio"
}
```

#### OpenAI → Twilio:
```json
{
  "event": "media",
  "streamSid": "stream_id",
  "media": {
    "payload": "base64_encoded_mulaw_audio"
  }
}
```

### Klíčové OpenAI Realtime API zprávy:
- `session.update` - Konfigurace session
- `input_audio_buffer.append` - Audio data od uživatele
- `response.create` - Požadavek na odpověď
- `response.audio.delta` - Streaming audio odpověď
- `input_audio_buffer.speech_stopped` - Detekce konce řeči

## Licence

MIT 