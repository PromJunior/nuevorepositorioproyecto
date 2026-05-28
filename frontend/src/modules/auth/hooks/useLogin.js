import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useAuthStore } from '../../../store/authStore';
import { authService } from '../services/authService';

export const useLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            const token = data.access_token;
            login({ token });

            const redirectTo = location.state?.from?.pathname || ROUTES.app;
            navigate(redirectTo, { replace: true });
        },
    });
};
