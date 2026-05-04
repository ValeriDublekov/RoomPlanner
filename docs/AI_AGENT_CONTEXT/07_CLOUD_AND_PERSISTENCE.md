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

Cloud save payload includes serialized project state and metadata such as timestamps and optional thumbnails.

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

- browser persistence is handled by Zustand persist in `src/store.ts`
- explicit project save/load is handled in `projectSlice.ts`

Changes to one do not automatically cover the other.
