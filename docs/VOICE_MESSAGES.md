# 🎙️ Messages Vocaux - Documentation

## 📋 **Vue d'ensemble**

Votre agent IA supporte maintenant les **messages vocaux** ! Vous pouvez parler directement à votre assistant au lieu de taper vos messages.

## 🚀 **Fonctionnalités**

### ✅ **Ce qui est supporté :**
- 🎙️ **Messages vocaux WhatsApp** (format OGG)
- 🎵➡️📝 **Transcription automatique** avec OpenAI Whisper
- 🌍 **Reconnaissance française** optimisée
- 🤖 **Traitement IA** du texte transcrit
- 📱 **Accusé de réception** avec transcription
- 🗑️ **Nettoyage automatique** des fichiers temporaires

### 📱 **Formats audio supportés :**
- **OGG** (format standard WhatsApp)
- **MP3, MP4, MPEG, MPGA**
- **M4A, WAV, WEBM**

---

## ⚙️ **Configuration Requise**

### 1. **Clé API OpenAI**
```bash
# Dans votre fichier .env
OPENAI_API_KEY=sk-votre-cle-openai
```

### 2. **Token WhatsApp**
```bash
# Déjà configuré normalement
WHATSAPP_ACCESS_TOKEN=votre-token-whatsapp
```

---

## 🎯 **Comment utiliser**

### **📱 Étape 1: Envoyer un message vocal**
1. Ouvrez WhatsApp
2. Maintenez le bouton microphone 🎙️
3. Parlez clairement en français
4. Relâchez pour envoyer

### **🤖 Étape 2: Réception automatique**
```
🎙️ Message vocal reçu et transcrit :

"j'ai fait toutes mes habitudes hier"

Traitement en cours...
```

### **✅ Étape 3: Réponse de l'IA**
```
🎉 BRAVO ! Toutes vos habitudes HIER sont validées !

📊 RÉSUMÉ HIER :
✅ 5 habitudes complétées
🎯 Total : 5 habitudes de votre routine
```

---

## 🎙️ **Exemples de commandes vocales**

### **📋 Gestion des tâches :**
- *"Mes tâches prioritaires"*
- *"J'ai fait toutes mes tâches hier"*
- *"Créer une tâche urgent appeler le client"*

### **🔄 Gestion des habitudes :**
- *"J'ai fait toutes mes habitudes"*
- *"Mes habitudes du jour"*
- *"J'ai fait l'habitude sport avant-hier"*

### **📅 Avec dates spécifiques :**
- *"J'ai terminé toutes mes tâches le 15 décembre 2024"*
- *"Toutes mes habitudes du 20 décembre"*

---

## 🔧 **Architecture Technique**

### **🔄 Flux de traitement :**
```
📱 Message vocal WhatsApp
    ↓
📥 Téléchargement automatique
    ↓
🎵➡️📝 Transcription Whisper (français)
    ↓
🤖 Traitement par l'agent IA
    ↓
📤 Réponse textuelle
```

### **🗂️ Fichiers impliqués :**
- `src/services/ai/VoiceTranscriptionService.ts` - Service de transcription
- `src/services/ai/start.ts` - Webhook étendu pour audio
- `temp/` - Dossier des fichiers temporaires

### **🗑️ Nettoyage automatique :**
- Suppression immédiate après transcription
- Nettoyage des anciens fichiers (>1h)
- Pas de stockage permanent

---

## 🎯 **Avantages**

### **🚀 Rapidité :**
- Plus rapide que taper
- Idéal en déplacement
- Mains libres

### **🎯 Précision :**
- Reconnaissance française optimisée
- Gestion des accents et expressions
- Confirmation de transcription

### **🔒 Sécurité :**
- Fichiers temporaires uniquement
- Suppression automatique
- Pas de stockage audio

---

## ⚠️ **Limitations**

### **📏 Limites techniques :**
- **Durée max :** ~25MB (limite WhatsApp)
- **Langues :** Optimisé pour le français
- **Qualité :** Dépend de la qualité audio

### **💰 Coûts :**
- **Whisper :** ~$0.006 / minute audio
- **GPT :** Coût habituel pour le traitement texte

### **🌐 Connectivité :**
- Nécessite connexion internet
- Dépend de la qualité réseau

---

## 🛠️ **Dépannage**

### **❌ "Je n'ai pas pu transcrire votre message vocal"**
**Solutions :**
- Vérifiez votre connexion internet
- Parlez plus clairement
- Réduisez les bruits de fond
- Vérifiez la clé OpenAI

### **❌ "Erreur lors de la réception du message vocal"**
**Solutions :**
- Vérifiez le token WhatsApp
- Redémarrez le service
- Vérifiez les logs serveur

### **🔍 Debug :**
```bash
# Logs à surveiller
🎙️ Message vocal détecté
📥 Téléchargement du fichier audio
🎵➡️📝 Transcription du fichier audio
✅ Transcription réussie
```

---

## 🎉 **Cas d'Usage Parfaits**

### **🚗 En voiture :**
- *"J'ai fait l'habitude podcast"*
- *"Créer tâche acheter du lait"*

### **🏃‍♂️ En sport :**
- *"J'ai fait l'habitude course"*
- *"Mes tâches pour demain"*

### **🛏️ Au lit :**
- *"J'ai fait toutes mes habitudes du soir"*
- *"Mes priorités pour demain"*

---

## 📈 **Statistiques d'Usage**

Le service track automatiquement :
- Nombre de messages vocaux traités
- Temps de transcription moyen  
- Taux de succès des transcriptions
- Nettoyage des fichiers temporaires

---

**🎙️ Votre assistant IA vous écoute maintenant ! Essayez dès maintenant en envoyant un message vocal sur WhatsApp !** 🚀 