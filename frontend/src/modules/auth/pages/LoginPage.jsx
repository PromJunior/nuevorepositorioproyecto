import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { useLogin } from '../hooks/useLogin';

export const LoginPage = () => {
    const loginMutation = useLogin();

    return (
        <LoginForm
            onSubmit={loginMutation.mutate}
            isLoading={loginMutation.isPending}
            error={loginMutation.error}
        />
    );
};

export default LoginPage;
