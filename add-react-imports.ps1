# PowerShell script to add React imports to component files
$sourceDir = "src"
$files = Get-ChildItem -Path $sourceDir -Recurse -Include "*.tsx", "*.jsx" | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Check if file contains JSX but no React import
    if (($content -match "<[A-Za-z]" -or $content -match "/>" -or $content -match "</[A-Za-z]") -and 
        -not ($content -match "import React" -or $content -match "import \{ .*React.* \}")) {
        
        Write-Host "Adding React import to $($file.FullName)..."
        
        # Add React import at the top of the file
        $content = "import React from 'react'`n$content"
        $modified = $true
    }
    
    # Save changes if modified
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated $($file.FullName)"
    }
}

Write-Host "All files processed." 