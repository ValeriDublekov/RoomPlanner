# Cloud And Persistence

## Firebase Surface

Defined in `src/firebase.ts`.

Key services:

- Firebase app initialization
- Google auth provider and popup sign-in
- Firestore database access

Config source:

- `firebase-applet-config.json`

## Auth Flow

`App.tsx` subscribes to `onAuthStateChanged` and writes user/loading state into the store.

Do not assume auth wiring lives only in the firebase helper.

## Project Save Behavior

`src/store/slices/projectSlice.ts` owns project save/load logic.

Save strategy:

1. if user is signed in, save to Firestore
2. otherwise, download local JSON

Cloud save payload includes serialized project state (using the topology-first RoomObject format) and metadata.

### Attachment Stability & Migrations

Because `wallAttachments` and `beam` attachments are coupled to ordered segment indices, any migration or logic that modifies room topology must handle index remapping. 

- **Explicit Saves**: The stored JSON contains raw vertices/edges. Reconstruction happens on the client side after loading.
- **Data Integrity**: When loading legacy projects (points-first), they are automatically migrated to topology-first during the `loadState` flow.

## Load Behavior

`loadState` in `projectSlice.ts`:

- accepts raw data or JSON string
- applies version-aware migration logic
- normalizes some legacy fields
- resets active selections

## Size Constraint Note

The code explicitly warns about Firestore document size pressure when project JSON grows too large, especially if blueprint image data is embedded.

Agents changing save behavior should keep in mind:

- Firestore document size limits
- background image size inflation
- the difference between cloud save and local download fallback

## Persisted Browser State Versus Saved Project

These are not the same thing.

- **Browser Persistence (Autosave)**: Handled by Zustand `persist` in `src/store.ts`. This saves the entire active store state to `localStorage` (including transient UI states).
- **Explicit Project Save/Load**: Handled in `projectSlice.ts`. This is a selective export of the domain model (rooms, furniture, etc.) for cloud storage or file export.

**Crucial**: Migrations (topology-first transition, etc.) must be applied to both paths to prevent stale data in the browser from breaking new code.
