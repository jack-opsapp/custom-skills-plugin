# Matched Geometry & Hero Transitions — Complete Reference

Hero transitions between views using `matchedGeometryEffect`, plus the iOS 18 `NavigationTransition` zoom API. These create spatial continuity — the user perceives one element morphing into another rather than a cut.

---

## 1. matchedGeometryEffect Fundamentals

`matchedGeometryEffect` synchronizes the geometry (size and position) of two views that share the same namespace and identifier. When one view leaves the hierarchy and the other enters, SwiftUI animates the geometry transition.

### Requirements

1. **Namespace:** A `@Namespace` property declares a unique namespace. Both source and destination must use the same namespace.
2. **Identifier:** A hashable value that links the source view to the destination view. Same ID = same logical element.
3. **Matched properties:** By default, both size and position are matched. Use the `properties` parameter to match only `.frame`, `.position`, or `.size`.
4. **One active at a time:** Only one view with a given namespace+ID combination should be in the hierarchy at any time. If both are present simultaneously, behavior is undefined.

### Basic Pattern

```swift
struct BasicHero: View {
    @Namespace private var heroNamespace
    @State private var showDetail = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            if !showDetail {
                // Source view
                RoundedRectangle(cornerRadius: 12)
                    .fill(.blue)
                    .matchedGeometryEffect(id: "card", in: heroNamespace)
                    .frame(width: 100, height: 100)
                    .onTapGesture {
                        withAnimation(reduceMotion
                            ? .easeInOut(duration: 0.25)
                            : .spring(response: 0.45, dampingFraction: 0.85)
                            // dampingFraction 0.85 = smooth morph, no oscillation
                        ) {
                            showDetail = true
                        }
                    }
            } else {
                // Destination view
                RoundedRectangle(cornerRadius: 24)
                    .fill(.blue)
                    .matchedGeometryEffect(id: "card", in: heroNamespace)
                    .frame(maxWidth: .infinity)
                    .frame(height: 400)
                    .onTapGesture {
                        withAnimation(reduceMotion
                            ? .easeInOut(duration: 0.2)
                            : .spring(response: 0.4, dampingFraction: 0.8)
                        ) {
                            showDetail = false
                        }
                    }
            }
        }
        .sensoryFeedback(
            .impact(flexibility: .soft, intensity: 0.4),
            trigger: showDetail
        )
    }
}
```

---

## 2. List-to-Detail Hero Transition

The most common pattern: tapping a list item expands it into a full detail view.

```swift
struct Project: Identifiable {
    let id = UUID()
    let name: String
    let color: Color
}

struct ProjectListView: View {
    @Namespace private var heroNamespace
    @State private var selectedProject: Project?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    let projects = [
        Project(name: "Foundation Repair", color: .blue),
        Project(name: "Deck Installation", color: .green),
        Project(name: "Roof Replacement", color: .orange),
    ]

    var body: some View {
        ZStack {
            // List layer
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(projects) { project in
                        if selectedProject?.id != project.id {
                            ProjectRow(project: project, namespace: heroNamespace)
                                .onTapGesture {
                                    withAnimation(reduceMotion
                                        ? .easeInOut(duration: 0.25)
                                        : .spring(response: 0.5, dampingFraction: 0.85)
                                    ) {
                                        selectedProject = project
                                    }
                                }
                        } else {
                            // Placeholder to maintain layout
                            Color.clear
                                .frame(height: 80)
                        }
                    }
                }
                .padding()
            }
            .opacity(selectedProject == nil ? 1 : 0.3)

            // Detail overlay
            if let project = selectedProject {
                ProjectDetailView(
                    project: project,
                    namespace: heroNamespace,
                    onDismiss: {
                        withAnimation(reduceMotion
                            ? .easeInOut(duration: 0.2)
                            : .spring(response: 0.4, dampingFraction: 0.8)
                        ) {
                            selectedProject = nil
                        }
                    }
                )
                .transition(.opacity)
                // Overlay above everything — this is critical for the hero to render
                // above the list during the transition
                .zIndex(1)
            }
        }
        .sensoryFeedback(
            .impact(flexibility: .solid, intensity: 0.5),
            trigger: selectedProject?.id
        )
    }
}

struct ProjectRow: View {
    let project: Project
    let namespace: Namespace.ID

    var body: some View {
        HStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(project.color)
                .frame(width: 48, height: 48)
                .matchedGeometryEffect(id: "\(project.id)-icon", in: namespace)

            Text(project.name)
                .font(.headline)
                .matchedGeometryEffect(id: "\(project.id)-name", in: namespace)

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemGray6))
                .matchedGeometryEffect(id: "\(project.id)-bg", in: namespace)
        )
    }
}

struct ProjectDetailView: View {
    let project: Project
    let namespace: Namespace.ID
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Hero elements — matched IDs
            RoundedRectangle(cornerRadius: 16)
                .fill(project.color)
                .frame(height: 200)
                .matchedGeometryEffect(id: "\(project.id)-icon", in: namespace)

            Text(project.name)
                .font(.largeTitle.bold())
                .matchedGeometryEffect(id: "\(project.id)-name", in: namespace)

            // Non-hero content fades in
            Text("Project details, schedule, crew assignments...")
                .font(.body)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color(.systemGray6))
                .matchedGeometryEffect(id: "\(project.id)-bg", in: namespace)
        )
        .onTapGesture(perform: onDismiss)
    }
}
```

