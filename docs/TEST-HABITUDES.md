# 🧪 Test : Habitudes Manquantes

## 📝 Message à envoyer sur WhatsApp

**"Quelles habitudes il me reste à faire ?"**

---

## 🔍 Vérifications

### 1. Détection du pattern
Dans les logs de l'agent IA, tu devrais voir :
```
🔍 Détection habitudes manquantes: true pour: quelles habitudes il me reste à faire ?
```

### 2. Récupération des habitudes
L'agent IA va :
1. Récupérer toutes tes habitudes
2. Vérifier lesquelles sont complétées aujourd'hui
3. Filtrer pour ne garder que les manquantes

### 3. Réponse attendue
Si des habitudes manquantes :
```
📋 **Habitudes à faire lundi 27 octobre 2025**

⚠️ Tu as X habitude(s) à compléter :

1. 🔁 Nom de l'habitude
   Description de l'habitude

💪 Tu as encore le temps de les compléter aujourd'hui !
```

Si toutes les habitudes sont complétées :
```
✅ Toutes tes habitudes pour lundi 27 octobre 2025 sont complétées ! 🎉

Continue comme ça ! 💪
```

---

## ❌ Problème Possible

Si l'agent IA répond avec les tâches au lieu des habitudes :
- **Cause** : L'agent ne détecte pas le pattern
- **Solution** : Redémarrer l'agent IA pour appliquer les modifications

---

## ✅ Test Effectué

Message envoyé : "Quels sont mes habitudes qu'il me reste à faire ?"

**Résultat attendu** : Liste des habitudes manquantes

**Si ça ne fonctionne pas** : Redémarrer l'agent IA !

