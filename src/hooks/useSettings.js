import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STORAGE_KEYS, SHEETS } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settingsStore';

// Fetch settings from Google Sheets
const fetchSettings = async () => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  
  if (!sheetId) {
    console.log('⚙️ No sheet ID found, using default settings');
    return null;
  }
  
  console.log('⚙️ Fetching settings from sheet:', sheetId);

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEETS.SETTINGS}!A2:B10` // Key-Value pairs
    });

    const rows = response.result.values || [];
    console.log('📥 Received settings rows:', rows.length);
    
    // Convert rows to object { key: value }
    const settings = {};
    rows.forEach(row => {
      if (row && row.length >= 2) {
        const key = row[0];
        const value = row[1];
        
        // Parse boolean and number values
        if (value === 'true') settings[key] = true;
        else if (value === 'false') settings[key] = false;
        else if (!isNaN(value)) settings[key] = parseFloat(value);
        else settings[key] = value;
      }
    });
    
    console.log('✅ Parsed settings:', settings);
    return settings;
  } catch (error) {
    console.error('❌ Failed to fetch settings:', error);
    return null;
  }
};

// Update a single setting in Google Sheets
const updateSetting = async ({ key, value }) => {
  const sheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
  
  if (!sheetId) {
    throw new Error('No sheet ID found');
  }

  console.log('⚙️ Updating setting:', key, '=', value);

  try {
    // First, check if key exists
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${SHEETS.SETTINGS}!A:A`
    });

    const rows = response.result.values || [];
    const keyIndex = rows.findIndex(row => row[0] === key);
    
    if (keyIndex !== -1) {
      // Update existing row
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${SHEETS.SETTINGS}!B${keyIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[String(value)]]
        }
      });
    } else {
      // Append new row
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${SHEETS.SETTINGS}!A:B`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[key, String(value)]]
        }
      });
    }

    console.log('✅ Setting updated successfully');
    return { key, value };
  } catch (error) {
    console.error('❌ Failed to update setting:', error);
    throw error;
  }
};

// Custom hook to sync settings with Google Sheets
export const useSettings = () => {
  const queryClient = useQueryClient();
  const updateLocalSettings = useSettingsStore(state => state.updateSettings);

  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    onSuccess: (data) => {
      if (data) {
        // Update local store with fetched settings
        updateLocalSettings(data);
        console.log('✅ Local settings synced from Google Sheets');
      }
    }
  });
};

// Custom hook to update a setting
export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  const updateLocalSettings = useSettingsStore(state => state.updateSettings);

  return useMutation({
    mutationFn: updateSetting,
    onSuccess: ({ key, value }) => {
      // Update local store immediately
      updateLocalSettings({ [key]: value });
      
      // Invalidate settings query to refetch
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      
      console.log('✅ Setting synced:', key, '=', value);
    }
  });
};
