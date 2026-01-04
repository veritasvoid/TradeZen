import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, SHEETS } from '@/lib/constants';

// Settings store with Google Sheets sync
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoaded: false, // Track if we've loaded from Sheets
      
      // Load settings from Google Sheets
      loadFromSheets: async () => {
        try {
          const sheetId = '1ruzm5D-ofifAU7d5oRChBT7DAYFTlVLgULSsXvYEtXU';
          
          // Fetch from Settings sheet
          const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${SHEETS.SETTINGS}!A2:B`
          });

          const rows = response.result.values || [];
          
          // Parse settings from sheet (format: [[key, value], [key, value]])
          const sheetSettings = {};
          rows.forEach(([key, value]) => {
            if (key === 'privacyMode') {
              sheetSettings[key] = value === 'true' || value === true;
            } else if (key === 'currency') {
              sheetSettings[key] = value;
            } else if (key === 'startingBalance') {
              sheetSettings[key] = parseFloat(value) || 0;
            }
          });

          console.log('📥 Loaded settings from Sheets:', sheetSettings);

          // Merge with defaults and update store
          set({
            settings: { ...DEFAULT_SETTINGS, ...sheetSettings },
            isLoaded: true
          });

          return sheetSettings;
        } catch (error) {
          console.error('Failed to load settings from Sheets:', error);
          set({ isLoaded: true }); // Mark as loaded even on error
          return null;
        }
      },

      // Save settings to Google Sheets
      saveToSheets: async (settingsToSave) => {
        try {
          const sheetId = '1ruzm5D-ofifAU7d5oRChBT7DAYFTlVLgULSsXvYEtXU';
          
          // Convert settings object to rows [[key, value], ...]
          const rows = Object.entries(settingsToSave).map(([key, value]) => [key, String(value)]);

          // Clear existing settings first
          await window.gapi.client.sheets.spreadsheets.values.clear({
            spreadsheetId: sheetId,
            range: `${SHEETS.SETTINGS}!A2:B`
          });

          // Write new settings
          await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${SHEETS.SETTINGS}!A2`,
            valueInputOption: 'RAW',
            resource: { values: rows }
          });

          console.log('📤 Saved settings to Sheets:', settingsToSave);
          return true;
        } catch (error) {
          console.error('Failed to save settings to Sheets:', error);
          return false;
        }
      },
      
      // Update settings (saves to both localStorage and Sheets)
      updateSettings: async (newSettings) => {
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        // Update local state immediately
        set({ settings: updatedSettings });
        
        // Save to Sheets in background
        get().saveToSheets(updatedSettings);
      },

      // Toggle privacy mode
      togglePrivacyMode: async () => {
        const currentPrivacy = get().settings.privacyMode;
        const newPrivacy = !currentPrivacy;
        
        // Update local state immediately
        set((state) => ({
          settings: { ...state.settings, privacyMode: newPrivacy }
        }));
        
        console.log('🔒 Privacy mode:', newPrivacy ? 'ON' : 'OFF');
        
        // Save to Sheets
        const updatedSettings = { ...get().settings, privacyMode: newPrivacy };
        await get().saveToSheets(updatedSettings);
      },

      // Get currency symbol
      getCurrencySymbol: () => {
        return get().settings.currency;
      }
    }),
    {
      name: 'tradezen-settings', // localStorage key
      version: 1
    }
  )
);

// Initialize settings from Sheets on app load
export const initializeSettings = async () => {
  const store = useSettingsStore.getState();
  
  // Only load if we haven't loaded yet
  if (!store.isLoaded) {
    await store.loadFromSheets();
  }
};
