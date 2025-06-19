# chat_svc/chat/admin_views.py

from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect, render
from django.contrib.auth import get_user_model
from django.contrib.admin.views.decorators import staff_member_required

User = get_user_model()

@staff_member_required
def pending_users_view(request):
    if request.method == "POST":
        user_id = request.POST.get("user_id")
        try:
            user = User.objects.get(id=user_id, is_active=False)
            user.is_active = True
            user.save()
        except User.DoesNotExist:
            pass
        return redirect("admin:pending_users")

    pending_users = User.objects.filter(is_active=False)
    return render(request, "admin/pending_users.html", {
        "pending_users": pending_users,
    })
