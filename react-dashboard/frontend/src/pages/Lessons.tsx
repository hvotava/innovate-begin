import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Lessons: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Správa lekcí
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Zde budete moci spravovat lekce a jejich obsah
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            🚧 V přípravě
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tato stránka bude obsahovat:
          </Typography>
          <Box component="ul" sx={{ mt: 2, pl: 2 }}>
            <li>Seznam všech lekcí</li>
            <li>Vytváření nových lekcí</li>
            <li>Editace existujících lekcí</li>
            <li>Správa otázek v lekcích</li>
            <li>Nastavení obtížnosti</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Lessons; 