### Critical Implementation Details

1. **Only one view with a given ID should be active at a time.** Use `if/else` (not `opacity`) to toggle between source and destination. Both being in the hierarchy causes visual artifacts.

2. **Use `zIndex(1)` on the detail overlay.** Without it, the hero element may render beneath other list items during the transition.

3. **Match multiple elements independently.** Each hero element (icon, title, background) gets its own ID. This produces a more sophisticated transition than matching a single container.

4. **Placeholder in list.** When the detail is showing, insert a `Color.clear` placeholder at the source position to prevent the list from collapsing and causing a jarring layout shift.

5. **Non-hero content uses `.transition(.opacity)`.** Content that exists only in the detail view (description, actions) fades in over the hero transition.

---

## 3. Tab Transition

Smooth indicator movement between tabs using `matchedGeometryEffect`.

```swift
struct CustomTabBar: View {
    @Namespace private var tabNamespace
    @Binding var selectedTab: Int
    let tabs: [String]
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(tabs.enumerated()), id: \.offset) { index, title in
                Button {
                    withAnimation(reduceMotion
                        ? .easeInOut(duration: 0.15)
                        : .spring(response: 0.3, dampingFraction: 0.75)
                        // dampingFraction 0.75 = snappy with minimal overshoot
                    ) {
                        selectedTab = index
                    }
                } label: {
                    Text(title.uppercased())
                        .font(.caption.weight(.semibold))
                        .tracking(1.2)
                        .foregroundStyle(selectedTab == index ? .white : .secondary)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .background {
                            if selectedTab == index {
                                Capsule()
                                    .fill(Color(red: 0.35, green: 0.47, blue: 0.58))
                                    .matchedGeometryEffect(id: "tab-indicator", in: tabNamespace)
                            }
                        }
                }
            }
        }
        .padding(4)
        .background(
            Capsule()
                .fill(Color(.systemGray6))
        )
        .sensoryFeedback(.selection, trigger: selectedTab)
    }
}
```

---

## 4. Card Expansion

Expanding a compact card into a full-screen sheet using matched geometry.

```swift
struct ExpandableCard: View {
    @Namespace private var cardNamespace
    @State private var isExpanded = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            if !isExpanded {
                // Compact card
                VStack(alignment: .leading, spacing: 8) {
                    Text("TODAY'S SCHEDULE")
                        .font(.caption.weight(.semibold))
                        .tracking(1.5)
                        .foregroundStyle(.secondary)
                        .matchedGeometryEffect(id: "title", in: cardNamespace)

                    Text("3 Jobs")
                        .font(.title2.bold())
                        .matchedGeometryEffect(id: "count", in: cardNamespace)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .frame(height: 100)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemGray6))
                        .matchedGeometryEffect(id: "bg", in: cardNamespace)
                )
                .padding(.horizontal)
                .onTapGesture {
                    withAnimation(reduceMotion
                        ? .easeInOut(duration: 0.25)
                        : .spring(response: 0.5, dampingFraction: 0.88)
                    ) {
                        isExpanded = true
                    }
                }
            } else {
                // Expanded full-screen card
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text("TODAY'S SCHEDULE")
                            .font(.caption.weight(.semibold))
                            .tracking(1.5)
                            .foregroundStyle(.secondary)
                            .matchedGeometryEffect(id: "title", in: cardNamespace)

                        Spacer()

                        Button {
                            withAnimation(reduceMotion
                                ? .easeInOut(duration: 0.2)
                                : .spring(response: 0.4, dampingFraction: 0.8)
                            ) {
                                isExpanded = false
                            }
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Text("3 Jobs")
                        .font(.title.bold())
                        .matchedGeometryEffect(id: "count", in: cardNamespace)

                    // Additional content — not hero-matched, fades in
                    VStack(alignment: .leading, spacing: 12) {
                        JobRow(time: "8:00 AM", name: "Foundation Pour")
                        JobRow(time: "11:30 AM", name: "Site Inspection")
                        JobRow(time: "2:00 PM", name: "Deck Frame")
                    }
                    .opacity(isExpanded ? 1 : 0)
                    .animation(.easeOut(duration: 0.2).delay(0.15), value: isExpanded)

                    Spacer()
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(Color(.systemGray6))
                        .matchedGeometryEffect(id: "bg", in: cardNamespace)
                )
                .ignoresSafeArea()
                .zIndex(1)
            }
        }
        .sensoryFeedback(
            .impact(flexibility: .solid, intensity: 0.5),
            trigger: isExpanded
        )
    }
}

struct JobRow: View {
    let time: String
    let name: String

    var body: some View {
        HStack {
            Text(time)
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
                .frame(width: 80, alignment: .leading)
            Text(name)
                .font(.body)
        }
    }
}
```

