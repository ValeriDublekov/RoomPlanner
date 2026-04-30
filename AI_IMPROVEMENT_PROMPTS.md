# AI Improvement Prompts

Този файл съдържа малки, самостоятелни промптове за подобрения по проекта. Всеки промпт е направен така, че да може да се подаде отделно на AI с по-малък контекстен прозорец.

## How To Use

1. Подай само един промпт наведнъж.
2. Не комбинирай няколко промпта в една сесия.
3. AI-то трябва да чете първо само файловете, изброени в секцията `Read first`.
4. Ако задачата изисква нови файлове, те трябва да са минималният необходим брой.
5. Не се пипат несвързани части от проекта.
6. След всяка промяна се прави най-тясната възможна проверка: тест, typecheck или diff.

## Suggested Order

1. Prompt 1: Geometry tests
2. Prompt 2: Store slice tests
3. Prompt 3: Export utility tests
4. Prompt 4: Split geometry module
5. Prompt 5: Refactor canvas interaction hook
6. Prompt 6: Remove duplicated wall-rendering logic
7. Prompt 7: Introduce narrower Zustand selectors
8. Prompt 8: Replace hardcoded viewport offsets
9. Prompt 9: Clean import boundaries
10. Prompt 10: Improve persisted store maintenance
11. Prompt 11: Audit markdown documentation
12. Prompt 12: Execute markdown cleanup
13. Prompt 13: Add tooling consistency

---

## Prompt 1: Add Geometry Tests

```text
Цел:
Добави още автоматични тестове за чистите geometry helper-и, без да променяш публичното поведение.

Read first:
- src/lib/geometry.ts
- src/lib/geometry.test.ts

Constraints:
- Не променяй production логиката, освен ако не откриеш очевиден bug, който е нужен за да минат тестовете.
- Не рефакторирай geometry.ts в тази задача.
- Добавяй само тесни, детерминистични тестове.

Tasks:
- Намери pure helper функции в src/lib/geometry.ts, които в момента нямат покритие.
- Добави тестове за edge cases: гранични стойности, zero-distance, collinear/degenerate cases, rotation cases, snapping thresholds.
- Ако има formatting или unit-conversion helpers, добави тестове и за тях.

Done criteria:
- geometry.test.ts покрива съществено повече функции от geometry.ts.
- Новите тестове са ясни и deterministic.
- Няма промяна в публичното API.

Verification:
- Пусни само таргетираните tests, ако е възможно.
- Ако няма таргетиран test command, пусни npm test.
```

## Prompt 2: Add Store Slice Tests

```text
Цел:
Добави автоматични тестове за store slice-овете и за основни state transitions, без да променяш архитектурата.

Read first:
- src/store.ts
- src/store/slices/authSlice.ts
- src/store/slices/dimensionSlice.ts
- src/store/slices/furnitureSlice.ts
- src/store/slices/projectSlice.ts
- src/store/slices/roomSlice.ts
- src/store/slices/uiSlice.ts

Constraints:
- Не прави голям refactor на store структурата.
- Не променяй persist behavior, освен ако не е нужно за тестируемост и е минимално.
- Не включвай UI компонентни тестове в тази задача.

Tasks:
- Добави тестове за ключови state transitions във всеки slice.
- Добави поне няколко теста за комбинации между slices, ако те зависят от общ store shape.
- Провери migrate и partialize логиката в src/store.ts с тесни тестове.

Done criteria:
- Има отделни, смислени тестове за основните write operations в store-а.
- Persist-sensitive полетата са проверени.
- Има поне базова проверка на migration behavior.

Verification:
- Пусни само новите tests, ако е възможно.
- Иначе пусни npm test.
```

## Prompt 3: Add Export Utility Tests

```text
Цел:
Добави тесни тестове за export helper-ите, за да се намали рискът от regression при DXF/GLB/OBJ export.

Read first:
- src/lib/dxfExport.ts
- src/lib/glbExport.ts
- src/lib/objExport.ts
- src/lib/threeSceneGenerator.ts
- src/types.ts

Constraints:
- Не променяй output format-а без ясна причина.
- Не добавяй тежки integration тестове.
- Използвай малки representative input fixtures.

Tasks:
- Добави тестове, които валидират, че export helper-ите връщат очаквания тип резултат.
- Добави тестове за non-empty export при валиден минимален input.
- Добави тестове за graceful behavior при празен или частично невалиден input, ако кодът го допуска.

Done criteria:
- Има тестове за поне DXF и един 3D export path.
- Тестовете не зависят от външни услуги.
- Тестовете валидират shape и базово съдържание, а не крехки пълни snapshot-и, освен ако това е оправдано.

Verification:
- Пусни таргетираните tests.
```

## Prompt 4: Split geometry.ts Into Smaller Modules

