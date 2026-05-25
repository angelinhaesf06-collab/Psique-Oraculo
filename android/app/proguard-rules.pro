# Capacitor basic ProGuard rules
-keep class com.getcapacitor.** { *; }
-keep  class * extends com.getcapacitor.Plugin { *; }
-keep  class * extends com.getcapacitor.BridgeActivity { *; }

# Keep your own package
-keep class com.psiqueoraculo.** { *; }

# General Android & Google rules are usually handled by getDefaultProguardFile('proguard-android.txt')
