import React from "react";

interface IconProps {
  className?: string;
  color?: string;
}

export const Dashboard: React.FC<IconProps> = ({ className, color = "currentColor" }) => {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill={color}>
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );
};