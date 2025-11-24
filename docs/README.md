
```powershell
# Health
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/health

# List admin courses
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/admin/courses

# Submit an instructor report
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/instructor/report -ContentType 'application/json' -Body (@{ teacher_id=1; rating=5; comments='Great course' } | ConvertTo-Json)

# Send a message
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/messages -ContentType 'application/json' -Body (@{ sender_id=1; receiver_id=2; content='Hello' } | ConvertTo-Json)

# Fetch messages
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/messages/1

# Update course schedule/duration
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/courses/6 -ContentType 'application/json' -Body (@{ schedule='Mon/Wed 10:00-12:00'; duration='8 weeks' } | ConvertTo-Json)
```

