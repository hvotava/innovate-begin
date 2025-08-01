import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Tests: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Správa testů
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Přehled všech testových session a pokusů
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
            <li>Seznam všech testových session</li>
            <li>Detail jednotlivých pokusů</li>
            <li>Výsledky a skóre</li>
            <li>Filtrování podle uživatelů a lekcí</li>
            <li>Export dat</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Tests; 