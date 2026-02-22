# iOS → Android Reference: Swift/SwiftUI → Kotlin/Compose

Reference this file during every iOS→Android conversion. Contains all pattern mappings needed to produce production-ready Kotlin/Compose/Room code from Swift/SwiftUI/SwiftData source.

---

## 1. Language Constructs

### Types
| Swift | Kotlin |
|-------|--------|
| `String` | `String` |
| `Int` | `Int` |
| `Double` | `Double` |
| `Float` | `Float` |
| `Bool` | `Boolean` |
| `[T]` | `List<T>` / `MutableList<T>` |
| `[K: V]` | `Map<K, V>` / `MutableMap<K, V>` |
| `Set<T>` | `Set<T>` |
| `T?` | `T?` (nullable) |
| `(T, U)` tuple | `Pair<T, U>` or `data class` |
| `Any` | `Any` |
| `Void` | `Unit` |
| `Never` | `Nothing` |

### Null Safety
- `name?.count ?? 0` → `name?.length ?: 0`
- `if let name = name { }` → `name?.let { }`
- `guard let x = x else { return }` → `val x = x ?: return`

### Structs → Data Classes
```swift
struct Point { var x: Double; var y: Double }
```
```kotlin
data class Point(val x: Double, val y: Double)
```

### Protocols → Interfaces
```swift
protocol Fetchable { associatedtype T; func fetch(id: String) async throws -> T }
```
```kotlin
interface Fetchable<T> { suspend fun fetch(id: String): T }
```

### Extensions → Extension Functions
```swift
extension String { var isValidEmail: Bool { contains("@") } }
```
```kotlin
val String.isValidEmail: Boolean get() = contains("@")
```

### Enums with Raw Values
```swift
enum TaskStatus: String, Codable {
    case booked = "Booked"
    case inProgress = "In Progress"
}
```
```kotlin
enum class TaskStatus(val value: String) {
    BOOKED("Booked"),
    IN_PROGRESS("In Progress");
    companion object {
        fun fromValue(value: String) = values().find { it.value == value }
    }
}
```

### Error Handling
- Swift `throws/try/catch` → Kotlin `try/catch` (exceptions) or sealed `Result` class
- Swift `Result<T, Error>` → `sealed class ApiResult<out T>` with `Success`, `Error`, `Loading`

---

## 2. Concurrency

### async/await → Coroutines
| Swift | Kotlin |
|-------|--------|
| `async func` | `suspend fun` |
| `try await x()` | `x()` (inside suspend context) |
| `Task { }` | `viewModelScope.launch { }` |
| `Task.detached { }` | `CoroutineScope(Dispatchers.IO).launch { }` |
| `async let x = fetch()` | `async { fetch() }` (coroutine async builder) |

### DispatchQueue → Dispatchers
| Swift | Kotlin |
|-------|--------|
| `DispatchQueue.main.async` | `withContext(Dispatchers.Main)` |
| `DispatchQueue.global().async` | `withContext(Dispatchers.IO)` |
| `DispatchQueue.global(qos: .background)` | `withContext(Dispatchers.Default)` |

### Combine → Flow
| Swift/Combine | Kotlin/Flow |
|---|---|
| `PassthroughSubject<T, Never>` | `MutableSharedFlow<T>()` |
| `CurrentValueSubject<T, Never>(v)` | `MutableStateFlow<T>(v)` |
| `@Published var x = v` | `val x = MutableStateFlow(v)` |
| `.sink { }` | `.collect { }` (in coroutine) |
| `.map { }` | `.map { }` |
| `.filter { }` | `.filter { }` |
| `.combineLatest` | `combine(flow1, flow2) { a, b -> }` |
| `.receive(on: .main)` | `.flowOn(Dispatchers.Main)` |

---

## 3. State Management

| SwiftUI | Compose |
|---|---|
| `@State var x = v` | `var x by remember { mutableStateOf(v) }` |
| `@StateObject var vm = VM()` | `val vm: VM = viewModel()` |
| `@ObservedObject var vm` | `val state by vm.uiState.collectAsStateWithLifecycle()` |
| `@EnvironmentObject var svc` | Hilt `@Inject` in ViewModel |
| `@Binding var x` | `onXChange: (T) -> Unit` callback parameter |
| `@AppStorage("key")` | `DataStore` + `collectAsStateWithLifecycle()` |
| `@Environment(\.dismiss)` | `navController.popBackStack()` |

