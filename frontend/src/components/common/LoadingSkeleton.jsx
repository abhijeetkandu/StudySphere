import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent } from '@mui/material';

export default function LoadingSkeleton({ type = 'dashboard', count = 4 }) {
  if (type === 'statcards') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ width: '60%' }}>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1 }} />
              </Box>
              <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '12px' }} />
            </Box>
            <Skeleton variant="text" width="40%" height={16} />
          </Card>
        ))}
      </Box>
    );
  }

  if (type === 'table') {
    return (
      <Card sx={{ p: 2, my: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={180} height={32} />
          <Skeleton variant="rounded" width={120} height={36} />
        </Box>
        <Skeleton variant="rounded" width="100%" height={48} sx={{ mb: 1.5, borderRadius: '8px' }} />
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width="100%" height={42} sx={{ mb: 1, borderRadius: '6px' }} />
        ))}
      </Card>
    );
  }

  if (type === 'cards') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5, my: 2 }}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} sx={{ p: 2.5 }}>
            <Skeleton variant="rounded" width={40} height={40} sx={{ mb: 2, borderRadius: '10px' }} />
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="90%" height={20} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="50%" height={20} />
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={80} height={32} />
              <Skeleton variant="rounded" width={80} height={32} />
            </Box>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width={220} height={36} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={340} height={20} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} sx={{ p: 2 }}>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="40%" height={40} />
          </Card>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2.5 }}>
        <Card sx={{ p: 3, height: 320 }}>
          <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: '12px' }} />
        </Card>
        <Card sx={{ p: 3, height: 320 }}>
          <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: '12px' }} />
        </Card>
      </Box>
    </Box>
  );
}
