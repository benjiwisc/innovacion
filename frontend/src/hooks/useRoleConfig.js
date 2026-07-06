// hooks/useRoleConfig.js
import { useAuth } from '@/context/AuthContext';
import { roleConfig } from '@/config/roleConfig';

export function useRoleConfig() {
  const { usuario } = useAuth();
  const rol = usuario?.rol ?? 'familia';
  return roleConfig[rol] ?? roleConfig.familia;
}