**CRITICAL:** Use `collectAsStateWithLifecycle()` — NOT `collectAsState()` — for lifecycle-safe Flow collection in Compose.

---

## 4. SwiftUI → Jetpack Compose

### Layout
| SwiftUI | Compose |
|---|---|
| `VStack` | `Column` |
| `HStack` | `Row` |
| `ZStack` | `Box` |
| `LazyVStack` | `LazyColumn` |
| `LazyHStack` | `LazyRow` |
| `List` | `LazyColumn` |
| `ScrollView` | `Column(Modifier.verticalScroll(rememberScrollState()))` |
| `Spacer()` | `Spacer(Modifier.weight(1f))` |
| `Divider()` | `HorizontalDivider()` |
| `.frame(width:height:)` | `Modifier.size()` / `.width()` / `.height()` |
| `.padding()` | `Modifier.padding()` |
| `.background(Color.x)` | `Modifier.background(OpsTheme.colors.x)` |
| `.cornerRadius(r)` | `Modifier.clip(RoundedCornerShape(r.dp))` |
| `.ignoresSafeArea()` | `Modifier.fillMaxSize()` inside `Scaffold` |

### Components
| SwiftUI | Compose |
|---|---|
| `Text("x")` | `Text("x")` |
| `Image(systemName: "star")` | `Icon(Icons.Default.Star, contentDescription = "star")` |
| `Image("photo")` | `Image(painterResource(R.drawable.photo), contentDescription = "")` |
| `AsyncImage(url:)` | `AsyncImage(model = url, ...)` (Coil) |
| `Button("x") { }` | `Button(onClick = { }) { Text("x") }` |
| `TextField("hint", text: $x)` | `OutlinedTextField(value = x, onValueChange = { x = it }, label = { Text("hint") })` |
| `SecureField("hint", text: $x)` | `OutlinedTextField(..., visualTransformation = PasswordVisualTransformation())` |
| `Toggle(isOn: $x)` | `Switch(checked = x, onCheckedChange = { x = it })` |
| `Slider(value: $x)` | `Slider(value = x, onValueChange = { x = it })` |
| `ProgressView()` | `CircularProgressIndicator()` |
| `ProgressView(value: v)` | `LinearProgressIndicator(progress = { v })` |
| `.sheet(isPresented: $x)` | `if (x) { ModalBottomSheet(onDismissRequest = { x = false }) { } }` |
| `.alert(isPresented: $x)` | `if (x) { AlertDialog(onDismissRequest = { x = false }, ...) }` |

### Navigation
```swift
NavigationStack {
    List(items) { item in
        NavigationLink(item.title, value: item)
    }
    .navigationDestination(for: Item.self) { ItemDetailView(item: $0) }
}
```
```kotlin
NavHost(navController, startDestination = "list") {
    composable("list") {
        ItemListScreen(onItemClick = { navController.navigate("detail/${it.id}") })
    }
    composable("detail/{id}") { backStackEntry ->
        ItemDetailScreen(id = backStackEntry.arguments?.getString("id"))
    }
}
```

---

## 5. Architecture: MVVM

### ViewModel
```swift
@MainActor
class TaskListViewModel: ObservableObject {
    @Published var tasks: [ProjectTask] = []
    @Published var isLoading = false
    func loadTasks() async { ... }
}
```
```kotlin
@HiltViewModel
class TaskListViewModel @Inject constructor(
    private val repository: TaskRepository
) : ViewModel() {
    private val _tasks = MutableStateFlow<List<ProjectTask>>(emptyList())
    val tasks: StateFlow<List<ProjectTask>> = _tasks.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun loadTasks() {
        viewModelScope.launch {
            _isLoading.value = true
            _tasks.value = repository.fetchAll()
            _isLoading.value = false
        }
    }
}
```

### Repository
```kotlin
class TaskRepository @Inject constructor(
    private val dao: ProjectTaskDao,
    private val apiService: BubbleApiService
) {
    fun fetchAll(): Flow<List<ProjectTaskEntity>> = dao.getAllTasks()
    suspend fun sync() {
        val remote = apiService.getTasks()
        dao.upsertAll(remote.body()!!.results.map { it.toEntity() })
    }
}
```

---

