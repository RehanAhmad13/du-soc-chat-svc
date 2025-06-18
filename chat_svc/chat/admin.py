from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Tenant, ChatThread, Message, ReadReceipt, QuestionTemplate, StructuredReply, Attachment, Device

class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'tenant', 'is_active', 'is_staff')
    list_display_links = ('username',)  
    list_filter = ('tenant', 'is_active', 'is_staff')
    search_fields = ('username', 'email')
    ordering = ('tenant', 'username')

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Tenant Info", {'fields': ('tenant',)}),
    )

admin.site.register(User, UserAdmin)
admin.site.register(Tenant)
admin.site.register(ChatThread)
admin.site.register(Message)
admin.site.register(ReadReceipt)
admin.site.register(QuestionTemplate)
admin.site.register(StructuredReply)
admin.site.register(Attachment)
admin.site.register(Device)