```text
Цел:
Раздели големия geometry module на по-малки файлове с по-ясна отговорност, без да променяш външното поведение.

Read first:
- src/lib/geometry.ts
- src/lib/geometry.test.ts
- src/lib/utils.ts

Constraints:
- Запази съществуващите exports или осигури безопасна съвместимост за call sites.
- Не смесвай този refactor с нови feature промени.
- Промяната трябва да е механична и лесна за review.

Tasks:
- Раздели geometry.ts на логични модули, например math, collision, polygon, formatting или близка структура според реалното съдържание.
- Обнови imports там, където е необходимо.
- Ако е полезно, остави тънък aggregator file, за да не се чупят call sites наведнъж.

Done criteria:
- geometry.ts вече не е монолитен файл.
- Отговорностите са разпределени по смислен начин.
- Съществуващите тестове продължават да минават.

Verification:
- Пусни tests за geometry.
- Пусни npm run lint, ако това реално означава typecheck в проекта.
```

## Prompt 5: Refactor useCanvasLogic.ts Around Tool Handlers

```text
Цел:
Намали отговорностите на useCanvasLogic.ts, като изтласкаш mode-specific логиката към tool handlers там, където е приложимо.

Read first:
- src/hooks/useCanvasLogic.ts
- src/lib/tools/registry.ts
- src/lib/tools/types.ts
- src/lib/tools/SelectTool.ts
- src/lib/tools/DrawTool.ts
- src/lib/tools/MeasurementTool.ts
- src/lib/tools/PrimitiveTool.ts
- src/lib/tools/PlaceFurnitureTool.ts
- src/lib/tools/AttachmentTool.ts
- src/lib/tools/CalibrationTool.ts

Constraints:
- Не променяй UX поведението умишлено.
- Не въвеждай нова абстракция, ако текущата registry структура е достатъчна.
- Пази промяната локална около hook-а и tool handlers.

Tasks:
- Намери останалите mode-dependent branch-ове в useCanvasLogic.ts.
- Прецени кои от тях логично принадлежат на tool handlers.
- Изнеси логиката към подходящи handlers и опрости hook-а.

Done criteria:
- useCanvasLogic.ts е по-кратък и по-ясен.
- Mode-specific logic е по-близо до конкретния tool.
- Няма регресия в event flow.

Verification:
- Пусни тесен typecheck или test, ако има.
- Ако няма, използвай git diff като последна проверка за обхвата на промяната.
```

## Prompt 6: Remove Duplicated Wall Rendering Logic

```text
Цел:
Премахни дублираната логика за wall rendering между RoomItem и RoomEditor.

Read first:
- src/components/Canvas/RoomItem.tsx
- src/components/Canvas/RoomEditor.tsx
- TECHNICAL_DEBTS.md

Constraints:
- Не променяй визуалното поведение умишлено.
- Не прави голямо пренареждане на Canvas архитектурата.
- Изнеси само наистина споделената логика.

Tasks:
- Намери дублираните части за segment identification и wall rendering.
- Извади ги в shared utility или reusable renderer component.
- Опрости двата файла така, че да останат с ясни роли.

Done criteria:
- Дублирането е осезаемо намалено.
- И двата файла остават четими.
- Поведението на рендериране остава същото.

Verification:
- Пусни typecheck за засегнатите файлове чрез проекта.
```

## Prompt 7: Introduce Narrower Zustand Selectors

```text
Цел:
Намали broad subscriptions към useStore() и въведи по-тесни selector-и в най-натоварените потребители.

Read first:
- src/store.ts
- src/App.tsx
- src/hooks/useCanvasLogic.ts
- src/components/Canvas/CanvasStage.tsx
- src/components/Sidebar/PropertyEditor.tsx

Constraints:
- Не пренаписвай целия store access pattern в една задача.
- Избери малък брой high-impact consumers.
- Не въвеждай premature optimization извън очевидните случаи.

Tasks:
- Намери места, които взимат твърде много state през useStore().
- Замени ги с по-тесни selector-и.
- Ако е нужно, изнеси selector helpers в малък shared файл.

Done criteria:
- Засегнатите компоненти четат по-малко state.
- Кодът е по-ясен и по-малко крехък при бъдещи промени в store shape.
- Няма функционална промяна.

Verification:
- Пусни typecheck.
```

## Prompt 8: Replace Hardcoded Viewport Offsets

```text
Цел:
Замени hardcoded offsets за sidebar/layout с по-динамичен механизъм за измерване на наличното drawing area.

Read first:
- TECHNICAL_DEBTS.md
- файловете, които имплементират fitToScreen
- файловете, които имплементират ensureVisible
- src/components/RightSidebar.tsx
- src/components/Canvas/CanvasStage.tsx

Constraints:
- Не променяй layout structure повече от нужното.
- Не добавяй сложна resize система, ако може да се реши по-просто.
- Дръж промяната фокусирана само върху измерването и използването на drawable area.

Tasks:
- Намери къде са hardcoded стойностите за layout offsets.
- Замени ги с измерване на реалния viewport или drawing container.
- Обнови fit/visibility логиката така, че да не зависи от магически числа.

Done criteria:
- Няма hardcoded sidebar-width offsets в критичната viewport логика.
- Кодът е по-устойчив на UI промени.

Verification:
- Пусни typecheck.
- Ако има лесен manual sanity check в кода, използвай го.
```

## Prompt 9: Clean Import Boundaries

