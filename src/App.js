import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import {
  ThemeProvider, createTheme, CssBaseline, Box, Container, Typography,
  Stepper as MuiStepper, Step, StepLabel, TextField, Button, Switch,
  FormControlLabel, Checkbox
} from '@mui/material';

import { METAL_TABLE, CONCRETE_TABLE, WDB_63, WDS_48 } from './data';
import { StepRoofType, StepNewInsulation, StepOldLayers, StepResults } from './Steps';
import './StepperCustom.css';

// Icons
import RoofingIcon from '@mui/icons-material/Roofing';
import HeightIcon from '@mui/icons-material/Height';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light' ? {
      primary: { main: '#dd0000' },
      background: { default: '#f5f5f5', paper: '#ffffff' },
      text: { primary: '#333333', secondary: '#555555' },
    } : {
      primary: { main: '#ff6b6b' },
      background: { default: '#121212', paper: '#1e1e1e' },
      text: { primary: '#ffffff', secondary: '#bbbbbb' },
    }),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'none',
          backgroundColor: mode === 'light' ? '#f5f5f5' : '#121212',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#f0f0f0' : '#2a2a2a',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: mode === 'light' ? '#333333' : '#ffffff',
        },
      },
    },
  },
});

function DisclaimerStep({ onAccept }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 4, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
        Ważna informacja
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>
        Niniejszy konfigurator określa długość połączenia dla dachu na którym zastosowana ma być określona grubość docieplenia, w celu doboru łączników na dachu ze spadkami, niezbędne jest wykonanie projektu zakotwienia, w tym celu prosimy o kontakt z pod nr telefonu 77 472 62 65 wew. 204 lub pod adresem mailowym  projekty@starfix.eu
        <br /><br />W celu określenia dokładnej grubości istniejących warstw nienośnych na dachu podlegającemu renowacji docieplenia, niezbędne jest wykonanie odkrywki istniejącej warstwy nienośnej celem określenia jej grubości .
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />}
        label={<Typography sx={{ fontWeight: 500 }}>Akceptuję warunki korzystania</Typography>}
      />
      <Box sx={{ mt: 3 }}>
        <Button variant="contained" size="large" disabled={!accepted} onClick={onAccept} fullWidth>
          Przejdź dalej
        </Button>
      </Box>
    </Box>
  );
}

function EmailStep({ setEmail, nextStep }) {
  const [localEmail, setLocalEmail] = useState('');
  const [error, setError] = useState('');
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = () => {
    if (validateEmail(localEmail)) { setEmail(localEmail); nextStep(); }
    else { setError('Podaj poprawny adres email'); }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>Wprowadź email</Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Prześlemy wyniki konfiguracji na Twój adres.
      </Typography>
      <TextField
        label="Adres Email"
        type="email"
        value={localEmail}
        onChange={(e) => setLocalEmail(e.target.value)}
        error={!!error}
        helperText={error}
        fullWidth
        sx={{ mb: 3 }}
      />
      <Button variant="contained" size="large" onClick={handleSubmit} fullWidth>
        Kontynuuj
      </Button>
    </Box>
  );
}

