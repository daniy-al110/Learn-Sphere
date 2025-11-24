# Quick Start Guide - Enhanced Messaging System

## How to Use the New Messaging Features

### For Students (Landing.html)

#### Starting a New Conversation
1. **Log in** as a student
2. **Navigate to "Messaging"** page (from the sidebar)
3. **Look at the left panel** titled "Compose Message"
4. **Select recipient type**:
   - "Message to Student" - to message another student
   - "Message to Teacher" - to message a teacher
5. **Enter recipient information**:
   - Type their email (e.g., `john@example.com`)
   - OR type their ID (e.g., `s001`, `t005`)
   - As you type, the system searches for matches
6. **Type your message** in the textarea
7. **Click "Send Message"** button
8. **Success!** Your message appears in the conversation list

#### Replying to Existing Conversations
1. **See the conversation list** in the middle column
2. **Click on any conversation** to open it
3. **Type your reply** in the bottom textarea
4. **Click "Send"** button (different from "Send Message")
5. **Reply sent!** It appears in the thread

---

### For Teachers (teachers.html)

#### Starting a New Conversation
1. **Log in** as a teacher
2. **Navigate to "Messaging"** page
3. **Use the "Compose Message" panel** on the left
4. **Select recipient type**:
   - "Message to Teacher" - message another teacher
   - "Message to Student" - message a student
5. **Enter email or ID** in the text field
6. **Type your message**
7. **Click "Send Message"**
8. **Done!** Conversation appears in your sidebar

#### Replying to Existing Conversations
Same as students - click conversation, type reply, click "Send"

---

## Recipient Lookup Examples

### Student Lookup
- **By Email**: `sarah@example.com`
- **By Student ID**: `s002`
- System searches both fields automatically

### Teacher Lookup
- **By Email**: `dr.smith@example.com`
- **By Teacher ID**: `t001`
- System searches both fields automatically

### What Happens?
- **1 match found**: ✅ You can send the message
- **Multiple matches**: ⚠️ Be more specific (e.g., add last name)
- **No matches**: ❌ Check the spelling and try again

---

## Visual Layout

### Compose Message Panel (Left)
```
┌─────────────────────┐
│ Compose Message     │
├─────────────────────┤
│ Message Type        │
│ [Student ▼]         │
│                     │
│ Email or ID         │
│ [john@example...]   │
│                     │
│ Message             │
│ [Type here...       │
│  ...more text...]   │
│                     │
│ [Send Message]      │
└─────────────────────┘
```

### Conversations List (Middle)
```
┌──────────────────┐
│ Conversations    │
│ [Refresh]        │
├──────────────────┤
│ John Doe        │
│ Hey, how are... │
│                  │
│ Sarah Smith  [3] │
│ Thanks for the.. │
│                  │
│ Dr. Johnson      │
│ Your assignment..│
└──────────────────┘
```

### Message Thread (Right)
```
┌─────────────────────┐
│ John Doe            │
├─────────────────────┤
│ [Your message]   ✓  │
│ 10:30 AM            │
│                     │
│     [Their reply]   │
│     10:32 AM        │
│                     │
├─────────────────────┤
│ [Type your reply... │
│  ...here...]        │
│                     │
│              [Send] │
└─────────────────────┘
```

---

## Tips & Tricks

### Finding Recipients
- **Start typing** the recipient's name/email
- **Wait for system to search** (minimum 2 characters)
- **See matches in tooltip** (hover over the field)
- **Narrow down** by typing more characters

### Message Features
- ✓ = Message sent (recipient hasn't read yet)
- ✓✓ = Message read (recipient saw it)
- **Unread badge** shows how many new messages

### Troubleshooting
- **"Recipient not found"** → Check spelling, try ID instead of email
- **"Multiple matches found"** → Be more specific with the search
- **Can't send** → Make sure you've typed a message
- **Not seeing new conversation** → Click "Refresh" button

---

## Supported Message Types

| From | To | Supported |
|------|-----|-----------|
| Student | Student | ✅ Yes |
| Student | Teacher | ✅ Yes |
| Student | Admin | ✅ Yes |
| Teacher | Student | ✅ Yes |
| Teacher | Teacher | ✅ Yes |
| Teacher | Admin | ✅ Yes |
| Admin | Student | ✅ Yes |
| Admin | Teacher | ✅ Yes |

---

## Common Scenarios

### Scenario 1: Student wants to ask teacher a question
1. Select "Message to Teacher"
2. Type teacher's email or ID
3. Write question
4. Click "Send Message"
5. Teacher sees message and can reply

### Scenario 2: Teacher responds to student message
1. Click on conversation from student in sidebar
2. See previous message in thread
3. Type response in bottom box
4. Click "Send" (regular send, not compose)
5. Student gets notification via unread badge

### Scenario 3: Two students collaborating
1. Student A selects "Message to Student"
2. Types Student B's email
3. Starts conversation
4. Student B replies in thread
5. They go back and forth in the same thread

---

## Performance Notes
- Recipient lookup happens in real-time as you type
- Conversations load instantly
- Message threads display chronologically
- Unread messages auto-marked as read when opened
- Batch operations reduce server load

---

## Security
- ✅ Only authenticated users can send messages
- ✅ Users can only see their own messages
- ✅ Messages stored with sender/receiver IDs
- ✅ Email/ID search is case-insensitive for convenience

Enjoy the enhanced messaging system! 🎉