---

## 5. Namespace Management

### Rules

1. **One namespace per logical group of matched elements.** A list-to-detail transition uses one namespace. A tab bar uses a separate namespace. Do not share namespaces across unrelated transitions.

2. **Pass namespaces explicitly, not via environment.** Pass `Namespace.ID` as a parameter to child views. This makes the data flow explicit and avoids accidental matches.

3. **Unique IDs within a namespace.** If you have a list of items, use the item's stable `id` as part of the geometry ID: `"\(item.id)-icon"`. Never use array indices as IDs — they change when the list reorders.

4. **Namespace lifetime.** The `@Namespace` must live on the parent view that contains both the source and destination. If the namespace is declared on a child view that gets destroyed, the match breaks.

```swift
// WRONG: Namespace on child view
struct ChildA: View {
    @Namespace private var ns // Dies when ChildA is replaced
    // ...
}

// RIGHT: Namespace on parent, passed to children
struct Parent: View {
    @Namespace private var ns

    var body: some View {
        if showA {
            ChildA(namespace: ns)
        } else {
            ChildB(namespace: ns)
        }
    }
}
```

---

## 6. Timing Coordination

### Animation Duration

Hero transitions need enough time for the eye to follow the element. Too fast and the spatial continuity is lost. Too slow and it feels sluggish.

| Transition Type | Recommended Duration | Spring Config |
|----------------|---------------------|---------------|
| Small card expand | 0.4-0.5s | `response: 0.45, dampingFraction: 0.85` |
| List row to full detail | 0.5-0.6s | `response: 0.5, dampingFraction: 0.85` |
| Tab indicator slide | 0.25-0.35s | `response: 0.3, dampingFraction: 0.75` |
| Card collapse (dismiss) | 0.35-0.45s | `response: 0.4, dampingFraction: 0.8` |
| Full-screen to thumbnail | 0.4-0.5s | `response: 0.45, dampingFraction: 0.9` |

### Coordinating Non-Hero Content

Content that appears only in the destination should fade in after the hero has moved most of the way. Use `.animation` with a delay.

```swift
// Non-hero content fades in 150ms after hero starts
.opacity(isExpanded ? 1 : 0)
.animation(.easeOut(duration: 0.2).delay(0.15), value: isExpanded)
```

---

## 7. iOS 18 NavigationTransition Zoom

iOS 18 introduced `NavigationTransition` with built-in zoom transitions. When supported, prefer this over manual `matchedGeometryEffect` for navigation push/pop.

```swift
@available(iOS 18.0, *)
struct ZoomTransitionExample: View {
    @Namespace private var zoomNamespace
    let items = (0..<10).map { "Item \($0)" }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(items, id: \.self) { item in
                        NavigationLink(value: item) {
                            Text(item)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(.ultraThinMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .matchedTransitionSource(id: item, in: zoomNamespace)
                        // matchedTransitionSource marks the source for the zoom
                    }
                }
                .padding()
            }
            .navigationDestination(for: String.self) { item in
                DetailPage(item: item)
                    .navigationTransition(.zoom(sourceID: item, in: zoomNamespace))
                    // navigationTransition defines how the destination appears
            }
        }
    }
}

@available(iOS 18.0, *)
struct DetailPage: View {
    let item: String

    var body: some View {
        VStack {
            Text(item)
                .font(.largeTitle.bold())
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.ultraThinMaterial)
    }
}
```

### Key Differences from matchedGeometryEffect

| Aspect | matchedGeometryEffect | NavigationTransition.zoom |
|--------|----------------------|--------------------------|
| iOS requirement | iOS 15+ | iOS 18+ |
| Use case | Any view transition | NavigationStack push/pop |
| Manual state management | Yes (if/else toggle) | No (NavigationStack handles it) |
| Overlay management | Manual (zIndex, ZStack) | Automatic |
| Sheet/FullScreenCover | Not applicable | Supported via `.navigationTransition` |
| Customization | Full control | Limited (system-managed) |
| Reliability | Requires careful ID/namespace management | More reliable out of the box |

### Fallback Pattern

```swift
struct HeroTransition: View {
    @Namespace private var namespace

    var body: some View {
        if #available(iOS 18.0, *) {
            NavigationStack {
                listContent
                    .navigationDestination(for: Item.self) { item in
                        DetailView(item: item)
                            .navigationTransition(.zoom(sourceID: item.id, in: namespace))
                    }
            }
        } else {
            // iOS 17 fallback: manual matchedGeometryEffect
            ManualHeroTransition(namespace: namespace)
        }
    }
}
```
