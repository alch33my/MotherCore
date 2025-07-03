# PowerShell script to fix React.FC references in TypeScript files
$sourceDir = "src"
$files = Get-ChildItem -Path $sourceDir -Recurse -Include "*.tsx", "*.ts" | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $modified = $false
    
    # Check if file contains React.FC
    if ($content -match "React\.FC") {
        Write-Host "Processing $($file.FullName)..."
        
        # Add FC type import if needed
        if (-not ($content -match "import type \{ .*FC.*\} from 'react'") -and -not ($content -match "import \{ .*FC.*\} from 'react'")) {
            if ($content -match "import \{ .* \} from 'react'") {
                # Add FC to existing import
                $content = $content -replace "import \{ (.*) \} from 'react'", "import { `$1 } from 'react';`nimport type { FC } from 'react';"
            } else {
                # Add new import line after any existing imports
                $content = $content -replace "(import .*;\n|^)", "`$1import type { FC } from 'react';"
            }
            $modified = $true
        }
        
        # Replace React.FC with FC
        if ($content -match "React\.FC") {
            $content = $content -replace "React\.FC", "FC"
            $modified = $true
        }
    }
    
    # Check for React.useEffect and other hooks
    if ($content -match "React\.(useEffect|useState|useRef|useCallback|useMemo|useContext)") {
        Write-Host "Fixing React hooks in $($file.FullName)..."
        
        # Extract all hooks used in the file
        $hooksMatches = [regex]::Matches($content, "React\.(useEffect|useState|useRef|useCallback|useMemo|useContext)")
        $hooks = $hooksMatches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
        
        # Add hooks to import if needed
        $hooksString = $hooks -join ", "
        
        if ($content -match "import \{ (.*) \} from 'react'") {
            # Add hooks to existing import
            $existingImports = $Matches[1]
            $newImports = "$existingImports, $hooksString"
            # Remove duplicates
            $importArray = $newImports -split ", " | ForEach-Object { $_.Trim() } | Select-Object -Unique
            $cleanImports = $importArray -join ", "
            $content = $content -replace "import \{ .* \} from 'react'", "import { $cleanImports } from 'react'"
        } else {
            # Add new import line
            $content = $content -replace "(import .*;\n|^)", "`$1import { $hooksString } from 'react';"
        }
        
        # Replace React.hook with hook
        foreach ($hook in $hooks) {
            $content = $content -replace "React\.$hook", $hook
        }
        
        $modified = $true
    }
    
    # Save changes if modified
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated $($file.FullName)"
    }
}

Write-Host "All files processed." 