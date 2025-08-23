import { Badge } from '@/components/ui/badge';
import { UserRole, userRoleLabels } from '@/types/user-roles';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const getVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'krama_instructor':
        return 'default';
      case 'viewer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant(role)} className={className}>
      {userRoleLabels[role]}
    </Badge>
  );
};