# Android → iOS Reference: Kotlin/Compose → Swift/SwiftUI

> **Status:** Stub. This reference file needs to be written before `app-platform-converter`
> can handle Android → iOS conversions reliably.

## Structure (when implemented)

Follow the same section structure as `ios-to-android.md`:

1. Language Constructs (Kotlin → Swift)
2. Concurrency (Coroutines/Flow → async-await/Combine)
3. State Management (StateFlow → @Published/@State)
4. Jetpack Compose → SwiftUI (layout, components, navigation)
5. Architecture (Hilt ViewModel → ObservableObject)
6. Data Persistence (Room → SwiftData)
7. Networking (Retrofit → URLSession)
8. Storage (EncryptedSharedPreferences → Keychain)
9. Dependency Injection (Hilt → SwiftUI Environment)
10. Platform APIs (Android → iOS equivalents)
11. Third-Party Library Substitutions (Coil → Kingfisher, etc.)
12. Project-Specific Rules (if applicable)
13. Common Pitfalls

## Contributing

1. Write this file following the structure of `ios-to-android.md`
2. Test on a real Android project targeting iOS output
3. Document iOS-specific gotchas (App Store requirements, Swift concurrency model, SwiftUI lifecycle)
4. No changes to SKILL.md needed — just write this file and the conversion path activates
