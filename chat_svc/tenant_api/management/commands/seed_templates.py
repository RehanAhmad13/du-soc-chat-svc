"""
Django management command to seed SOC template library.
Run with: python manage.py seed_templates
"""

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from chat_svc.models import QuestionTemplate, Tenant


class Command(BaseCommand):
    help = 'Seeds the database with comprehensive SOC incident response templates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update',
            action='store_true',
            help='Update existing templates if they already exist',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Starting SOC template seeding process...')
        )

        templates_data = self.get_template_definitions()
        
        created_count = 0
        updated_count = 0
        skipped_count = 0

        for template_data in templates_data:
            template_name = template_data['name']
            
            try:
                template, created = QuestionTemplate.objects.get_or_create(
                    name=template_name,
                    defaults={
                        'description': template_data['description'],
                        'schema': template_data['schema'],
                        'category': template_data.get('category', 'Security Operations'),
                        'version': template_data.get('version', '1.0'),
                        'created_at': timezone.now(),
                        'updated_at': timezone.now(),
                        'is_active': True,
                        'tenant': None,  # Global templates
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Created: {template_name}')
                    )
                elif options['update']:
                    # Update existing template
                    template.description = template_data['description']
                    template.schema = template_data['schema']
                    template.category = template_data.get('category', 'Security Operations')
                    template.version = template_data.get('version', '1.0')
                    template.updated_at = timezone.now()
                    template.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'🔄 Updated: {template_name}')
                    )
                else:
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'⏭️  Skipped: {template_name} (already exists)')
                    )
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error creating {template_name}: {str(e)}')
                )

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('📊 TEMPLATE SEEDING SUMMARY'))
        self.stdout.write('='*60)
        self.stdout.write(f'✅ Templates Created: {created_count}')
        self.stdout.write(f'🔄 Templates Updated: {updated_count}')
        self.stdout.write(f'⏭️  Templates Skipped: {skipped_count}')
        self.stdout.write(f'📋 Total Templates: {len(templates_data)}')
        self.stdout.write('='*60)
        
        if created_count > 0 or updated_count > 0:
            self.stdout.write(
                self.style.SUCCESS('🎉 SOC Template Library is ready for action!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('💡 All templates already exist. Use --update to refresh them.')
            )

    def get_template_definitions(self):
        """Define all 17 SOC templates with comprehensive schemas"""
        return [
            {
                "name": "Incident Triage",
                "category": "Incident Response",
                "version": "1.0",
                "description": "Kick off a new chat with structured details about the alert. SOC admins use this to ensure tenants immediately confirm the incident scope before remediation begins.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "incident_id": {
                            "type": "string",
                            "title": "Incident ID",
                            "description": "Unique identifier for the security incident"
                        },
                        "severity": {
                            "type": "string",
                            "title": "Severity Level",
                            "enum": ["Low", "Medium", "High", "Critical"],
                            "description": "Impact level of the security incident"
                        },
                        "detected_at": {
                            "type": "string",
                            "format": "date-time",
                            "title": "Detection Time",
                            "description": "When the incident was first detected"
                        }
                    },
                    "required": ["incident_id", "severity", "detected_at"]
                }
            },
            {
                "name": "Vulnerability Clarification",
                "category": "Vulnerability Management",
                "version": "1.0",
                "description": "Request tenant to verify affected assets and CVSS before issuing patch guidance or IOC updates.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "vuln_id": {
                            "type": "string",
                            "title": "Vulnerability ID",
                            "description": "CVE or vendor-specific vulnerability identifier"
                        },
                        "asset_ip": {
                            "type": "string",
                            "format": "ipv4",
                            "title": "Asset IP Address",
                            "description": "IP address of the affected asset"
                        },
                        "cvss_score": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 10,
                            "title": "CVSS Score",
                            "description": "Common Vulnerability Scoring System score"
                        }
                    },
                    "required": ["vuln_id", "asset_ip"]
                }
            },
            {
                "name": "Evidence Request",
                "category": "Digital Forensics",
                "version": "1.0",
                "description": "Standardize ask for logs or other forensic artefacts, with built-in file‐upload placeholders.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "device_id": {
                            "type": "string",
                            "title": "Device Identifier",
                            "description": "Hostname, IP, or asset tag of the target device"
                        },
                        "time_range": {
                            "type": "string",
                            "title": "Time Range",
                            "description": "Time window for evidence collection (e.g., '2024-01-01 to 2024-01-02')"
                        },
                        "evidence_type": {
                            "type": "string",
                            "title": "Evidence Type",
                            "enum": ["Logs", "Packet Capture", "Screenshot", "Config"],
                            "description": "Type of evidence being requested"
                        },
                        "attachments": {
                            "type": "array",
                            "title": "Attachments",
                            "items": {
                                "type": "string",
                                "format": "binary"
                            },
                            "description": "Files attached as evidence"
                        }
                    },
                    "required": ["device_id", "time_range", "evidence_type"]
                }
            },
            {
                "name": "Root Cause Analysis",
                "category": "Post-Incident",
                "version": "1.0",
                "description": "Post‐mortem template to capture what went wrong, when, and why—feeding into audit and continuous improvement.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "summary": {
                            "type": "string",
                            "title": "Incident Summary",
                            "description": "Brief overview of what happened"
                        },
                        "trigger_event": {
                            "type": "string",
                            "title": "Trigger Event",
                            "description": "The initial event that caused the incident"
                        },
                        "timeline": {
                            "type": "string",
                            "title": "Timeline",
                            "description": "Chronological sequence of events"
                        }
                    },
                    "required": ["summary", "trigger_event"]
                }
            },
            {
                "name": "Remediation Confirmation",
                "category": "Incident Response",
                "version": "1.0",
                "description": "Tenant reports back that the recommended fix was applied—SOC admin can then close the loop in ITSM.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "action_taken": {
                            "type": "string",
                            "title": "Action Taken",
                            "description": "Description of the remediation action performed"
                        },
                        "completed_at": {
                            "type": "string",
                            "format": "date-time",
                            "title": "Completion Time",
                            "description": "When the remediation was completed"
                        },
                        "verifier": {
                            "type": "string",
                            "title": "Verifier",
                            "description": "Person who verified the remediation"
                        }
                    },
                    "required": ["action_taken", "completed_at"]
                }
            },
            {
                "name": "Patch Deployment Details",
                "category": "Change Management",
                "version": "1.0",
                "description": "Capture planned patch rollout info and rollback steps for change control and audit trails.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "patch_id": {
                            "type": "string",
                            "title": "Patch ID",
                            "description": "Vendor patch identifier or KB number"
                        },
                        "version": {
                            "type": "string",
                            "title": "Version",
                            "description": "Software version after patch application"
                        },
                        "scheduled_window": {
                            "type": "string",
                            "title": "Maintenance Window",
                            "description": "Planned time for patch deployment"
                        },
                        "rollback_plan": {
                            "type": "string",
                            "title": "Rollback Plan",
                            "description": "Steps to revert if patch deployment fails"
                        }
                    },
                    "required": ["patch_id", "version", "scheduled_window"]
                }
            },
            {
                "name": "Access Privilege Verification",
                "category": "Identity & Access Management",
                "version": "1.0",
                "description": "Structured form to approve/deny temporary access changes, feeding into your IAM workflows.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "title": "User ID",
                            "description": "Username or employee ID requesting access"
                        },
                        "requested_role": {
                            "type": "string",
                            "title": "Requested Role",
                            "description": "Role or permission level being requested"
                        },
                        "justification": {
                            "type": "string",
                            "title": "Business Justification",
                            "description": "Reason for the access request"
                        }
                    },
                    "required": ["user_id", "requested_role", "justification"]
                }
            },
            {
                "name": "Log Upload Request",
                "category": "Digital Forensics",
                "version": "1.0",
                "description": "Tenant can drop in different log types securely; SOC ensures context‐aware attachments.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "log_type": {
                            "type": "string",
                            "title": "Log Type",
                            "enum": ["Syslog", "Application", "Firewall", "IDS"],
                            "description": "Category of logs being uploaded"
                        },
                        "time_window": {
                            "type": "string",
                            "title": "Time Window",
                            "description": "Time range covered by the logs"
                        },
                        "file": {
                            "type": "string",
                            "format": "binary",
                            "title": "Log File",
                            "description": "Log file to upload"
                        }
                    },
                    "required": ["log_type", "time_window"]
                }
            },
            {
                "name": "IOC Submission",
                "category": "Threat Intelligence",
                "version": "1.0",
                "description": "Standard form for tenants or SOC to share Indicators of Compromise with severity tagging.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "indicator": {
                            "type": "string",
                            "title": "Indicator",
                            "description": "The IOC value (IP, hash, domain, etc.)"
                        },
                        "indicator_type": {
                            "type": "string",
                            "title": "Indicator Type",
                            "enum": ["IP", "Hash", "Domain", "URL"],
                            "description": "Category of the indicator"
                        },
                        "confidence": {
                            "type": "string",
                            "title": "Confidence Level",
                            "enum": ["Low", "Medium", "High"],
                            "description": "Confidence in the indicator's accuracy"
                        }
                    },
                    "required": ["indicator", "indicator_type"]
                }
            },
            {
                "name": "SLA Exception Approval",
                "category": "Service Management",
                "version": "1.0",
                "description": "For service‐delivery managers to grant more time on high‐priority incidents without free‐text back‐and‐forth.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "incident_id": {
                            "type": "string",
                            "title": "Incident ID",
                            "description": "Reference to the original incident"
                        },
                        "requested_extension_hours": {
                            "type": "integer",
                            "minimum": 1,
                            "title": "Extension Hours",
                            "description": "Number of additional hours requested"
                        },
                        "reason": {
                            "type": "string",
                            "title": "Reason",
                            "description": "Justification for the SLA extension"
                        }
                    },
                    "required": ["incident_id", "requested_extension_hours", "reason"]
                }
            },
            {
                "name": "Change Control Request",
                "category": "Change Management",
                "version": "1.0",
                "description": "Formalize requests for infra or config changes tied back into ITSM or SOAR workflows.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "change_id": {
                            "type": "string",
                            "title": "Change ID",
                            "description": "Unique identifier for the change request"
                        },
                        "description": {
                            "type": "string",
                            "title": "Change Description",
                            "description": "Detailed description of the proposed change"
                        },
                        "risk_level": {
                            "type": "string",
                            "title": "Risk Level",
                            "enum": ["Low", "Medium", "High"],
                            "description": "Risk assessment of the change"
                        },
                        "scheduled_date": {
                            "type": "string",
                            "format": "date",
                            "title": "Scheduled Date",
                            "description": "Planned implementation date"
                        }
                    },
                    "required": ["change_id", "description", "scheduled_date"]
                }
            },
            {
                "name": "Threat Intelligence Feedback",
                "category": "Threat Intelligence",
                "version": "1.0",
                "description": "Capture tenant's feedback on TI feeds—helps tune false‐positive thresholds.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "threat_report_id": {
                            "type": "string",
                            "title": "Threat Report ID",
                            "description": "Reference to the threat intelligence report"
                        },
                        "accuracy_rating": {
                            "type": "integer",
                            "minimum": 1,
                            "maximum": 5,
                            "title": "Accuracy Rating",
                            "description": "Rate the accuracy of the threat intelligence (1-5)"
                        },
                        "comments": {
                            "type": "string",
                            "title": "Comments",
                            "description": "Additional feedback on the threat intelligence"
                        }
                    },
                    "required": ["threat_report_id", "accuracy_rating"]
                }
            },
            {
                "name": "Post-Incident Review Summary",
                "category": "Post-Incident",
                "version": "1.0",
                "description": "Formal summary for compliance teams and SOC leadership after an incident closure.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "incident_id": {
                            "type": "string",
                            "title": "Incident ID",
                            "description": "Reference to the completed incident"
                        },
                        "root_cause": {
                            "type": "string",
                            "title": "Root Cause",
                            "description": "Underlying cause of the incident"
                        },
                        "lessons_learned": {
                            "type": "string",
                            "title": "Lessons Learned",
                            "description": "Key takeaways and improvements identified"
                        },
                        "next_steps": {
                            "type": "string",
                            "title": "Next Steps",
                            "description": "Follow-up actions and preventive measures"
                        }
                    },
                    "required": ["incident_id", "root_cause", "lessons_learned"]
                }
            },
            {
                "name": "Forensic Data Request",
                "category": "Digital Forensics",
                "version": "1.0",
                "description": "Request specific files/data from tenants' environments for deeper forensic analysis.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "case_id": {
                            "type": "string",
                            "title": "Case ID",
                            "description": "Forensic investigation case identifier"
                        },
                        "artifacts_needed": {
                            "type": "array",
                            "title": "Artifacts Needed",
                            "items": {
                                "type": "string"
                            },
                            "description": "List of specific artifacts required"
                        },
                        "retention_period_days": {
                            "type": "integer",
                            "title": "Retention Period (Days)",
                            "description": "How long the data should be preserved"
                        }
                    },
                    "required": ["case_id", "artifacts_needed"]
                }
            },
            {
                "name": "System Health Check",
                "category": "Operations",
                "version": "1.0",
                "description": "Quick snapshot of component health (e.g., DB, Collector, Channel Layer) for DevOps visibility.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "system_component": {
                            "type": "string",
                            "title": "System Component",
                            "description": "Name of the system component being checked"
                        },
                        "status": {
                            "type": "string",
                            "title": "Status",
                            "enum": ["OK", "Warning", "Critical"],
                            "description": "Current health status of the component"
                        },
                        "last_checked": {
                            "type": "string",
                            "format": "date-time",
                            "title": "Last Checked",
                            "description": "When the health check was performed"
                        }
                    },
                    "required": ["system_component", "status"]
                }
            },
            {
                "name": "Escalation Notice",
                "category": "Incident Response",
                "version": "1.0",
                "description": "Formal escalation logging to higher-level teams or management, ensuring auditability.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "incident_id": {
                            "type": "string",
                            "title": "Incident ID",
                            "description": "Reference to the incident being escalated"
                        },
                        "escalated_to": {
                            "type": "string",
                            "title": "Escalated To",
                            "description": "Team or individual receiving the escalation"
                        },
                        "reason": {
                            "type": "string",
                            "title": "Escalation Reason",
                            "description": "Why the incident is being escalated"
                        },
                        "escalation_time": {
                            "type": "string",
                            "format": "date-time",
                            "title": "Escalation Time",
                            "description": "When the escalation occurred"
                        }
                    },
                    "required": ["incident_id", "escalated_to", "reason"]
                }
            },
            {
                "name": "Compliance Audit Questionnaire",
                "category": "Compliance",
                "version": "1.0",
                "description": "Structured Q&A for compliance teams, with attachments for proof (policies, logs, screenshots).",
                "schema": {
                    "type": "object",
                    "properties": {
                        "audit_id": {
                            "type": "string",
                            "title": "Audit ID",
                            "description": "Unique identifier for the compliance audit"
                        },
                        "questionnaire": {
                            "type": "array",
                            "title": "Questionnaire",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {
                                        "type": "string",
                                        "title": "Question",
                                        "description": "Compliance question"
                                    },
                                    "answer": {
                                        "type": "string",
                                        "title": "Answer",
                                        "description": "Response to the question"
                                    },
                                    "evidence": {
                                        "type": "string",
                                        "format": "binary",
                                        "title": "Evidence",
                                        "description": "Supporting documentation"
                                    }
                                },
                                "required": ["question", "answer"]
                            },
                            "description": "List of questions and answers"
                        }
                    },
                    "required": ["audit_id", "questionnaire"]
                }
            }
        ]