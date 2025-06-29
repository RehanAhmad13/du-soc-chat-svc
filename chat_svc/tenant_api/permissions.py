# Import from the new auth module for consistency
from auth.permissions import (
    IsActiveTenant, 
    IsTenantMemberOrStaff, 
    IsOwnerOrStaff,
    JWTTenantPermission
)

# Legacy aliases for backward compatibility
IsTenantMember = IsTenantMemberOrStaff
IsTenantOwner = IsOwnerOrStaff
IsActiveTenantMember = IsActiveTenant