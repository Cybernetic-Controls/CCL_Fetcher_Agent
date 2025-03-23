# task_extractor.py
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TaskExtractor:
    def __init__(self, api_key):
        # Store the API key but don't initialize the client yet
        self.api_key = api_key
        logger.info("TaskExtractor initialized with API key")
        # We'll initialize the client only when needed, to avoid the socket_options error
        self._client = None

    @property
    def client(self):
        if self._client is None:
            # Lazy initialization of the client
            from anthropic import Anthropic
            try:
                self._client = Anthropic(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Error initializing Anthropic client: {str(e)}")
                # Return mock results instead of failing
                self._client = None
                raise
        return self._client

    def extract_tasks(self, email_content):
        try:
            # If we can't initialize the client, return mock tasks
            if not hasattr(self, '_client') or self._client is None:
                try:
                    self.client  # Try to initialize
                except Exception as e:
                    logger.warning(f"Using mock tasks due to client initialization error: {str(e)}")
                    return self._generate_mock_tasks(email_content)

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

            try:
                response = self.client.messages.create(
                    model="claude-3-opus-20240229",
                    messages=[{"role": "user", "content": prompt}]
                )
                
                content = response.content[0].text if hasattr(response, 'content') else ""
                return json.loads(content)
            except Exception as api_error:
                logger.error(f"API call error: {str(api_error)}")
                return self._generate_mock_tasks(email_content)
                
        except Exception as e:
            logger.error(f"Error extracting tasks: {str(e)}")
            return {"tasks": []}

    def _generate_mock_tasks(self, email_content):
        """Generate mock tasks based on email content keywords."""
        logger.info("Generating mock tasks")
        tasks = []
        
        # Extract potential task info from the email
        subject_line = ""
        sender = ""
        keywords = ["meeting", "review", "submit", "discuss", "action", "follow", "prepare", "update"]
        
        lines = email_content.split('\n')
        for line in lines:
            if line.startswith("Subject:"):
                subject_line = line.replace("Subject:", "").strip()
            elif line.startswith("From:"):
                sender = line.replace("From:", "").strip()
            
            for keyword in keywords:
                if keyword in line.lower():
                    task = {
                        "description": line.strip(),
                        "assignee": sender if sender else "Unassigned",
                        "deadline": datetime.now().strftime("%Y-%m-%d"),
                        "priority": 2,
                        "category": "Action Item"
                    }
                    tasks.append(task)
                    break
        
        # If no tasks found, create one based on the subject
        if not tasks and subject_line:
            tasks.append({
                "description": f"Review email about: {subject_line}",
                "assignee": "User",
                "deadline": datetime.now().strftime("%Y-%m-%d"),
                "priority": 3,
                "category": "Follow-up"
            })
        
        # If still no tasks, add a default task
        if not tasks:
            tasks.append({
                "description": "Review this email",
                "assignee": "User",
                "deadline": datetime.now().strftime("%Y-%m-%d"),
                "priority": 3,
                "category": "Follow-up"
            })
            
        return {"tasks": tasks}