import { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_SCOPES, 
  STORAGE_KEYS,
  GOOGLE_SHEETS_API,
  GOOGLE_DRIVE_API,
  GOOGLE_DRIVE_API_V3,
  SHEET_NAME,
  SHEETS
} from './constants';

// Google API Client with auto token refresh
class GoogleAPIClient {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
    this.refreshTimer = null;
  }

  // Initialize Google API
  async init() {
    return new Promise((resolve) => {
      // Load Google API scripts
      if (!window.google) {
        const script1 = document.createElement('script');
        script1.src = 'https://apis.google.com/js/api.js';
        script1.onload = () => {
          window.gapi.load('client', async () => {
            await window.gapi.client.init({
              apiKey: '', // We don't need API key, using OAuth
              discoveryDocs: [
                'https://sheets.googleapis.com/$discovery/rest?version=v4',
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
              ]
            });
            this.gapiInited = true;
            if (this.gisInited) resolve();
          });
        };
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = () => {
          this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GOOGLE_SCOPES,
            callback: '', // Will be set during sign-in
          });
          this.gisInited = true;
          if (this.gapiInited) resolve();
        };
        document.body.appendChild(script2);
      } else {
        resolve();
      }
    });
  }

  // Refresh token automatically
  async refreshToken() {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            console.error('Token refresh failed:', resp.error);
            // Token refresh failed, user needs to sign in again
            this.signOut();
            window.location.reload();
            reject(resp);
            return;
          }
          
          this.accessToken = resp.access_token;
          window.gapi.client.setToken({ access_token: this.accessToken });
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
          
          console.log('✅ Token refreshed successfully');
          
          // Schedule next refresh in 50 minutes (before 1 hour expiry)
          this.scheduleTokenRefresh();
          
          resolve(resp);
        };

        // Request new token silently (no popup)
        this.tokenClient.requestAccessToken({ prompt: '' });
      } catch (err) {
        console.error('Token refresh error:', err);
        reject(err);
      }
    });
  }

  // Schedule automatic token refresh
  scheduleTokenRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Refresh token every 50 minutes (tokens expire at 60 minutes)
    const refreshInterval = 50 * 60 * 1000; // 50 minutes in milliseconds
    
    this.refreshTimer = setTimeout(() => {
      console.log('🔄 Auto-refreshing token...');
      this.refreshToken().catch(err => {
        console.error('Auto-refresh failed:', err);
      });
    }, refreshInterval);
    
    console.log('⏰ Token refresh scheduled for 50 minutes from now');
  }

  // Sign in with Google
  async signIn() {
    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            reject(resp);
            return;
          }
          this.accessToken = resp.access_token;
          window.gapi.client.setToken({ access_token: this.accessToken });
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
          
          // Start auto-refresh cycle
          this.scheduleTokenRefresh();
          
          resolve(resp);
        };

        // Check if already have a token
        const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (savedToken) {
          this.accessToken = savedToken;
          window.gapi.client.setToken({ access_token: savedToken });
          
          // Start auto-refresh for existing token
          this.scheduleTokenRefresh();
          
          resolve({ access_token: savedToken });
        } else {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  // Sign out
  signOut() {
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.accessToken = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    // DON'T clear sheet ID and folder ID on sign out!
    // Keep them so we reuse same sheet
    window.gapi.client.setToken(null);
  }

  // Check if signed in
  isSignedIn() {
    return !!this.accessToken || !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Get or create spreadsheet - FIXED to search Drive first
  async getOrCreateSpreadsheet() {
    // 1. Check localStorage first
    const savedSheetId = localStorage.getItem(STORAGE_KEYS.SHEET_ID);
    
    if (savedSheetId) {
      try {
        await window.gapi.client.sheets.spreadsheets.get({
          spreadsheetId: savedSheetId
        });
        return savedSheetId;
      } catch (err) {
        console.log('Saved sheet not accessible, searching Drive...');
      }
    }

    // 2. Search Google Drive for existing TradeZen sheet
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${SHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        fields: 'files(id, name)',
        orderBy: 'createdTime desc'
      });

      if (response.result.files && response.result.files.length > 0) {
        const existingSheetId = response.result.files[0].id;
        console.log('Found existing TradeZen sheet, reusing it');
        localStorage.setItem(STORAGE_KEYS.SHEET_ID, existingSheetId);
        return existingSheetId;
      }
    } catch (err) {
      console.log('Could not search Drive, creating new sheet');
    }

    // 3. Create new spreadsheet only if none found
    console.log('Creating new TradeZen sheet');
    const response = await window.gapi.client.sheets.spreadsheets.create({
      properties: {
        title: SHEET_NAME
      },
      sheets: [
        { 
          properties: { 
            title: SHEETS.TRADES,
            gridProperties: {
              rowCount: 1000,
              columnCount: 12
            }
          } 
        },
        { 
          properties: { 
            title: SHEETS.TAGS,
            gridProperties: {
              rowCount: 1000,
              columnCount: 5
            }
          } 
        },
        { 
          properties: { 
            title: SHEETS.SETTINGS,
            gridProperties: {
              rowCount: 1000,
              columnCount: 2
            }
          } 
        }
      ]
    });

    const sheetId = response.result.spreadsheetId;
    const sheets = response.result.sheets;
    
    localStorage.setItem(STORAGE_KEYS.SHEET_ID, sheetId);

    // Initialize with headers
    await this.initializeSheets(sheetId, sheets);

    return sheetId;
  }

  // Initialize sheets with headers
  async initializeSheets(sheetId, sheets) {
    const tradesSheetId = sheets.find(s => s.properties.title === SHEETS.TRADES).properties.sheetId;
    const tagsSheetId = sheets.find(s => s.properties.title === SHEETS.TAGS).properties.sheetId;
    const settingsSheetId = sheets.find(s => s.properties.title === SHEETS.SETTINGS).properties.sheetId;

    const requests = [
      {
        updateCells: {
          range: {
            sheetId: tradesSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'tradeId' } },
              { userEnteredValue: { stringValue: 'date' } },
              { userEnteredValue: { stringValue: 'time' } },
              { userEnteredValue: { stringValue: 'amount' } },
              { userEnteredValue: { stringValue: 'tagId' } },
              { userEnteredValue: { stringValue: 'tagName' } },
              { userEnteredValue: { stringValue: 'tagColor' } },
              { userEnteredValue: { stringValue: 'tagEmoji' } },
              { userEnteredValue: { stringValue: 'driveImageId' } },
              { userEnteredValue: { stringValue: 'notes' } },
              { userEnteredValue: { stringValue: 'createdAt' } },
              { userEnteredValue: { stringValue: 'updatedAt' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      {
        updateCells: {
          range: {
            sheetId: tagsSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'tagId' } },
              { userEnteredValue: { stringValue: 'name' } },
              { userEnteredValue: { stringValue: 'color' } },
              { userEnteredValue: { stringValue: 'emoji' } },
              { userEnteredValue: { stringValue: 'order' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      },
      {
        updateCells: {
          range: {
            sheetId: settingsSheetId,
            startRowIndex: 0,
            endRowIndex: 1
          },
          rows: [{
            values: [
              { userEnteredValue: { stringValue: 'key' } },
              { userEnteredValue: { stringValue: 'value' } }
            ]
          }],
          fields: 'userEnteredValue'
        }
      }
    ];

    await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: { requests }
    });
  }

  // Get or create organized Drive folder structure
  async getOrCreateDriveFolder() {
    const savedFolderId = localStorage.getItem(STORAGE_KEYS.DRIVE_FOLDER_ID);
    
    if (savedFolderId) {
      try {
        // Verify folder exists
        await window.gapi.client.drive.files.get({
          fileId: savedFolderId
        });
        return savedFolderId;
      } catch (err) {
        console.log('Saved folder not found, searching/creating...');
      }
    }

    // Search for existing TradeZen folder
    const searchResponse = await window.gapi.client.drive.files.list({
      q: "name='TradeZen' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)'
    });

    let mainFolderId;

    if (searchResponse.result.files && searchResponse.result.files.length > 0) {
      mainFolderId = searchResponse.result.files[0].id;
    } else {
      // Create main TradeZen folder
      const mainFolder = await window.gapi.client.drive.files.create({
        resource: {
          name: 'TradeZen',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      mainFolderId = mainFolder.result.id;
    }

    // Search for Screenshots subfolder
    const subSearchResponse = await window.gapi.client.drive.files.list({
      q: `name='Screenshots' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    let screenshotsFolderId;

    if (subSearchResponse.result.files && subSearchResponse.result.files.length > 0) {
      screenshotsFolderId = subSearchResponse.result.files[0].id;
    } else {
      // Create Screenshots subfolder
      const screenshotsFolder = await window.gapi.client.drive.files.create({
        resource: {
          name: 'Screenshots',
          parents: [mainFolderId],
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      screenshotsFolderId = screenshotsFolder.result.id;
    }

    localStorage.setItem(STORAGE_KEYS.DRIVE_FOLDER_ID, screenshotsFolderId);
    return screenshotsFolderId;
  }

  // Upload image to Drive with better naming
  async uploadImage(imageBlob, filename) {
    const folderId = await this.getOrCreateDriveFolder();
    
    // Extract date and time from filename if present
    // Expected format: uuid_YYYY-MM-DD_HH-MM.jpg
    const parts = filename.split('_');
    let displayName = filename;
    
    if (parts.length >= 2) {
      const date = parts[1]; // YYYY-MM-DD
      const time = parts[2]?.replace('.jpg', ''); // HH-MM
      displayName = `Trade_${date}_${time || 'unknown'}.jpg`;
    }
    
    const metadata = {
      name: displayName,
      parents: [folderId],
      mimeType: 'image/jpeg'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', imageBlob);

    const response = await fetch(`${GOOGLE_DRIVE_API}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      },
      body: form
    });

    const data = await response.json();
    return data.id;
  }

  // Get image URL from Drive
  getImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
}

export const googleAPI = new GoogleAPIClient();
