# ── Capacitor bridge ─────────────────────────────────────────────────────────
# The JavaScript layer calls Capacitor plugin methods by reflection.
# Without these rules ProGuard strips them and the app crashes at runtime.

-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# ── AndroidX & AppCompat ──────────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── WebView JavaScript interface ─────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Keep line numbers in crash reports ───────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Suppress known-safe warnings from transitive deps ────────────────────────
-dontwarn org.slf4j.**
-dontwarn com.google.android.gms.**
