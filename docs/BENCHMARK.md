# Benchmark modèles – Reconnaissance alimentaire (ingrédients + quantités)

**Cas d’usage :** à partir d’une image d’assiette / de repas → sortir une **liste d’ingrédients avec quantités estimées** (idéalement en français).

---

## 1. Critères de comparaison

| Critère | Description |
|--------|-------------|
| **Ingrédients** | Capacité à lister des aliments variés, plats composés, pas limité à une liste fixe (ex. 101 classes). |
| **Quantités** | Capacité à estimer portion (petite / moyenne / grande) ou ordre de grandeur (ex. « environ 150 g »). |
| **Français** | Sortie ou instructions en français correctement prises en compte. |
| **Format** | Respect d’un format structuré (ex. « ingrédient : quantité ») pour parsing automatique. |
| **VRAM** | Mémoire GPU nécessaire (impact sur accessibilité). |
| **Vitesse** | Temps d’inférence par image (après chargement du modèle). |
| **Facilité** | Intégration via Hugging Face / PyTorch, pas de stack custom. |

---

## 2. Modèles comparés

### 2.1 Vision-Language Models (VLMs) – description libre

Ces modèles prennent une **image + un prompt texte** et génèrent une **réponse en langage naturel**. Ils permettent d’obtenir une liste d’ingrédients + quantités en une seule passe, avec un prompt du type « Liste les aliments sur cette assiette avec une estimation de quantité pour chacun ».

| Modèle | Ingrédients | Quantités | Français | Format | VRAM (approx.) | Vitesse | Facilité |
|--------|-------------|-----------|----------|--------|----------------|---------|----------|
| **BLIP-2 (OPT-2.7B)** | ★★★ Bon | ★★ Moyen | ★★ (prompt FR) | ★★ Variable | ~6–8 Go | Rapide | ★★★ HF |
| **InstructBLIP (Flan-T5 XL)** | ★★★★ Très bon | ★★★ Bon | ★★ (prompt FR) | ★★★ Meilleur | ~10 Go | Moyen | ★★★ HF |
| **InstructBLIP (Vicuna-7B)** | ★★★★ Très bon | ★★★ Bon | ★★ | ★★★ | ~14 Go | Plus lent | ★★★ HF |
| **Qwen2-VL (2B / 7B)** | ★★★★ Très bon | ★★★ Bon | ★★★ Multilingue | ★★★ | 2B: ~5 Go, 7B: ~14 Go | 2B rapide | ★★★ HF (API différente) |
| **LLaVA-1.5 (7B)** | ★★★ Bon | ★★ Moyen | ★★ | ★★ | ~14 Go | Moyen | ★★★ HF |
| **Aya Vision (8B/32B)** | ★★★★ Ciblé FR | ★★★ | ★★★★ Français natif | ★★★ | 8B: ~16 Go | Moyen | ★★ Cohere/HF |

- **BLIP-2** : très bon en captioning, léger, mais ne reçoit pas l’instruction dans le Q-Former → suivi de consignes (format, liste) moins bon qu’InstructBLIP.
- **InstructBLIP** : même base que BLIP-2 mais **instruction tuning** → suit bien les consignes (« liste avec quantité », format). Flan-T5 XL est un bon compromis taille/qualité.
- **Qwen2-VL** : excellente compréhension visuelle et multilingue, très bon sur tâches de description détaillée ; API « chat » (conversation) différente de BLIP.
- **LLaVA** : fort en VQA, un peu moins orienté « liste structurée » que InstructBLIP/Qwen.
- **Aya Vision** : entraîné multilingue dont français → pertinent si la sortie doit être systématiquement en français de qualité.

### 2.2 Modèles dédiés « food » (classification / détection)

| Modèle | Ingrédients | Quantités | Français | Format | VRAM | Vitesse | Note |
|--------|-------------|-----------|----------|--------|------|---------|------|
| **BinhQuocNguyen/food-recognition-model** | ★★ 101 classes fixes | ★★★ (calories/portion) | N/A | ★★★ Structuré | Modéré | <2 s | Pas de liste libre d’ingrédients ; plats prédéfinis. |
| **OpenFoodFacts ingredient-detection** | Texte (emballage) | N/A | Oui | ★★★ | Faible | Rapide | Pour **texte** d’emballage, pas pour photo d’assiette. |

Les modèles « food » sont utiles pour **classification de type de plat** ou **estimation de calories** sur des catégories connues, mais ils **ne sortent pas une liste libre d’ingrédients** comme un VLM. Pour « image d’assiette → liste d’ingrédients + quantités », les VLMs sont adaptés.

---

## 3. Recommandation pour ton cas d’usage

**Objectif :** image d’assiette → **liste d’ingrédients + quantités**, de préférence en français, avec un format exploitable (parsing).

### Choix principal : **InstructBLIP (Flan-T5 XL)**

- **Pourquoi pas seulement BLIP-2 :** BLIP-2 est bon en description d’image mais moins bon pour **suivre une instruction précise** (liste, format « ingrédient : quantité »). InstructBLIP est entraîné pour ça et donne des réponses plus structurées.
- **Pourquoi Flan-T5 XL plutôt que Vicuna-7B :** moins de VRAM (~10 Go vs ~14 Go), tout en restant très bon sur les consignes ; bon compromis pour un usage local.
- **Français :** le modèle répond souvent en anglais ; un **prompt en français** (« Liste les aliments… avec une estimation de quantité ») suffit en pratique pour obtenir des listes exploitables, et le parsing peut normaliser les noms ensuite si besoin.

En résumé : **meilleur rapport qualité / format / coût (VRAM) pour « ingrédients + quantités » à partir d’une photo d’assiette.**

### Alternatives selon tes contraintes

- **GPU limité (~6 Go) :** garder **BLIP-2 (OPT-2.7B)** ; qualité un peu en retrait sur le format mais utilisable.
- **Besoin de français très naturel ou multilingue :** envisager **Qwen2-VL** (2B si peu de VRAM, 7B si possible) ou **Aya Vision** (8B) ; à intégrer avec leur API « chat ».
- **Besoin de calories + portions en plus :** combiner un VLM (ingrédients + quantités textuelles) avec un modèle du type **food-recognition-model** (classe de plat + estimation calories) en post-traitement.

---

## 4. Comment reproduire / étendre le benchmark

- Le script **`benchmark_models.py`** à la racine du projet lance **BLIP-2** et **InstructBLIP** sur une même image, mesure le temps et affiche les sorties brutes + parsées.
- Tu peux ajouter d’autres modèles (Qwen2-VL, LLaVA) dans ce script en réutilisant le même prompt et la même fonction de parsing pour comparer **qualité** et **temps** sur tes propres photos.

```bash
python benchmark_models.py chemin/vers/assiette.jpg
```

---

## 5. Références

- InstructBLIP: [InstructBLIP: Towards General-purpose Vision-Language Models with Instruction Tuning](https://arxiv.org/abs/2305.06500)
- BLIP-2: [BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models](https://arxiv.org/abs/2301.12597)
- Qwen2-VL: [Hugging Face – Qwen2-VL](https://huggingface.co/docs/transformers/main/en/model_doc/qwen2_vl)
- LOTUS (captioning benchmark): [LOTUS: A Unified Image Captioning Benchmark](https://lotus-vlm.github.io/)
- Food recognition (101 classes): [BinhQuocNguyen/food-recognition-model](https://huggingface.co/BinhQuocNguyen/food-recognition-model)
