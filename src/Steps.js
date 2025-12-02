import React from 'react';
import {
  Box, Button, Typography, FormControl, InputLabel, Select, MenuItem,
  Slider, Table, TableBody, TableCell, TableContainer, TableRow, Paper,
  Alert, Switch, FormControlLabel, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PrintIcon from '@mui/icons-material/Print';
import { ROOF_TYPES } from './data';
import companyLogo from './logo.png';

// STEP 0: ROOF TYPE
export function StepRoofType(props) {
  const { roofType, setRoofType, errors, nextStep } = props;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" align="center" sx={{ mb: 1 }}>Wybierz rodzaj dachu</Typography>
      <FormControl fullWidth error={!!errors.roofType}>
        <InputLabel>Rodzaj dachu</InputLabel>
        <Select value={roofType} label="Rodzaj dachu" onChange={(e) => setRoofType(e.target.value)}>
          {ROOF_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </Select>
        {errors.roofType && <Typography color="error" variant="caption">{errors.roofType}</Typography>}
      </FormControl>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button variant="contained" onClick={nextStep} endIcon={<ArrowForwardIcon />} size="large">Dalej</Button>
      </Box>
    </Box>
  );
}

// STEP 1: NEW INSULATION
export function StepNewInsulation(props) {
  const { newThickness, setNewThickness, errors, nextStep, prevStep } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const marks = isMobile
    ? [{ value: 0 }, { value: 400 }, { value: 800 }]
    : [{ value: 0, label: '0' }, { value: 200, label: '200' }, { value: 400, label: '400' }, { value: 600, label: '600' }, { value: 800, label: '800' }];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" align="center">Grubość nowej izolacji</Typography>
      <Typography variant="h3" align="center" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>{newThickness} mm</Typography>
      <Box sx={{ px: 2 }}>
        <Slider value={newThickness} onChange={(e, v) => setNewThickness(v)} min={0} max={880} step={10} marks={marks} valueLabelDisplay="auto" />
      </Box>
      {errors.newThickness && <Typography color="error" align="center">{errors.newThickness}</Typography>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={prevStep}>Wstecz</Button>
        <Button variant="contained" onClick={nextStep} endIcon={<ArrowForwardIcon />}>Dalej</Button>
      </Box>
    </Box>
  );
}

// STEP 2: OLD LAYERS
export function StepOldLayers(props) {
  const { roofType, hasOldInsulation, setHasOldInsulation, oldThickness, setOldThickness, prevStep, onCalculate } = props;
  const isMetal = roofType === 'metal';

  if (isMetal) {
    return (
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Alert severity="info" sx={{ mb: 3 }}>Dla dachu stalowego nie uwzględniamy starych warstw.</Alert>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={prevStep}>Wstecz</Button>
          <Button variant="contained" onClick={onCalculate} endIcon={<ArrowForwardIcon />}>Oblicz</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" align="center">Stare warstwy (ocieplenie / papa)</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <FormControlLabel control={<Switch checked={hasOldInsulation} onChange={(e) => setHasOldInsulation(e.target.checked)} />} label={hasOldInsulation ? "TAK (Wybierz grubość)" : "NIE"} />
      </Box>
      {hasOldInsulation && (
        <Box sx={{ px: 2 }}>
          <Typography gutterBottom>Grubość: <strong>{oldThickness} mm</strong></Typography>
          <Slider value={oldThickness} onChange={(e, v) => setOldThickness(v)} min={0} max={100} step={10} marks={[{ value: 0, label: '0' }, { value: 100, label: '100mm' }]} valueLabelDisplay="auto" />
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={prevStep}>Wstecz</Button>
        <Button variant="contained" onClick={onCalculate} endIcon={<ArrowForwardIcon />}>Oblicz</Button>
      </Box>
    </Box>
  );
}

// STEP 3: RESULTS
export function StepResults(props) {
  const { recommendations, prevStep, handleStartOver, roofType, newThickness, oldThickness, hasOldInsulation, email, themeMode } = props;
  const isMetal = roofType === 'metal';
  const totalOld = (isMetal || !hasOldInsulation) ? 0 : oldThickness;
  const anchorDepth = isMetal ? 14 : 30;

  return (
    <Box>
      <img src={companyLogo} alt="LDTK" className="print-logo" />
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, bgcolor: 'background.default' }}>
        <Table size="small">
          <TableBody>
            <TableRow><TableCell>Rodzaj dachu</TableCell><TableCell align="right"><strong>{isMetal ? 'Stalowy' : 'Betonowy'}</strong></TableCell></TableRow>
            <TableRow><TableCell>Nowa izolacja</TableCell><TableCell align="right"><strong>{newThickness} mm</strong></TableCell></TableRow>
            <TableRow><TableCell>Stare warstwy</TableCell><TableCell align="right"><strong>{totalOld > 0 ? `${totalOld} mm` : '-'}</strong></TableCell></TableRow>
            <TableRow><TableCell>Kotwienie</TableCell><TableCell align="right"><strong>{anchorDepth} mm</strong></TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {recommendations.length > 0 ? (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>Twoja konfiguracja</Typography>
          <Box sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: themeMode === 'light' ? '#e3f2fd' : 'rgba(25, 118, 210, 0.15)',
            border: `2px solid ${themeMode === 'light' ? '#1976d2' : '#90caf9'}`,
            color: 'text.primary'
          }}>
            {recommendations.map((rec, i) => (
              <Box key={i}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: themeMode === 'light' ? '#1565c0' : '#90caf9', mb: 1 }}>{rec.tubeName}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 500, color: themeMode === 'light' ? '#d32f2f' : '#ef5350' }}>+ {rec.screwName}</Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>Wysłano na: {email}</Alert>
        </Box>
      ) : (
        <Alert severity="error" sx={{ mb: 3 }}>Brak zestawu dla podanych parametrów.</Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }} className="action-buttons-container">
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Drukuj</Button>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={prevStep}>Wstecz</Button>
        <Button variant="text" onClick={handleStartOver}>Nowa konfiguracja</Button>
      </Box>
    </Box>
  );
}