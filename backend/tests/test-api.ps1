# Quick API smoke tests for Windows PowerShell

Write-Host "Health:" -ForegroundColor Cyan
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/health | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "List courses:" -ForegroundColor Cyan
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/admin/courses | ConvertTo-Json -Depth 5 | Write-Host

# Create a sample instructor report (teacher_id=1)
Write-Host "Submit instructor report:" -ForegroundColor Cyan
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/instructor/report -ContentType 'application/json' -Body (@{ teacher_id=1; rating=5; comments='Test run' } | ConvertTo-Json) | ConvertTo-Json -Depth 5 | Write-Host

# Send sample message
Write-Host "Send message:" -ForegroundColor Cyan
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/messages -ContentType 'application/json' -Body (@{ sender_id=1; receiver_id=2; content='Automated test message' } | ConvertTo-Json) | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "Fetch messages for user 1:" -ForegroundColor Cyan
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/messages/1 | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "Update course schedule (id=6):" -ForegroundColor Cyan
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/courses/6 -ContentType 'application/json' -Body (@{ schedule='Tue/Thu 14:00-16:00'; duration='6 weeks' } | ConvertTo-Json) | ConvertTo-Json -Depth 5 | Write-Host

Write-Host "Done tests." -ForegroundColor Green
