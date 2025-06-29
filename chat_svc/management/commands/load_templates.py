from django.core.management.base import BaseCommand
from chat_svc.models import QuestionTemplate


class Command(BaseCommand):
    help = "Seed the database with global question templates"

    def handle(self, *args, **kwargs):
        templates_data = [
            {
                "name": "Anomaly Behavior Report",
                "text": "On {device_id} between {start_time} and {end_time}, describe the anomalous behavior observed.",
                "schema": {
                    "device_id": {"type": "text"},
                    "start_time": {"type": "text"},
                    "end_time": {"type": "text"},
                    "severity": {"type": "dropdown", "options": ["Low", "Medium", "High", "Critical"]}
                }
            },
            {
                "name": "Log Upload Request",
                "text": "Please upload the {log_type} logs for {device_id} covering {start_time}–{end_time}.",
                "schema": {
                    "log_type": {"type": "dropdown", "options": ["syslog", "firewall", "endpoint"]},
                    "device_id": {"type": "text"},
                    "start_time": {"type": "text"},
                    "end_time": {"type": "text"}
                }
            },
            {
                "name": "CVE Patch Status",
                "text": "For CVE {cve_id}, what is the current patch status? Attach any proof.",
                "schema": {
                    "cve_id": {"type": "text"},
                    "status": {"type": "dropdown", "options": ["Patched", "Pending", "Not Applicable"]}
                }
            },
            {
                "name": "Action Confirmation",
                "text": "Which actions did you perform on {device_id}? Select all that apply and attach confirmations.",
                "schema": {
                    "device_id": {"type": "text"},
                    "actions": {"type": "dropdown", "options": ["Restarted Service", "Applied Patch", "Blocked IP", "Rebooted", "Other"]}
                }
            },
            {
                "name": "SLA Escalation Request",
                "text": "Explain why you need to escalate incident {incident_id} to a {desired_sla} SLA.",
                "schema": {
                    "incident_id": {"type": "text"},
                    "desired_sla": {"type": "dropdown", "options": ["1 hr", "4 hr", "24 hr"]},
                    "justification": {"type": "text"}
                }
            },
            {
                "name": "Resource Usage Report",
                "text": "Provide the CPU, memory, and disk usage for {device_id} at {timestamp}.",
                "schema": {
                    "device_id": {"type": "text"},
                    "timestamp": {"type": "text"},
                    "cpu_usage": {"type": "text"},
                    "memory_usage": {"type": "text"},
                    "disk_usage": {"type": "text"}
                }
            },
            {
                "name": "Service Degradation Report",
                "text": "What service degradation did you observe on {service_name} between {start_time}–{end_time}?",
                "schema": {
                    "service_name": {"type": "text"},
                    "start_time": {"type": "text"},
                    "end_time": {"type": "text"},
                    "impact_level": {"type": "dropdown", "options": ["None", "Low", "Medium", "High"]}
                }
            },
            {
                "name": "IOC Hunting Request",
                "text": "What IOC category ({ioc_type}) and value ({ioc_value}) do you want us to hunt for?",
                "schema": {
                    "ioc_type": {"type": "dropdown", "options": ["IP", "Hash", "Domain", "URL"]},
                    "ioc_value": {"type": "text"}
                }
            },
            {
                "name": "Access Permission Request",
                "text": "Requesting {permission} access on {resource} for {user}. Purpose: {reason}.",
                "schema": {
                    "permission": {"type": "dropdown", "options": ["Read", "Write", "Admin", "Execute"]},
                    "resource": {"type": "text"},
                    "user": {"type": "text"},
                    "reason": {"type": "text"}
                }
            },
            {
                "name": "User Experience Summary",
                "text": "Describe what end-user {username} experienced on {application} at {time}.",
                "schema": {
                    "username": {"type": "text"},
                    "application": {"type": "text"},
                    "time": {"type": "text"},
                    "description": {"type": "text"}
                }
            },
        ]

        created, updated = 0, 0
        for template_data in templates_data:
            obj, created_flag = QuestionTemplate.objects.get_or_create(
                tenant=None,  # Global template
                text=template_data["text"],
                defaults={
                    "name": template_data["name"],
                    "schema": template_data["schema"],
                },
            )
            if not created_flag:
                obj.name = template_data["name"]
                obj.schema = template_data["schema"]
                obj.save()
                updated += 1
            else:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(f"✔ Created: {created}, Updated: {updated} templates")
        )