function App() {
  const [themeMode, setThemeMode] = useState('light');
  const theme = getTheme(themeMode);

  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    roofType: 'concrete',
    newThickness: 0,
    hasOldInsulation: false,
    oldThickness: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 0 && !formData.roofType) newErrors.roofType = 'Wybierz rodzaj dachu';
    if (currentStep === 1 && formData.newThickness <= 40) newErrors.newThickness = 'Grubość izolacji musi być większa niż 40mm';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateRoofSystem = () => {
    const { roofType, newThickness, hasOldInsulation, oldThickness } = formData;
    const isMetal = roofType === 'metal';
    const totalOld = (isMetal || !hasOldInsulation) ? 0 : parseInt(oldThickness);
    const lookupTable = isMetal ? METAL_TABLE : CONCRETE_TABLE;
    const screwArray = isMetal ? WDS_48 : WDB_63;

    const tableRow = lookupTable.find(row => row.insulation >= newThickness);

    if (!tableRow) {
      setRecommendations([]);
      setStep(prev => prev + 1);
      return;
    }

    const baseScrewLength = tableRow.screw;
    const calculatedScrewLength = baseScrewLength + totalOld;
    const matchedScrew = screwArray.find(s => s.length >= calculatedScrewLength);
    const screwName = matchedScrew ? matchedScrew.code : 'Brak wkrętu (wymagany dłuższy niż w ofercie)';

    const result = {
      tubeName: `LDTK ${tableRow.length}`,
      screwName: screwName,
      anchorDepth: isMetal ? 14 : 30
    };

    const newRecommendations = [result];
    setRecommendations(newRecommendations);
    sendEmail(newRecommendations);

    // === START: SEND TO WORDPRESS ===
    try {
      const payload = {
        source: 'ldtk', // IDENTIFIER FOR THIS APP
        substrate: roofType === 'concrete' ? 'Betonowy' : 'Stalowy',
        insulation_type: 'Dach', // Generic label for this app
        hD: parseInt(newThickness),
        // We map "Old Layers" to "adhesive_thickness" column to reuse DB structure
        adhesive_thickness: parseInt(totalOld),
        recessed_depth: 0,
        recommendations: newRecommendations.map(r => ({ name: r.tubeName, screw: r.screwName })),
        email: email
      };

      window.parent.postMessage({ type: 'SF_STATS', payload: payload }, '*');
      console.log('LDTK Stats sent:', payload);
    } catch (e) {
      console.error('Failed to send stats:', e);
    }
    // === END: SEND TO WORDPRESS ===

    setStep(prev => prev + 1);
  };

  const sendEmail = (results) => {
    if (!results || results.length === 0) return;
    const res = results[0];
    const totalOld = (formData.roofType === 'metal' || !formData.hasOldInsulation) ? 0 : formData.oldThickness;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h3 style="color: #1976d2;">Wynik Konfiguracji LDTK 2025</h3>
        <ul style="line-height: 1.6;">
          <li><strong>Rodzaj dachu:</strong> ${formData.roofType === 'concrete' ? 'Betonowy' : 'Stalowy'}</li>
          <li><strong>Nowa izolacja:</strong> ${formData.newThickness} mm</li>
          <li><strong>Stare warstwy:</strong> ${totalOld} mm</li>
        </ul>
        <div style="background-color: #e3f2fd; padding: 20px; border-left: 5px solid #1976d2; margin-top: 20px;">
          <h2 style="margin: 0; color: #1565c0;">${res.tubeName}</h2>
          <h3 style="margin: 10px 0 0 0; color: #d32f2f;">+ ${res.screwName}</h3>
        </div>
      </div>
    `;

    const templateParams = {
      to_email: email,
      recommendations_html: htmlContent,
      substrate: formData.roofType,
      insulationThickness: formData.newThickness,
    };

    emailjs.send('service_wl8dg9a', 'template_jgv00kz', templateParams, 'ndfOyBTYvqBjOwsI_')
      .catch(err => console.error('Email failed', err));
  };

  const nextStep = () => { if (validateStep(step)) setStep(prev => prev + 1); };
  const prevStep = () => { setStep(prev => prev - 1); };
  const handleStartOver = () => {
    setFormData({ roofType: 'concrete', newThickness: 0, hasOldInsulation: false, oldThickness: 0 });
    setRecommendations([]);
    setStep(0);
  };

  const stepsConfig = [
    { label: 'Rodzaj dachu', icon: <RoofingIcon /> },
    { label: 'Nowa izolacja', icon: <HeightIcon /> },
    { label: 'Stare warstwy', icon: <LayersIcon /> },
    { label: 'Wynik', icon: <CheckCircleIcon /> },
  ];

  function CustomStepIcon(props) {
    const { active, completed } = props;
    const icon = stepsConfig[props.icon - 1].icon;
    return (
      <Box sx={{
        width: 40, height: 40, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: (active || completed) ? 'primary.main' : 'grey.300',
        color: 'white',
        boxShadow: active ? '0 0 0 4px rgba(25, 118, 210, 0.2)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        {icon}
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', py: 4 }}>
        <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: 700, letterSpacing: '-0.5px', color: 'primary.main' }} className="app-title">
          LDTK • Konfigurator 2025
        </Typography>

        {!disclaimerAccepted ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3, width: '100%' }}>
              <DisclaimerStep onAccept={() => setDisclaimerAccepted(true)} />
            </Box>
          </Box>
        ) : !emailSubmitted ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3, width: '100%', maxWidth: 500 }}>
              <EmailStep setEmail={setEmail} nextStep={() => setEmailSubmitted(true)} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1 }}>
            <MuiStepper activeStep={step} alternativeLabel className="stepper-container" sx={{ mb: 4 }}>
              {stepsConfig.map((s, index) => (
                <Step key={s.label} completed={step > index}>
                  <StepLabel StepIconComponent={CustomStepIcon}>
                    <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: step === index ? 600 : 400 }}>
                      {s.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </MuiStepper>

            <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} className="main-content-box">
              {step === 0 && <StepRoofType roofType={formData.roofType} setRoofType={(v) => updateFormData('roofType', v)} errors={errors} nextStep={nextStep} />}
              {step === 1 && <StepNewInsulation newThickness={formData.newThickness} setNewThickness={(v) => updateFormData('newThickness', v)} errors={errors} nextStep={nextStep} prevStep={prevStep} />}
              {step === 2 && <StepOldLayers {...formData} setHasOldInsulation={(v) => updateFormData('hasOldInsulation', v)} setOldThickness={(v) => updateFormData('oldThickness', v)} prevStep={prevStep} onCalculate={calculateRoofSystem} />}
              {step === 3 && <StepResults recommendations={recommendations} prevStep={prevStep} handleStartOver={handleStartOver} {...formData} email={email} themeMode={themeMode} />}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 'auto', pt: 4, textAlign: 'center' }}>
          <FormControlLabel
            control={<Switch checked={themeMode === 'dark'} onChange={() => setThemeMode(mode => mode === 'light' ? 'dark' : 'light')} />}
            label={<Typography variant="body2" color="text.secondary">Tryb Ciemny</Typography>}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;