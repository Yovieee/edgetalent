import React from "react";
import { Navigate } from "react-router-dom";
import { useSupabase } from "../context/SupabaseContext";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactElement;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps): React.ReactElement {
  const { profile } = useSupabase();

  if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
