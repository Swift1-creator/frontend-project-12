import { Button, Group, Anchor, Box } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../auth.js';

const Header = () => {
  const navigate = useNavigate();
  const isAuthorized = Boolean(getToken());

  const handleLogout = () => {
    removeToken();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      component="header"
      px="md"
      py="sm"
      style={{
        borderBottom: '1px solid #dee2e6',
      }}
    >
      <Group justify="space-between">
        <Anchor component={Link} to="/" fw={700}>
          Hexlet Chat
        </Anchor>

        {isAuthorized && (
          <Button variant="subtle" onClick={handleLogout}>
            Выйти
          </Button>
        )}
      </Group>
    </Box>
  );
};

export default Header;