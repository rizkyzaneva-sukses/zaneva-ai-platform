try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email":"admin@zaneva.com","password":"zaneva2024"}' -UseBasicParsing
    Write-Host "Success:" $response.StatusCode
    Write-Host $response.Content
} catch {
    Write-Host "Error:" $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd()
}
