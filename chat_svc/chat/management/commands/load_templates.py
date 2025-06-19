from django.core.management.base import BaseCommand
from chat_svc.chat.models import QuestionTemplate


class Command(BaseCommand):
    help = "Seed the database with 15 global question templates (tenant=None)"

    def handle(self, *args, **kwargs):
        defaults_list = [
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
                "name": "Data Residency Confirmation",
                "text": "Confirm that all data for {tenant_id} is in region {region} and retained for at least {retention_days} days.",
                "schema": {
                    "tenant_id": {"type": "text"},
                    "region": {"type": "dropdown", "options": ["KSA", "UAE", "EU", "US"]},
                    "retention_days": {"type": "text"}
                }
            },
            {
                "name": "Root Cause & Preventive Steps",
                "text": "What was the primary root cause of incident {incident_id}, and what preventive steps will you take?",
                "schema": {
                    "incident_id": {"type": "text"},
                    "root_cause": {"type": "dropdown", "options": ["Configuration", "Human Error", "Zero-Day", "Other"]},
                    "preventive": {"type": "text"}
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
                "name": "Log Type Selection",
                "text": "Which log type would you like for {device_id}? Specify time range.",
                "schema": {
                    "device_id": {"type": "text"},
                    "log_type": {"type": "dropdown", "options": ["syslog", "auth", "kernel", "application"]},
                    "start_time": {"type": "text"},
                    "end_time": {"type": "text"}
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
                "name": "Memory Dump Attachment",
                "text": "Attach the memory dump and process list for {device_id} at {timestamp}.",
                "schema": {
                    "device_id": {"type": "text"},
                    "timestamp": {"type": "text"}
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
                "name": "Patch Deployment Status",
                "text": "Has patch {patch_id} been applied to {device_id}? Provide date of deployment.",
                "schema": {
                    "patch_id": {"type": "text"},
                    "device_id": {"type": "text"},
                    "deployed_on": {"type": "text"},
                    "status": {"type": "dropdown", "options": ["Success", "Failed", "In Progress"]}
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
        for tpl in defaults_list:
            obj, created_flag = QuestionTemplate.objects.get_or_create(
                tenant=None,
                text=tpl["text"],
                defaults={
                    "name": tpl["name"],
                    "schema": tpl["schema"],
                },
            )
            if not created_flag:
                obj.name = tpl["name"]
                obj.schema = tpl["schema"]
                obj.save()
                updated += 1
            else:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"✔ Created: {created}, Updated: {updated} templates"))