```text
Цел:
Подобри maintainability чрез по-чисти import boundaries между Canvas, Sidebar и ThreeD зоните.

Read first:
- src/components/Canvas/CanvasHeader.tsx
- src/components/Canvas/
- src/components/Sidebar/
- src/components/ThreeD/
- tsconfig.json

Constraints:
- Не прави голяма folder reorganization.
- Не създавай твърде много barrel files без реална нужда.
- Целта е по-чист import graph, не козметичен churn.

Tasks:
- Намери най-чупливите deep relative imports и cross-feature imports.
- Въведи малки подобрения: selector exports, локални index файлове или alias-based imports, само там където има реална полза.
- Намали директната зависимост между несвързани feature области.

Done criteria:
- Import-ите са по-четими и по-малко крехки.
- Няма безсмислено масово пренаписване на файлове.

Verification:
- Пусни typecheck.
```

## Prompt 10: Improve Persisted Store Maintenance

```text
Цел:
Подобри maintainability на persisted Zustand store-а, особено около migration typing и partialize правилата.

Read first:
- src/store.ts
- src/store/slices/projectSlice.ts
- src/store/slices/roomSlice.ts
- src/store/slices/furnitureSlice.ts

Constraints:
- Не променяй persisted data shape без силна причина.
- Не въвеждай нов state library.
- Пази backward compatibility, доколкото е разумно.

Tasks:
- Намали any usage в migrate логиката.
- Направи partialize секцията по-лесна за поддръжка, ако може без поведенческа промяна.
- Добави кратка локална документация в кода, само ако е нужна за следващи migration-и.

Done criteria:
- store.ts е по-ясен за бъдещи version bump-ове.
- any usage е намалена или по-добре ограничена.
- Persist logic е по-лесна за review.

Verification:
- Пусни typecheck.
- Ако има tests за store, пусни и тях.
```

## Prompt 11: Audit Markdown Documentation

```text
Цел:
Направи audit на root markdown документацията и подготви конкретен план за консолидация, без още да триеш файлове.

Read first:
- README.md
- ARCHITECTURE.md
- CONCEPT.md
- FUNCTIONALITY.md
- TECHNICAL_DOCS.md
- Project_Summary.md
- USER_GUIDE.md
- FUNCTIONAL_SPEC_ROOM_DRAWING.md
- GEOMETRY_SPEC.md
- FIREBASE_AUTH_SETUP.md

Constraints:
- Не изтривай файлове в тази задача.
- Не пренаписвай документация масово.
- Извади само практичен consolidation plan.

Tasks:
- Опиши кои документи се припокриват и кои са уникални.
- Подготви duplication matrix или кратка таблица.
- Предложи кои файлове трябва да останат source-of-truth и кои могат да се слеят или архивират.

Done criteria:
- Има ясен audit резултат.
- Ясно е кои файлове не трябва да се трият, например setup-specific docs.
- Следващ AI може да изпълни cleanup-а само по този audit.

Verification:
- Запази audit резултата в markdown файл.
```

## Prompt 12: Execute Markdown Cleanup After Audit

```text
Цел:
Изпълни cleanup на markdown файловете само според вече изготвен audit, без да се губи уникално съдържание.

Read first:
- README.md
- ARCHITECTURE.md
- CONCEPT.md
- FUNCTIONALITY.md
- TECHNICAL_DOCS.md
- Project_Summary.md
- USER_GUIDE.md
- FUNCTIONAL_SPEC_ROOM_DRAWING.md
- GEOMETRY_SPEC.md
- FIREBASE_AUTH_SETUP.md
- audit файла от предишната задача

Constraints:
- Не трий файлове, преди уникалното им съдържание да е преместено или запазено.
- Запази setup-specific и operational docs, ако не са реално дублирани.
- Дръж README.md кратък и полезен като входна точка.

Tasks:
- Консолидирай припокриващите се документи.
- Остави по-малък брой source-of-truth файлове.
- Изтрий само файловете, които вече са напълно излишни след консолидацията.

Done criteria:
- Документацията е по-компактна и по-малко дублирана.
- Няма изгубено уникално съдържание.
- Остава ясен entry point за нов разработчик.

Verification:
- Провери git diff за документационния обхват.
```

## Prompt 13: Add Tooling Consistency With Minimal Disruption

```text
Цел:
Подобри consistency на development tooling-а с минимален риск и без голям formatting churn.

Read first:
- package.json
- tsconfig.json
- .gitignore
- .github/

Constraints:
- Не въвеждай агресивен formatter setup, който ще пренапише целия repo.
- Ако добавяш linting, то трябва да е минимално и practical.
- Не променяй build workflow без добра причина.

Tasks:
- Провери какво липсва за базова code-quality дисциплина.
- Ако е оправдано, добави минимален ESLint или подобен check.
- Увери се, че import style и TypeScript setup могат да се поддържат по-предсказуемо.

Done criteria:
- Има поне базова tooling стъпка за consistency.
- Промяната е малка и reviewable.
- Няма масови unrelated formatting промени.

Verification:
- Пусни новия check или актуализирания npm script.
```