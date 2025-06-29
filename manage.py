#!/usr/bin/env python3
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chat_svc.settings.development')
    
    # Add the chat_svc directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    chat_svc_dir = os.path.join(current_dir, 'chat_svc')
    if chat_svc_dir not in sys.path:
        sys.path.insert(0, chat_svc_dir)
    
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
