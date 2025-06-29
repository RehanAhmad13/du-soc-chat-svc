# Import from the new auth module
from auth.permissions import IsStaffOrAdmin, IsSuperUser

# Legacy aliases for backward compatibility
IsAdminTenant = IsStaffOrAdmin