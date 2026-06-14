# PowerShell script to create deployment package for Dodo Payments Handler
# This creates a tar.gz file ready for Appwrite Functions deployment

Write-Host "Creating Dodo Payments Handler deployment package..." -ForegroundColor Cyan

# Set paths
$sourcePath = "dppayment"
$outputFile = "dodo-payments-handler-with-invoices.tar.gz"

# Check if source directory exists
if (-not (Test-Path $sourcePath)) {
    Write-Host "Error: Source directory '$sourcePath' not found!" -ForegroundColor Red
    exit 1
}

# Remove existing tar.gz if it exists
if (Test-Path $outputFile) {
    Write-Host "Removing existing deployment package..." -ForegroundColor Yellow
    Remove-Item $outputFile -Force
}

Write-Host "Creating tar.gz archive..." -ForegroundColor Green

# Create tar.gz using tar command (available in Windows 10+)
Push-Location $sourcePath
tar -czf "..\$outputFile" * 2>$null
Pop-Location

if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
    Write-Host "`nDeployment package created successfully!" -ForegroundColor Green
    Write-Host "File: $outputFile" -ForegroundColor Cyan
    Write-Host "Size: $fileSizeMB MB" -ForegroundColor Cyan
    Write-Host "`nContents:" -ForegroundColor Yellow
    tar -tzf $outputFile | Select-Object -First 20
    
    Write-Host "`n=== Deployment Instructions ===" -ForegroundColor Cyan
    Write-Host "1. Go to Appwrite Console > Functions > dodo-payments-handler" -ForegroundColor White
    Write-Host "2. Click 'Create Deployment'" -ForegroundColor White
    Write-Host "3. Upload file: $outputFile" -ForegroundColor White
    Write-Host "4. Set Entry Point: src/main.js" -ForegroundColor Yellow
    Write-Host "5. Set Runtime: Node.js 18.0 or later" -ForegroundColor Yellow
    Write-Host "6. Click 'Deploy'" -ForegroundColor White
    Write-Host "`nNew Features in this deployment:" -ForegroundColor Green
    Write-Host "  - Payment history endpoint (get-payment-history)" -ForegroundColor White
    Write-Host "  - Invoice download endpoint (get-invoice)" -ForegroundColor White
    Write-Host "  - Improved cancellation with immediate effect" -ForegroundColor White
    Write-Host "  - Enhanced error handling and logging" -ForegroundColor White
} else {
    Write-Host "Error: Failed to create deployment package!" -ForegroundColor Red
    exit 1
}