## 6. Data Persistence: SwiftData → Room

### @Model → @Entity
```swift
@Model class ProjectTask {
    var id: String
    var title: String
    var dueDate: Date?
}
```
```kotlin
@Entity(tableName = "project_tasks")
data class ProjectTaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val dueDate: Long? = null   // epoch millis — NOT Date object
)
```

**Date rule:** Always store dates as `Long` (epoch millis) in Room. Add TypeConverters:
```kotlin
@TypeConverter fun fromTimestamp(v: Long?): Date? = v?.let { Date(it) }
@TypeConverter fun toTimestamp(d: Date?): Long? = d?.time
```

### FetchDescriptor → DAO
```kotlin
@Dao interface ProjectTaskDao {
    @Query("SELECT * FROM project_tasks WHERE status = :status")
    fun getByStatus(status: String): Flow<List<ProjectTaskEntity>>

    @Query("SELECT * FROM project_tasks")
    fun getAll(): Flow<List<ProjectTaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(task: ProjectTaskEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(tasks: List<ProjectTaskEntity>)

    @Delete suspend fun delete(task: ProjectTaskEntity)
}
```

### Relationships
```kotlin
data class ProjectWithTasks(
    @Embedded val project: ProjectEntity,
    @Relation(parentColumn = "id", entityColumn = "projectId")
    val tasks: List<ProjectTaskEntity>
)
```

---

## 7. Networking: URLSession → Retrofit

### Service interface
```kotlin
interface BubbleApiService {
    @GET("project_task")
    suspend fun getTasks(): Response<BubbleListResponse<ProjectTaskDto>>

    @POST("project_task")
    suspend fun createTask(@Body request: CreateTaskRequest): Response<BubbleCreateResponse>

    @PATCH("project_task/{id}")
    suspend fun updateTask(@Path("id") id: String, @Body request: UpdateTaskRequest): Response<Unit>
}
```

### Auth interceptor
```kotlin
class AuthInterceptor @Inject constructor(
    private val authManager: AuthManager
) : Interceptor {
    override fun intercept(chain: Chain): Response =
        chain.proceed(
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer ${authManager.token}")
                .build()
        )
}
```

### Codable → Moshi
```swift
struct UserDto: Codable {
    let id: String
    enum CodingKeys: String, CodingKey { case id = "_id" }
}
```
```kotlin
@JsonClass(generateAdapter = true)
data class UserDto(@Json(name = "_id") val id: String)
```

---

## 8. Storage

| iOS | Android |
|-----|---------|
| Keychain | `EncryptedSharedPreferences` |
| `UserDefaults` | `DataStore Preferences` |
| `FileManager` | `Context.filesDir` / `File` |

```kotlin
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
val prefs = EncryptedSharedPreferences.create(
    context, "secure_prefs", masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

---

## 9. Dependency Injection: Environment → Hilt

```kotlin
@HiltAndroidApp class OpsApplication : Application()

@Module @InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton
    fun provideDatabase(@ApplicationContext context: Context): OpsDatabase =
        Room.databaseBuilder(context, OpsDatabase::class.java, "ops.db").build()
}

