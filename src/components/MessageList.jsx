import { useEffect, useRef } from 'react';
import { Box, Text } from '@mantine/core';

import { cleanText } from '../profanity.js';

export const MessageList = ({ messages, currentUser }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  return (
    <Box
      mt="md"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      }}
    >
      {messages.map((message) => (
        <Box
          key={message.id}
          style={{
            overflowWrap: 'anywhere',
            marginBottom: 12,
          }}
        >
          <Text fw={700}>
            {message.username || currentUser}
          </Text>

          <Text>{cleanText(message.body)}</Text>
        </Box>
      ))}

      <div ref={bottomRef} />
    </Box>
  );
};