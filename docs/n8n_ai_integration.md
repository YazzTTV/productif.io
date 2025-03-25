# Integrating Productif.io with n8n AI Agents

This guide focuses on how to leverage n8n's AI capabilities with Productif.io's webhook API to create powerful productivity automations.

## Prerequisites

1. A running n8n instance with the AI nodes activated
2. Access to your Productif.io account with API capabilities
3. Basic understanding of n8n workflows

## Concepts

### What are n8n AI Agents?

n8n AI Agents are automation components that leverage LLMs (Large Language Models) like GPT-4 to analyze, process, and generate content within your workflows. They can be used to:

- Extract information from unstructured data
- Generate content based on guidelines
- Classify and categorize information
- Make decisions based on complex inputs

### How Productif.io and n8n AI Agents Work Together

By combining Productif.io's webhooks with n8n's AI capabilities, you can create systems that:

1. Automatically organize tasks based on natural language descriptions
2. Generate OKRs and objectives from company documents
3. Get AI-powered insights about your productivity patterns
4. Create intelligent reminders and follow-ups

## Example Scenarios

### Scenario 1: AI Task Parser from Email

This workflow automatically creates tasks in Productif.io by extracting action items from emails.

**Workflow Steps:**

1. **Email Trigger**: Set up an n8n email trigger to monitor a specific inbox
2. **AI Text Extractor**: Use the AI node to identify tasks within the email content:
   
   ```
   Prompt: "Extract all action items and tasks from the following email. For each task, identify the title, any due dates mentioned, and the priority level (if indicated). Format your response as a JSON array with 'title', 'dueDate', and 'priority' fields."
   ```

3. **Function Node**: Transform the AI output into the format expected by Productif.io:
   
   ```javascript
   // Example code for the Function node
   const aiOutput = items[0].json.aiOutput;
   const tasks = JSON.parse(aiOutput);
   
   const outputItems = tasks.map(task => ({
     json: {
       action: "create_task",
       data: {
         title: task.title,
         description: `Auto-generated from email: ${items[0].json.subject}`,
         userId: "YOUR_USER_ID", // Replace with actual user ID
         dueDate: task.dueDate,
         priority: task.priority === "high" ? 3 : (task.priority === "medium" ? 2 : 1)
       }
     }
   }));
   
   return outputItems;
   ```

4. **HTTP Request**: Send each task to the Productif.io webhook:
   - Method: POST
   - URL: `https://your-productif-instance.com/api/webhooks`
   - Content Type: JSON
   - Authentication: Bearer Token

### Scenario 2: AI-Generated OKR Suggestions

This workflow analyzes company documents and suggests quarterly objectives.

**Workflow Steps:**

1. **Schedule Trigger**: Set to run at the beginning of each quarter
2. **HTTP Request**: Fetch company documents or performance data
3. **AI Analyzer**: Use the AI node to generate OKR suggestions:
   
   ```
   Prompt: "Based on the following company performance data and documents, suggest 3-5 key objectives for the upcoming quarter. Each objective should be specific, measurable, and aligned with company growth. For each objective, suggest a target value and 2-3 key results that would indicate success. Format your response as a JSON object with 'objectives' as the key to an array of objects with 'title', 'target', and 'keyResults' fields."
   ```

4. **User Interaction**: Send the suggestions for review (email or Slack)
5. **Webhook Trigger**: Wait for user approval
6. **HTTP Request**: Create the approved objectives in Productif.io:
   - Method: POST
   - URL: `https://your-productif-instance.com/api/webhooks/objectives`
   - Content Type: JSON

### Scenario 3: Smart Habit Recommendations

This workflow analyzes your completed tasks and time entries to suggest helpful habits.

**Workflow Steps:**

1. **HTTP Request**: Fetch user's task completion data and time entries
2. **AI Analyzer**: Process the data to identify patterns:
   
   ```
   Prompt: "Analyze the following productivity data including task completion rates, work patterns, and time entries. Identify 2-3 potential habits that could help improve productivity. For each suggested habit, provide a name, description, recommended frequency, and explanation of how it would help. Format as JSON with 'habits' as the key to an array of habit objects."
   ```

3. **Notification**: Send the habit suggestions to the user
4. **Webhook Trigger**: Wait for user confirmation
5. **HTTP Request**: Create the approved habits in Productif.io:
   - Method: POST
   - URL: `https://your-productif-instance.com/api/webhooks/habits`
   - Content Type: JSON

## Setting Up n8n AI Nodes

### Configuring AI Credentials

1. In your n8n instance, go to **Settings > Credentials**
2. Click **New Credential**
3. Select the AI service you want to use (OpenAI, Anthropic, etc.)
4. Enter your API key and other required information
5. Save the credential

### Best Practices for AI Prompts

1. **Be specific**: Clearly state what information you need and in what format
2. **Provide context**: Include relevant data the AI needs to generate useful responses
3. **Request structured output**: Ask for responses in a specific format (like JSON)
4. **Test iteratively**: Refine your prompts based on the results

## Security Considerations

1. **API key protection**: Store your n8n and AI service API keys securely
2. **Data privacy**: Be mindful of what company data you're sending to AI services
3. **Webhook security**: Use authentication for all Productif.io webhook requests
4. **Review AI outputs**: Implement human review for critical automations

## Troubleshooting

- **Inconsistent AI responses**: Try refining your prompts to be more specific
- **Format issues**: Ensure your JSON transformation is handling the AI output correctly
- **Rate limiting**: Check if you're hitting API rate limits on the AI service
- **Webhook errors**: Verify your authentication and payload format

## Additional Resources

- [n8n AI Nodes Documentation](https://docs.n8n.io)
- [OpenAI API Guidelines](https://platform.openai.com/docs/guides/gpt)
- [Productif.io API Documentation](https://docs.productif.io) 