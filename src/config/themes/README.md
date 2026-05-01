# How to Add Interior Themes

To add a new interior theme to the application, follow these steps:

1. **Create a JSON file**: Create a new file in `src/config/themes/` (e.g., `my-new-style.json`).
2. **Follow the Schema**: The file must follow this structure:
   ```json
   {
     "id": "unique_id",
     "name": "Display Name",
     "wallColors": {
       "base": "#HEX",
       "secondary": "#HEX",
       "accent": "#HEX"
     },
     "woodColors": {
       "base": "#HEX",
       "front": "#HEX"
     },
     "textileColors": {
       "main": "#HEX",
       "secondary": "#HEX",
       "accent": "#HEX"
     }
   }
   ```
3. **Register the Theme**: Open `src/config/themes/index.ts` and:
   - Import your new JSON file.
   - Add it to the `INTERIOR_THEMES` array.

The application will automatically pick up the new theme and display it in the Sidebar.
