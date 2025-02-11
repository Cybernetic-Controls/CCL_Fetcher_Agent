from anthropic import Anthropic
import json
from datetime import datetime

class TaskExtractor:
    def __init__(self, api_key):
        self.client = Anthropic(api_key=api_key)

    def extract_tasks(self, email_content):
        try:
            prompt = f"""
            Analyze this email and extract tasks:
            
            {email_content}

            Extract tasks in this JSON format:
            {{
                "tasks": [
                    {{
                        "description": "task description",
                        "assignee": "person responsible",
                        "deadline": "YYYY-MM-DD",
                        "priority": 1-3,
                        "category": "Meeting/Follow-up/Action Item"
                    }}
                ]
            }}
            """

            response = self.client.messages.create(
                model="claude-3-opus-20240229",
                messages=[{"role": "user", "content": prompt}]
            )
            
            return json.loads(response.content[0].text)
        except Exception as e:
            print(f"Error extracting tasks: {str(e)}")
            return {"tasks": []}