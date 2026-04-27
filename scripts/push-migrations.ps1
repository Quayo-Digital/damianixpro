# Push Supabase migrations - handles 20250216 version mismatch
# Run: .\scripts\push-migrations.ps1

$ErrorActionPreference = "Stop"
$maxAttempts = 20
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "`n=== Migration push attempt $attempt ===`n" -ForegroundColor Cyan
    
    # Repair 20250216 if it causes "Remote migration versions not found" 
    Write-Host "Repairing 20250216 (version mismatch)..." -ForegroundColor Yellow
    supabase migration repair --status reverted 20250216 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "Repair skipped or failed" }
    
    Write-Host "Pushing migrations with --include-all..." -ForegroundColor Yellow
    $output = echo y | supabase db push --include-all 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nAll migrations applied successfully!" -ForegroundColor Green
        exit 0
    }
    
    if ($output -match "Remote migration versions not found") {
        Write-Host "Version mismatch - retrying..." -ForegroundColor Yellow
        continue
    }
    
    if ($output -match "ERROR:.*\(SQLSTATE") {
        $errLine = ($output | Select-String "ERROR:.*SQLSTATE" | Select-Object -First 1).Line
        Write-Host "`nMigration failed: $errLine" -ForegroundColor Red
        Write-Host "`nFull output:" -ForegroundColor Gray
        Write-Host $output
        exit 1
    }
    
    Write-Host $output
    exit 1
}

Write-Host "Max attempts reached. Run 'supabase db push --include-all' manually." -ForegroundColor Red
exit 1
