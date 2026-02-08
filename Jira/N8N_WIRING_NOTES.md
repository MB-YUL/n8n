# n8n wiring (minimal)

1) Add a Structured Output Parser node after the AI Agent.
   - Schema: paste JIRA_OUTPUT_SCHEMA.json
   - This makes the downstream Jira node consume typed fields reliably.

2) In the Jira “Create an issue” node:
   - Set:contentReference[oaicite:7]{index=7}mary}}
   - Set Description = {{$json.issue.description}}
   - (Optional) Labels/components mapping if your Jira node supports them.

Your current Jira node has description empty in config, so without mapping, you’ll keep creating tickets with missing/blank descriptions. 