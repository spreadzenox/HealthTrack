# Règles R8 de la variante play (seule construite en release, POL-PLAY-10 ; spécification : journal/IDEES.md I185).
# Déjà gardés sans rien écrire ici : plugins Capacitor (règles « consumer » de @capacitor/android : toute classe
# `extends com.getcapacitor.Plugin`, ses @PluginMethod et rappels), @JavascriptInterface
# (proguard-android-optimize.txt), activité, services, récepteurs et jobs du manifeste (AAPT), Play Billing et Play
# Integrity (leurs propres règles). Jamais de `-keep class ** { *; }` : il annulerait l'obscurcissement.

# Traces de plantage lisibles dans la Play Console grâce au fichier de correspondance (mapping.txt), sans le nom des
# fichiers sources.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Lecture du visage : ONNX Runtime et LiteRT appellent leurs classes Java depuis le code natif (JNI, par leur nom) ;
# renommées, le modèle ne se chargerait plus. Règles étroites, limitées à leurs paquets.
-keep class ai.onnxruntime.** { *; }
-keep class com.google.ai.edge.litert.** { *; }
-keep class org.tensorflow.lite.** { *; }
-dontwarn ai.onnxruntime.**
