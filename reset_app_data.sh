#!/bin/bash

echo "🔄 Resetting App Data"
echo "==================="

# Clear all localStorage data
osascript << 'APPLESCRIPT'
tell application "Safari"
    activate
    if (count of windows) > 0 then
        do JavaScript "
            console.log('🧹 Clearing all app data...');
            const keys = Object.keys(localStorage);
            const appKeys = keys.filter(key => key.startsWith('pdf-study-planner'));
            appKeys.forEach(key => localStorage.removeItem(key));
            localStorage.removeItem('pendingFolderCreation');
            console.log('✅ App data cleared. Refreshing page...');
            window.location.reload();
        " in document 1
    else
        display dialog "Please open http://localhost:3000 in Safari first"
    end if
end tell
APPLESCRIPT

echo "✅ App data reset complete!"