@HiltViewModel
class MyViewModel @Inject constructor(private val repo: MyRepository) : ViewModel()
```

---

## 10. Platform APIs

| iOS | Android |
|-----|---------|
| `CoreLocation` | `FusedLocationProviderClient` |
| `UserNotifications` | `NotificationManager` + `WorkManager` |
| `UIApplication.shared` | `Context` |
| `NotificationCenter.default.post` | `SharedFlow.emit()` or `BroadcastReceiver` |
| `Timer` | `coroutineScope.launch { delay(ms) }` |
| `UIApplication.shared.open(url)` | `startActivity(Intent(ACTION_VIEW, Uri.parse(url)))` |
| `UIPasteboard` | `ClipboardManager` |
| `UIImagePickerController` | `rememberLauncherForActivityResult(PickVisualMedia())` |

---

## 11. Third-Party Library Substitutions

| iOS | Android | Notes |
|-----|---------|-------|
| Firebase | Firebase Android SDK | Same API, different imports |
| GoogleSignIn | `play-services-auth` | Similar API |
| Kingfisher | Coil (`AsyncImage`) | |
| Alamofire | Retrofit + OkHttp | |
| SwiftLint | Detekt / ktlint | |
| RxSwift | Kotlin Flow + coroutines | |
| Realm | Room | |
| KeychainAccess | EncryptedSharedPreferences | |
| Lottie | Lottie for Android | Same JSON format |
| Charts | Vico or MPAndroidChart | |
| PromiseKit | coroutines | |

---

## 12. OPS Project Specifics

**Apply these rules for EVERY OPS iOS → Android conversion.**

### Paths
- Source iOS: `C:\OPS\opsapp-ios\OPS\`
- Target Android: `C:\OPS\opsapp-android\`
- Package: `co.opsapp.ops`
- Plan docs: `C:\OPS\android-plan-v2\` — read these before converting any file

### Design Tokens — NEVER hardcode values
| Value | OpsTheme token |
|-------|---------------|
| `#000000` | `OpsTheme.colors.background` |
| `#417394` (steel blue) | `OpsTheme.colors.primary` |
| `#C4A868` (amber/gold) | `OpsTheme.colors.secondary` |
| `#E5E5E5` (text) | `OpsTheme.colors.onBackground` |
| `#93321A` (error) | `OpsTheme.colors.error` |
| 56dp touch targets | `OpsTheme.dimensions.touchTarget` |
| 8-point grid | `OpsTheme.dimensions.spacing` |

### Critical Rules
- **PIN: 4-digit only** — iOS uses 4-digit. Android `PinManager` must also be 4-digit (was incorrectly 6-digit — fix this wherever encountered)
- **BubbleFields: byte-identical** — copy exact string constant values from iOS, do not paraphrase or abbreviate
- **Task status: use `"Booked"` not `"Scheduled"`** — Nov 2025 migration; map legacy `"Scheduled"` → `"Booked"` on read
- **CalendarEvents: taskId required** — non-null, always set
- **Role detection order:** check `company.adminIds` FIRST, then `employeeType`, then default to Field Crew
- **Sync debouncing:** 2-second delay to prevent duplicate syncs
- **CompanyDTO dates:** accept both UNIX timestamp (Long) and ISO8601 (String)
- **SubClientDTO phone:** can be String or Number — handle both types
- **Project teamMembers:** computed from task assignments, NOT from Bubble legacy field

### OpsLoadingOverlay — NO parameters
```kotlin
// CORRECT
if (isLoading) { OpsLoadingOverlay() }

// WRONG — will not compile
OpsLoadingOverlay(isLoading = isLoading)
```

### OPS Component Mapping
| iOS | Android |
|-----|---------|
| `OpsPrimaryButton` | `OpsPrimaryButton` |
| `OpsSecondaryButton` | `OpsSecondaryButton` |
| `OpsAccentButton` | `OpsAccentButton` |
| `OpsDestructiveButton` | `OpsDestructiveButton` |
| `OpsCard` | `OpsCard` |
| `OpsElevatedCard` | `OpsElevatedCard` |
| `OpsTextField` | `OpsTextField` |
| `OpsSearchField` | `OpsSearchField` |
| `OpsStatusBadge` | `OpsStatusBadge` |
| `OpsEmptyState` | `OpsEmptyState` |
| `OpsConfirmDialog` | `OpsConfirmDialog` |

---

## 13. Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `var` state in Compose without `remember` | `var x by remember { mutableStateOf(v) }` |
| Calling suspend fun outside coroutine | Wrap in `viewModelScope.launch { }` |
| Network call on main thread | `withContext(Dispatchers.IO)` |
| `collectAsState()` instead of lifecycle-aware | Use `collectAsStateWithLifecycle()` |
| Hardcoded color hex values | Use `OpsTheme.colors.X` |
| `OpsLoadingOverlay(isLoading=...)` | `OpsLoadingOverlay()` — no params |
| `Date` stored as Date object in Room | Store as `Long` with TypeConverter |
| iOS `enum` raw value access | Add `companion object { fromValue() }` |
| `guard let` with no Kotlin equivalent | Use `?: return` or `?.let { }` |
| Direct ViewModel instantiation | Use `viewModel()` composable or Hilt |
| SwiftData `.cascade` delete rules | Implement manually in repository on delete |
| iOS tuple return values | Use `data class` or `Pair<A, B>` |
| Missing `BubbleFields` constant | Copy exact string from iOS — byte-identical |
| PIN digit count wrong | Always 4-digit — fix any 6-digit references |
