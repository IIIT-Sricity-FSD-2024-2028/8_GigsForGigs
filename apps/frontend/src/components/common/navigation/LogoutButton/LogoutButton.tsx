import React from 'react';
import { Button, type ButtonProps } from '../../Button/Button';

export interface LogoutButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> { onLogout: () => void; label?: string; }
export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout, label = 'Log out', variant = 'ghost', ...props }) =>
  <Button variant={variant} onClick={onLogout} {...props}>{label}</Button>;
export default LogoutButton;
