# PowerShell script to fix auth middleware imports in all route files

Write-Host "Fixing auth middleware imports..." -ForegroundColor Cyan

$fixed = 0
$skipped = 0

Get-ChildItem -Path routes -Recurse -Filter "*.js" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw
    
    # Check if file has the old import pattern
    if ($content -match "const authenticate = require\('.*auth\.middleware'\);") {
        Write-Host "`nProcessing: $($_.Name)" -ForegroundColor Yellow
        
        # Replace the import
        $newContent = $content -replace "const authenticate = require\('(.*auth\.middleware)'\);", "const { authenticate } = require('`$1');"
        
        # Write back to file
        Set-Content -Path $filePath -Value $newContent -NoNewline
        
        Write-Host "  ✓ Fixed!" -ForegroundColor Green
        $fixed++
    } else {
        $skipped++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Fixed: $fixed files" -ForegroundColor Green
Write-Host "Skipped: $skipped files (already correct or no auth import)" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan
